-- PipeTrak Reporting Infrastructure
-- Migration: 20250811_reporting_infrastructure.sql
-- Purpose: Implement comprehensive reporting system with caching, ROC calculations, and audit trails

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- =============================================================================
-- REPORTING CACHE TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS "ReportingCache" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "projectId" TEXT NOT NULL REFERENCES "Project"(id) ON DELETE CASCADE,
    "reportType" TEXT NOT NULL, -- 'progress_summary', 'component_details', 'test_readiness', 'trend_analysis', 'audit_trail'
    "cacheKey" TEXT NOT NULL, -- Hash of filter parameters
    "filters" JSONB NOT NULL DEFAULT '{}'::jsonb, -- Original filter parameters for validation
    "result" JSONB NOT NULL, -- Cached report result
    "calculatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "expiresAt" TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
    "calculationDuration" INTEGER, -- Milliseconds for performance tracking
    "rowCount" INTEGER, -- Number of records in result
    "createdBy" TEXT REFERENCES "user"(id),
    
    -- Performance indexes
    CONSTRAINT "idx_cache_unique" UNIQUE ("projectId", "reportType", "cacheKey")
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_cache_expiry" ON "ReportingCache" ("expiresAt");
CREATE INDEX IF NOT EXISTS "idx_cache_project_type" ON "ReportingCache" ("projectId", "reportType");
CREATE INDEX IF NOT EXISTS "idx_cache_calculated" ON "ReportingCache" ("calculatedAt" DESC);

-- Auto-cleanup expired cache entries
CREATE INDEX IF NOT EXISTS "idx_cache_cleanup" ON "ReportingCache" ("expiresAt") WHERE "expiresAt" < NOW();

COMMENT ON TABLE "ReportingCache" IS 'Performance cache for expensive report calculations with 5-minute TTL';

-- =============================================================================
-- ROC CONFIGURATIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS "ROCConfigurations" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "organizationId" TEXT NOT NULL REFERENCES "organization"(id) ON DELETE CASCADE,
    "projectId" TEXT REFERENCES "Project"(id) ON DELETE CASCADE, -- NULL = org default
    "componentType" TEXT, -- NULL = applies to all types
    "milestoneWeights" JSONB NOT NULL DEFAULT '{"Receive": 10, "Erect": 30, "Connect": 40, "Test": 15, "Complete": 5}'::jsonb,
    description TEXT,
    "isDefault" BOOLEAN DEFAULT FALSE,
    "effectiveDate" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Audit fields
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "createdBy" TEXT NOT NULL REFERENCES "user"(id),
    
    -- Constraints
    CONSTRAINT "roc_weights_valid" CHECK (jsonb_typeof("milestoneWeights") = 'object'),
    CONSTRAINT "roc_weights_sum_valid" CHECK (
        (SELECT SUM((value)::numeric) FROM jsonb_each_text("milestoneWeights")) <= 100
    )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_roc_org_project" ON "ROCConfigurations" ("organizationId", "projectId");
CREATE INDEX IF NOT EXISTS "idx_roc_effective" ON "ROCConfigurations" ("organizationId", "effectiveDate" DESC);
CREATE INDEX IF NOT EXISTS "idx_roc_component_type" ON "ROCConfigurations" ("organizationId", "componentType");

-- Ensure only one default per organization
CREATE UNIQUE INDEX IF NOT EXISTS "idx_roc_org_default" 
ON "ROCConfigurations" ("organizationId") 
WHERE "isDefault" = TRUE AND "projectId" IS NULL;

-- Updated trigger for ROC configurations
CREATE OR REPLACE FUNCTION update_roc_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_roc_updated ON "ROCConfigurations";
CREATE TRIGGER trigger_roc_updated
    BEFORE UPDATE ON "ROCConfigurations"
    FOR EACH ROW
    EXECUTE FUNCTION update_roc_timestamp();

COMMENT ON TABLE "ROCConfigurations" IS 'Organization-specific milestone weight configurations for ROC calculations';

-- =============================================================================
-- PROGRESS SNAPSHOTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS "ProgressSnapshots" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "projectId" TEXT NOT NULL REFERENCES "Project"(id) ON DELETE CASCADE,
    "snapshotDate" DATE NOT NULL,
    "snapshotTime" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Aggregated metrics
    "totalComponents" INTEGER NOT NULL DEFAULT 0,
    "completedComponents" INTEGER NOT NULL DEFAULT 0,
    "overallCompletionPercent" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "rocWeightedPercent" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    
    -- Area/System breakdown
    "areaBreakdown" JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{"area": "Area-1", "completionPercent": 75.5, "componentCount": 100}]
    "systemBreakdown" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "testPackageBreakdown" JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Velocity metrics
    "dailyVelocity" DECIMAL(8,2), -- Components completed per day
    "weeklyVelocity" DECIMAL(8,2), -- Components completed per week
    "milestoneVelocity" JSONB DEFAULT '{}'::jsonb, -- {"Receive": 5.2, "Erect": 3.1} per day
    
    -- Quality metrics
    "stalledComponents7d" INTEGER DEFAULT 0,
    "stalledComponents14d" INTEGER DEFAULT 0,
    "stalledComponents21d" INTEGER DEFAULT 0,
    
    -- Generation metadata
    "calculationDuration" INTEGER, -- Milliseconds
    "generatedBy" TEXT REFERENCES "user"(id), -- NULL = system generated
    "generationMethod" TEXT DEFAULT 'scheduled', -- 'manual', 'scheduled', 'realtime'
    
    -- Constraints
    CONSTRAINT "completion_percent_valid" CHECK ("overallCompletionPercent" BETWEEN 0 AND 100),
    CONSTRAINT "roc_percent_valid" CHECK ("rocWeightedPercent" BETWEEN 0 AND 100),
    CONSTRAINT "generation_method_valid" CHECK ("generationMethod" IN ('manual', 'scheduled', 'realtime'))
);

-- Performance indexes
CREATE UNIQUE INDEX IF NOT EXISTS "idx_snapshot_project_date" ON "ProgressSnapshots" ("projectId", "snapshotDate");
CREATE INDEX IF NOT EXISTS "idx_snapshot_time" ON "ProgressSnapshots" ("snapshotTime" DESC);
CREATE INDEX IF NOT EXISTS "idx_snapshot_project_time" ON "ProgressSnapshots" ("projectId", "snapshotTime" DESC);

COMMENT ON TABLE "ProgressSnapshots" IS 'Historical progress snapshots for trend analysis and forecasting';

-- =============================================================================
-- REPORT GENERATIONS AUDIT TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS "ReportGenerations" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "projectId" TEXT NOT NULL REFERENCES "Project"(id) ON DELETE CASCADE,
    "reportType" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL REFERENCES "user"(id),
    "requestedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Request details
    filters JSONB NOT NULL DEFAULT '{}'::jsonb,
    "outputFormat" TEXT NOT NULL, -- 'json', 'csv', 'excel', 'pdf'
    "deliveryMethod" TEXT NOT NULL DEFAULT 'download', -- 'download', 'email', 'api'
    
    -- Processing details
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    "startedAt" TIMESTAMPTZ,
    "completedAt" TIMESTAMPTZ,
    duration INTEGER, -- Milliseconds
    
    -- Results
    "resultRowCount" INTEGER,
    "resultSize" BIGINT, -- Bytes
    "downloadUrl" TEXT, -- Supabase Storage signed URL
    "downloadExpires" TIMESTAMPTZ,
    
    -- Error tracking
    "errorMessage" TEXT,
    "errorDetails" JSONB,
    
    -- Performance metadata
    "cacheHit" BOOLEAN DEFAULT FALSE,
    "dbQueryTime" INTEGER, -- Milliseconds
    "exportTime" INTEGER, -- Milliseconds
    "memoryUsage" BIGINT, -- Bytes peak usage
    
    -- Constraints
    CONSTRAINT "status_valid" CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    CONSTRAINT "format_valid" CHECK ("outputFormat" IN ('json', 'csv', 'excel', 'pdf')),
    CONSTRAINT "delivery_valid" CHECK ("deliveryMethod" IN ('download', 'email', 'api'))
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS "idx_report_gen_user" ON "ReportGenerations" ("requestedBy", "requestedAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_report_gen_project" ON "ReportGenerations" ("projectId", "requestedAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_report_gen_status" ON "ReportGenerations" (status, "requestedAt");
CREATE INDEX IF NOT EXISTS "idx_report_gen_type" ON "ReportGenerations" ("reportType", "requestedAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_report_gen_cleanup" ON "ReportGenerations" ("downloadExpires") WHERE "downloadExpires" < NOW();

COMMENT ON TABLE "ReportGenerations" IS 'Audit trail and performance tracking for all report generation requests';

-- =============================================================================
-- MATERIALIZED VIEWS FOR PERFORMANCE
-- =============================================================================

-- Component Progress Summary View
CREATE MATERIALIZED VIEW IF NOT EXISTS "ComponentProgressSummary" AS
SELECT 
    c."projectId",
    COALESCE(c."area", 'Unassigned') as area,
    COALESCE(c."system", 'Unassigned') as system, 
    COALESCE(c."testPackage", 'Unassigned') as "testPackage",
    c.type as "componentType",
    COUNT(*) as "totalCount",
    COUNT(*) FILTER (WHERE c.status = 'COMPLETED') as "completedCount",
    COALESCE(ROUND(AVG(c."completionPercent"), 2), 0) as "avgCompletionPercent",
    
    -- ROC-weighted calculations (using default weights for now)
    COALESCE(ROUND(AVG(
        CASE 
            WHEN c."workflowType" = 'MILESTONE_DISCRETE' THEN c."completionPercent"
            WHEN c."workflowType" = 'MILESTONE_PERCENTAGE' THEN c."completionPercent" 
            WHEN c."workflowType" = 'MILESTONE_QUANTITY' THEN c."completionPercent"
            ELSE c."completionPercent"
        END
    ), 2), 0) as "rocWeightedPercent",
    
    -- Stalled component counts
    COUNT(*) FILTER (WHERE 
        c.status NOT IN ('COMPLETED', 'NOT_STARTED') AND
        NOT EXISTS (
            SELECT 1 FROM "ComponentMilestone" cm 
            WHERE cm."componentId" = c.id 
            AND cm."isCompleted" = true 
            AND cm."completedAt" > NOW() - INTERVAL '7 days'
        )
    ) as "stalledCount7d",
    
    -- Last updated tracking
    MAX(c."updatedAt") as "lastUpdated",
    MAX(COALESCE(
        (SELECT MAX(cm."completedAt") FROM "ComponentMilestone" cm WHERE cm."componentId" = c.id),
        c."updatedAt"
    )) as "lastActivity"
    
FROM "Component" c
WHERE c.status != 'DELETED'
GROUP BY c."projectId", c."area", c."system", c."testPackage", c.type;

-- Performance indexes for materialized view
CREATE UNIQUE INDEX IF NOT EXISTS "idx_comp_progress_unique" 
ON "ComponentProgressSummary" ("projectId", area, system, "testPackage", "componentType");

CREATE INDEX IF NOT EXISTS "idx_comp_progress_project" ON "ComponentProgressSummary" ("projectId");
CREATE INDEX IF NOT EXISTS "idx_comp_progress_completion" ON "ComponentProgressSummary" ("avgCompletionPercent");

-- Test Package Readiness View
CREATE MATERIALIZED VIEW IF NOT EXISTS "TestPackageReadiness" AS
SELECT 
    c."projectId",
    COALESCE(c."testPackage", 'Unassigned') as "testPackage",
    COUNT(*) as "totalComponents",
    COUNT(*) FILTER (WHERE c.status = 'COMPLETED') as "completedComponents",
    COUNT(*) FILTER (WHERE c."completionPercent" = 100) as "fullyCompleteComponents",
    COALESCE(ROUND(AVG(c."completionPercent"), 2), 0) as "avgCompletionPercent",
    
    -- Readiness calculation (all components must be 100% for testing)
    CASE 
        WHEN COUNT(*) FILTER (WHERE c."completionPercent" < 100) = 0 AND COUNT(*) > 0 THEN true
        ELSE false
    END as "isReady",
    
    -- Blocking components (incomplete milestones that prevent testing)
    COUNT(*) FILTER (WHERE 
        c."completionPercent" < 100 AND
        EXISTS (
            SELECT 1 FROM "ComponentMilestone" cm 
            WHERE cm."componentId" = c.id 
            AND cm."milestoneName" IN ('Connect', 'Test', 'Pressure_Test')
            AND cm."isCompleted" = false
        )
    ) as "blockingComponents",
    
    -- Estimated ready date based on current velocity
    CASE 
        WHEN COUNT(*) FILTER (WHERE c."completionPercent" < 100) = 0 THEN NOW()
        ELSE NOW() + (
            COUNT(*) FILTER (WHERE c."completionPercent" < 100) * INTERVAL '1 day' / 
            GREATEST(1, (
                SELECT COALESCE(AVG(daily_completions), 1) FROM (
                    SELECT COUNT(*) as daily_completions
                    FROM "ComponentMilestone" cm2
                    JOIN "Component" c2 ON cm2."componentId" = c2.id
                    WHERE c2."testPackage" = c."testPackage"
                    AND cm2."completedAt" > NOW() - INTERVAL '7 days'
                    GROUP BY DATE(cm2."completedAt")
                ) recent_activity
            ))
        )
    END as "estimatedReadyDate",
    
    MAX(c."updatedAt") as "lastUpdated"
    
FROM "Component" c
WHERE c."testPackage" IS NOT NULL AND c.status != 'DELETED'
GROUP BY c."projectId", c."testPackage";

-- Performance indexes
CREATE UNIQUE INDEX IF NOT EXISTS "idx_test_package_unique" 
ON "TestPackageReadiness" ("projectId", "testPackage");

CREATE INDEX IF NOT EXISTS "idx_test_package_ready" ON "TestPackageReadiness" ("isReady", "projectId");

-- =============================================================================
-- UTILITY FUNCTIONS
-- =============================================================================

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_reporting_views(p_project_id TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Refresh materialized views concurrently if possible
    BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY "ComponentProgressSummary";
    EXCEPTION WHEN OTHERS THEN
        REFRESH MATERIALIZED VIEW "ComponentProgressSummary";
    END;
    
    BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY "TestPackageReadiness";
    EXCEPTION WHEN OTHERS THEN
        REFRESH MATERIALIZED VIEW "TestPackageReadiness";
    END;
    
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Failed to refresh materialized views: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM "ReportingCache" WHERE "expiresAt" < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Also cleanup expired report generations
    DELETE FROM "ReportGenerations" 
    WHERE "downloadExpires" IS NOT NULL 
    AND "downloadExpires" < NOW() 
    AND status IN ('completed', 'failed');
    
    RETURN deleted_count;
END;
$$;

-- Function to generate cache key from filters
CREATE OR REPLACE FUNCTION generate_cache_key(
    p_report_type TEXT,
    p_filters JSONB,
    p_project_id TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    RETURN encode(
        digest(
            p_report_type || ':' || p_project_id || ':' || p_filters::text,
            'sha256'
        ),
        'hex'
    );
END;
$$;

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- Enable RLS on all reporting tables
ALTER TABLE "ReportingCache" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ROCConfigurations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProgressSnapshots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReportGenerations" ENABLE ROW LEVEL SECURITY;

-- ReportingCache policies
CREATE POLICY "Users can access reporting cache for their organization projects" ON "ReportingCache"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "Project" p
            JOIN "organization" o ON p."organizationId" = o.id
            JOIN "member" m ON o.id = m."organizationId"
            WHERE p.id = "ReportingCache"."projectId"
            AND m."userId" = auth.uid()
        )
    );

-- ROCConfigurations policies
CREATE POLICY "Users can view ROC configurations for their organization" ON "ROCConfigurations"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "member" m
            WHERE m."organizationId" = "ROCConfigurations"."organizationId"
            AND m."userId" = auth.uid()
        )
    );

CREATE POLICY "Organization admins can manage ROC configurations" ON "ROCConfigurations"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "member" m
            WHERE m."organizationId" = "ROCConfigurations"."organizationId"
            AND m."userId" = auth.uid()
            AND m.role IN ('owner', 'admin')
        )
    );

-- ProgressSnapshots policies
CREATE POLICY "Users can access progress snapshots for their organization projects" ON "ProgressSnapshots"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "Project" p
            JOIN "organization" o ON p."organizationId" = o.id
            JOIN "member" m ON o.id = m."organizationId"
            WHERE p.id = "ProgressSnapshots"."projectId"
            AND m."userId" = auth.uid()
        )
    );

-- ReportGenerations policies
CREATE POLICY "Users can access their own report generations" ON "ReportGenerations"
    FOR ALL USING (
        "requestedBy" = auth.uid() OR
        EXISTS (
            SELECT 1 FROM "Project" p
            JOIN "organization" o ON p."organizationId" = o.id
            JOIN "member" m ON o.id = m."organizationId"
            WHERE p.id = "ReportGenerations"."projectId"
            AND m."userId" = auth.uid()
            AND m.role IN ('owner', 'admin')
        )
    );

-- =============================================================================
-- PERMISSIONS
-- =============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON "ReportingCache" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "ROCConfigurations" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "ProgressSnapshots" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "ReportGenerations" TO authenticated;

-- Grant access to materialized views
GRANT SELECT ON "ComponentProgressSummary" TO authenticated;
GRANT SELECT ON "TestPackageReadiness" TO authenticated;

-- Grant execute permissions on utility functions
GRANT EXECUTE ON FUNCTION refresh_reporting_views(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_cache() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_cache_key(TEXT, JSONB, TEXT) TO authenticated;

-- =============================================================================
-- DEFAULT DATA
-- =============================================================================

-- Insert default ROC configuration for new organizations (will be handled by application logic)
-- Default milestone weights: Receive: 10%, Erect: 30%, Connect: 40%, Test: 15%, Complete: 5%

-- Enable realtime for reporting tables
ALTER PUBLICATION supabase_realtime ADD TABLE "ReportGenerations";
ALTER PUBLICATION supabase_realtime ADD TABLE "ProgressSnapshots";

COMMENT ON SCHEMA public IS 'PipeTrak Reporting Infrastructure - Migration 20250811';