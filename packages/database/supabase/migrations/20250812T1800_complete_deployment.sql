-- COMPLETE PROGRESS SUMMARY REPORT DEPLOYMENT
-- Run this single file to deploy everything needed for the Progress Summary Report

-- ========================================
-- STEP 1: Create ProgressSnapshot table
-- ========================================

CREATE TABLE IF NOT EXISTS "ProgressSnapshot" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "projectId" TEXT NOT NULL,
    "weekEnding" DATE NOT NULL,
    "snapshotData" JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'PRELIMINARY' CHECK (status IN ('PRELIMINARY', 'FINAL')),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Foreign key to Project table
    CONSTRAINT fk_progress_snapshot_project
        FOREIGN KEY ("projectId") 
        REFERENCES "Project"(id) 
        ON DELETE CASCADE
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_progress_snapshot_project 
    ON "ProgressSnapshot"("projectId");

CREATE INDEX IF NOT EXISTS idx_progress_snapshot_week_ending 
    ON "ProgressSnapshot"("weekEnding");

CREATE INDEX IF NOT EXISTS idx_progress_snapshot_status 
    ON "ProgressSnapshot"(status);

CREATE INDEX IF NOT EXISTS idx_progress_snapshot_composite 
    ON "ProgressSnapshot"("projectId", "weekEnding", status, "createdAt" DESC);

-- Grant permissions
GRANT SELECT ON "ProgressSnapshot" TO authenticated;
GRANT INSERT ON "ProgressSnapshot" TO authenticated;
GRANT UPDATE ON "ProgressSnapshot" TO authenticated;
GRANT DELETE ON "ProgressSnapshot" TO service_role;

-- Add RLS policies
ALTER TABLE "ProgressSnapshot" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view snapshots for projects in their organization
CREATE POLICY "Users can view progress snapshots"
    ON "ProgressSnapshot"
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM "Project" p
            WHERE p.id = "ProgressSnapshot"."projectId"
              AND p."organizationId" IN (
                  SELECT "organizationId"
                  FROM public.member
                  WHERE "userId" = auth.uid()::TEXT
              )
        )
    );

-- Policy: Users can create snapshots for projects in their organization
CREATE POLICY "Users can create progress snapshots"
    ON "ProgressSnapshot"
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM "Project" p
            WHERE p.id = "ProgressSnapshot"."projectId"
              AND p."organizationId" IN (
                  SELECT "organizationId"
                  FROM public.member
                  WHERE "userId" = auth.uid()::TEXT
              )
        )
    );

-- Policy: Users can update snapshots for projects in their organization (before FINAL status)
CREATE POLICY "Users can update progress snapshots"
    ON "ProgressSnapshot"
    FOR UPDATE
    TO authenticated
    USING (
        status = 'PRELIMINARY' AND
        EXISTS (
            SELECT 1
            FROM "Project" p
            WHERE p.id = "ProgressSnapshot"."projectId"
              AND p."organizationId" IN (
                  SELECT "organizationId"
                  FROM public.member
                  WHERE "userId" = auth.uid()::TEXT
              )
        )
    );

-- ========================================
-- STEP 2: Create Progress Summary Functions
-- ========================================

-- Function to get the last Sunday (week ending date) for a given date
CREATE OR REPLACE FUNCTION get_week_ending_date(input_date DATE)
RETURNS DATE
LANGUAGE plpgsql
AS $$
BEGIN
    -- If input is already Sunday, return it, otherwise return previous Sunday
    IF EXTRACT(DOW FROM input_date) = 0 THEN
        RETURN input_date;
    ELSE
        RETURN input_date - INTERVAL '1 day' * EXTRACT(DOW FROM input_date);
    END IF;
END;
$$;

-- Function to check if backdating is allowed (before Tuesday 9 AM cutoff)
CREATE OR REPLACE FUNCTION is_backdating_allowed(
    effective_date DATE,
    check_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    last_sunday DATE;
    tuesday_cutoff TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get last Sunday (end of reporting period)
    last_sunday := get_week_ending_date(check_timestamp::DATE);
    
    -- Calculate Tuesday 9 AM cutoff for the current week
    tuesday_cutoff := (last_sunday + INTERVAL '2 days')::DATE + TIME '09:00:00';
    
    -- Rule 1: Cannot future date
    IF effective_date > check_timestamp::DATE THEN
        RETURN FALSE;
    END IF;
    
    -- Rule 2: Cannot backdate beyond grace period
    IF check_timestamp > tuesday_cutoff AND effective_date < last_sunday THEN
        RETURN FALSE;
    END IF;
    
    -- Rule 3: Cannot modify data older than 1 week
    IF effective_date < (last_sunday - INTERVAL '7 days')::DATE THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- Function to calculate milestone completion percentage for a component
CREATE OR REPLACE FUNCTION calculate_milestone_completion_percent(
    component_id_param TEXT,
    milestone_name_param TEXT,
    as_of_date DATE
)
RETURNS DECIMAL
LANGUAGE plpgsql
AS $$
DECLARE
    completion_percent DECIMAL;
BEGIN
    SELECT 
        CASE 
            WHEN cm."isCompleted" = true THEN 100.00
            ELSE COALESCE(cm."percentageValue", 0.00)
        END INTO completion_percent
    FROM "ComponentMilestone" cm
    WHERE cm."componentId" = component_id_param
      AND cm."milestoneName" = milestone_name_param
      AND (cm."effectiveDate" IS NULL OR cm."effectiveDate" <= as_of_date)
    ORDER BY cm."effectiveDate" DESC NULLS LAST
    LIMIT 1;
    
    RETURN COALESCE(completion_percent, 0.00);
END;
$$;

-- Function to calculate progress by area for a project and week
CREATE OR REPLACE FUNCTION calculate_progress_by_area(
    project_id_param TEXT,
    week_ending_date DATE
)
RETURNS TABLE(
    area TEXT,
    component_count BIGINT,
    received_percent DECIMAL(5,2),
    installed_percent DECIMAL(5,2),
    punched_percent DECIMAL(5,2),
    tested_percent DECIMAL(5,2),
    restored_percent DECIMAL(5,2),
    overall_percent DECIMAL(5,2)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH component_progress AS (
        SELECT 
            c.area,
            c.id as component_id,
            calculate_milestone_completion_percent(c.id, 'Receive', week_ending_date) as received,
            calculate_milestone_completion_percent(c.id, 'Install', week_ending_date) as installed,
            calculate_milestone_completion_percent(c.id, 'Punch', week_ending_date) as punched,
            calculate_milestone_completion_percent(c.id, 'Test', week_ending_date) as tested,
            calculate_milestone_completion_percent(c.id, 'Restore', week_ending_date) as restored
        FROM "Component" c
        WHERE c."projectId" = project_id_param
          AND c.area IS NOT NULL
    )
    SELECT 
        cp.area::TEXT,
        COUNT(cp.component_id) as component_count,
        ROUND(AVG(cp.received), 2) as received_percent,
        ROUND(AVG(cp.installed), 2) as installed_percent,
        ROUND(AVG(cp.punched), 2) as punched_percent,
        ROUND(AVG(cp.tested), 2) as tested_percent,
        ROUND(AVG(cp.restored), 2) as restored_percent,
        ROUND((AVG(cp.received) + AVG(cp.installed) + AVG(cp.punched) + AVG(cp.tested) + AVG(cp.restored)) / 5, 2) as overall_percent
    FROM component_progress cp
    GROUP BY cp.area
    ORDER BY cp.area;
END;
$$;

-- Function to calculate progress by system for a project and week  
CREATE OR REPLACE FUNCTION calculate_progress_by_system(
    project_id_param TEXT,
    week_ending_date DATE
)
RETURNS TABLE(
    system_name TEXT,
    component_count BIGINT,
    received_percent DECIMAL(5,2),
    installed_percent DECIMAL(5,2),
    punched_percent DECIMAL(5,2),
    tested_percent DECIMAL(5,2),
    restored_percent DECIMAL(5,2),
    overall_percent DECIMAL(5,2)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH component_progress AS (
        SELECT 
            c."system",
            c.id as component_id,
            calculate_milestone_completion_percent(c.id, 'Receive', week_ending_date) as received,
            calculate_milestone_completion_percent(c.id, 'Install', week_ending_date) as installed,
            calculate_milestone_completion_percent(c.id, 'Punch', week_ending_date) as punched,
            calculate_milestone_completion_percent(c.id, 'Test', week_ending_date) as tested,
            calculate_milestone_completion_percent(c.id, 'Restore', week_ending_date) as restored
        FROM "Component" c
        WHERE c."projectId" = project_id_param
          AND c."system" IS NOT NULL
    )
    SELECT 
        cp."system"::TEXT as system_name,
        COUNT(cp.component_id) as component_count,
        ROUND(AVG(cp.received), 2) as received_percent,
        ROUND(AVG(cp.installed), 2) as installed_percent,
        ROUND(AVG(cp.punched), 2) as punched_percent,
        ROUND(AVG(cp.tested), 2) as tested_percent,
        ROUND(AVG(cp.restored), 2) as restored_percent,
        ROUND((AVG(cp.received) + AVG(cp.installed) + AVG(cp.punched) + AVG(cp.tested) + AVG(cp.restored)) / 5, 2) as overall_percent
    FROM component_progress cp
    GROUP BY cp."system"
    ORDER BY cp."system";
END;
$$;

-- Function to calculate progress by test package for a project and week
CREATE OR REPLACE FUNCTION calculate_progress_by_test_package(
    project_id_param TEXT,
    week_ending_date DATE
)
RETURNS TABLE(
    test_package TEXT,
    component_count BIGINT,
    received_percent DECIMAL(5,2),
    installed_percent DECIMAL(5,2),
    punched_percent DECIMAL(5,2),
    tested_percent DECIMAL(5,2),
    restored_percent DECIMAL(5,2),
    overall_percent DECIMAL(5,2)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH component_progress AS (
        SELECT 
            c."testPackage",
            c.id as component_id,
            calculate_milestone_completion_percent(c.id, 'Receive', week_ending_date) as received,
            calculate_milestone_completion_percent(c.id, 'Install', week_ending_date) as installed,
            calculate_milestone_completion_percent(c.id, 'Punch', week_ending_date) as punched,
            calculate_milestone_completion_percent(c.id, 'Test', week_ending_date) as tested,
            calculate_milestone_completion_percent(c.id, 'Restore', week_ending_date) as restored
        FROM "Component" c
        WHERE c."projectId" = project_id_param
          AND c."testPackage" IS NOT NULL
    )
    SELECT 
        cp."testPackage"::TEXT,
        COUNT(cp.component_id) as component_count,
        ROUND(AVG(cp.received), 2) as received_percent,
        ROUND(AVG(cp.installed), 2) as installed_percent,
        ROUND(AVG(cp.punched), 2) as punched_percent,
        ROUND(AVG(cp.tested), 2) as tested_percent,
        ROUND(AVG(cp.restored), 2) as restored_percent,
        ROUND((AVG(cp.received) + AVG(cp.installed) + AVG(cp.punched) + AVG(cp.tested) + AVG(cp.restored)) / 5, 2) as overall_percent
    FROM component_progress cp
    GROUP BY cp."testPackage"
    ORDER BY cp."testPackage";
END;
$$;

-- Function to store a progress snapshot
CREATE OR REPLACE FUNCTION store_progress_snapshot(
    project_id_param TEXT,
    week_ending_param DATE,
    snapshot_data_param JSONB
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    snapshot_id TEXT;
    is_final BOOLEAN;
    cutoff_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calculate Tuesday 9 AM cutoff
    cutoff_time := (week_ending_param + INTERVAL '2 days')::DATE + TIME '09:00:00';
    
    -- Determine if snapshot is FINAL or PRELIMINARY
    is_final := NOW() >= cutoff_time;
    
    -- Generate unique ID
    snapshot_id := gen_random_uuid()::TEXT;
    
    -- Insert snapshot
    INSERT INTO "ProgressSnapshot" (
        id,
        "projectId",
        "weekEnding",
        "snapshotData",
        status,
        "createdAt"
    ) VALUES (
        snapshot_id,
        project_id_param,
        week_ending_param,
        snapshot_data_param,
        CASE WHEN is_final THEN 'FINAL' ELSE 'PRELIMINARY' END,
        NOW()
    );
    
    RETURN snapshot_id;
END;
$$;

-- Function to get the latest snapshot for a project and week
CREATE OR REPLACE FUNCTION get_latest_snapshot(
    project_id_param TEXT,
    week_ending_param DATE
)
RETURNS TABLE(
    id TEXT,
    project_id TEXT,
    week_ending DATE,
    snapshot_data JSONB,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ps.id,
        ps."projectId",
        ps."weekEnding",
        ps."snapshotData",
        ps.status,
        ps."createdAt"
    FROM "ProgressSnapshot" ps
    WHERE ps."projectId" = project_id_param
      AND ps."weekEnding" = week_ending_param
    ORDER BY ps."createdAt" DESC
    LIMIT 1;
END;
$$;

-- Grant permissions on functions
GRANT EXECUTE ON FUNCTION get_week_ending_date TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION is_backdating_allowed TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION calculate_milestone_completion_percent TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION calculate_progress_by_area TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION calculate_progress_by_system TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION calculate_progress_by_test_package TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION store_progress_snapshot TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_latest_snapshot TO authenticated, service_role;

-- Create indexes for performance on ComponentMilestone
CREATE INDEX IF NOT EXISTS idx_component_milestone_effective 
ON "ComponentMilestone"("componentId", "effectiveDate", "milestoneName");

-- ========================================
-- STEP 3: Verify Installation
-- ========================================

DO $$
DECLARE
    table_exists BOOLEAN;
    function_count INTEGER;
BEGIN
    -- Check if ProgressSnapshot table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'ProgressSnapshot'
    ) INTO table_exists;
    
    -- Count created functions
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines
    WHERE routine_name IN (
        'get_week_ending_date',
        'is_backdating_allowed',
        'calculate_milestone_completion_percent',
        'calculate_progress_by_area',
        'calculate_progress_by_system',
        'calculate_progress_by_test_package',
        'store_progress_snapshot',
        'get_latest_snapshot'
    );
    
    -- Report results
    IF table_exists AND function_count = 8 THEN
        RAISE NOTICE '✅ Progress Summary Report deployment successful!';
        RAISE NOTICE '   - ProgressSnapshot table created';
        RAISE NOTICE '   - All 8 functions created';
        RAISE NOTICE '   - Indexes created';
        RAISE NOTICE '   - Permissions granted';
        RAISE NOTICE '   - RLS policies applied';
    ELSE
        RAISE WARNING '⚠️ Deployment incomplete. Table exists: %, Functions created: %/8', table_exists, function_count;
    END IF;
END;
$$;