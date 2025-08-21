-- PipeTrak Reporting System Fixes
-- Migration: 20250811_reporting_fixes.sql
-- Purpose: Fix issues in reporting RPC functions and add missing functionality

-- =============================================================================
-- FIX: Component Milestone Quantity Max Field
-- =============================================================================

-- Add quantityMax field to ComponentMilestone if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ComponentMilestone' 
        AND column_name = 'quantityMax'
    ) THEN
        ALTER TABLE "ComponentMilestone" ADD COLUMN "quantityMax" DECIMAL(10,2);
        
        -- Update existing quantity milestones with a default max based on component total quantity
        UPDATE "ComponentMilestone" cm
        SET "quantityMax" = (
            SELECT c."totalQuantity" 
            FROM "Component" c 
            WHERE c.id = cm."componentId"
        )
        WHERE cm."quantityValue" IS NOT NULL
        AND cm."quantityMax" IS NULL;
    END IF;
END $$;

-- =============================================================================
-- FIX: AuditLog metadata field
-- =============================================================================

-- Add metadata field to AuditLog if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'AuditLog' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE "AuditLog" ADD COLUMN "metadata" JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- =============================================================================
-- FIX: Update ROC Calculation Function
-- =============================================================================

CREATE OR REPLACE FUNCTION calculate_roc_weighted_progress(
    p_project_id TEXT,
    p_filters JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_result JSONB;
    v_roc_config JSONB;
    v_area_filter TEXT[];
    v_system_filter TEXT[];
    v_test_package_filter TEXT[];
    v_component_type_filter TEXT[];
    v_status_filter TEXT[];
    v_start_time TIMESTAMPTZ;
    v_calculation_duration INTEGER;
    v_cache_key TEXT;
    v_cached_result JSONB;
BEGIN
    v_start_time := clock_timestamp();
    
    -- Validate project access through RLS
    IF NOT EXISTS(
        SELECT 1 FROM "Project" p
        JOIN "organization" o ON p."organizationId" = o.id
        JOIN "member" m ON o.id = m."organizationId"
        WHERE p.id = p_project_id
        AND m."userId" = auth.uid()
    ) THEN
        RETURN jsonb_build_object('error', 'Project not found or access denied');
    END IF;
    
    -- Generate cache key
    v_cache_key := generate_cache_key('roc_weighted_progress', p_filters, p_project_id);
    
    -- Check cache first
    SELECT result INTO v_cached_result
    FROM "ReportingCache"
    WHERE "projectId" = p_project_id
    AND "reportType" = 'roc_weighted_progress'
    AND "cacheKey" = v_cache_key
    AND "expiresAt" > NOW();
    
    IF v_cached_result IS NOT NULL THEN
        RETURN jsonb_build_object(
            'data', v_cached_result,
            'cached', true,
            'generatedAt', extract(epoch from NOW())
        );
    END IF;
    
    -- Extract filters
    v_area_filter := CASE 
        WHEN p_filters ? 'areas' THEN 
            ARRAY(SELECT jsonb_array_elements_text(p_filters->'areas'))
        ELSE NULL 
    END;
    
    v_system_filter := CASE 
        WHEN p_filters ? 'systems' THEN 
            ARRAY(SELECT jsonb_array_elements_text(p_filters->'systems'))
        ELSE NULL 
    END;
    
    v_test_package_filter := CASE 
        WHEN p_filters ? 'testPackages' THEN 
            ARRAY(SELECT jsonb_array_elements_text(p_filters->'testPackages'))
        ELSE NULL 
    END;
    
    v_component_type_filter := CASE 
        WHEN p_filters ? 'componentTypes' THEN 
            ARRAY(SELECT jsonb_array_elements_text(p_filters->'componentTypes'))
        ELSE NULL 
    END;
    
    v_status_filter := CASE 
        WHEN p_filters ? 'statuses' THEN 
            ARRAY(SELECT jsonb_array_elements_text(p_filters->'statuses'))
        ELSE NULL 
    END;
    
    -- Get ROC configuration for this project/organization
    SELECT COALESCE(
        -- Project-specific configuration
        (SELECT "milestoneWeights" FROM "ROCConfigurations" 
         WHERE "projectId" = p_project_id AND "effectiveDate" <= NOW() 
         ORDER BY "effectiveDate" DESC LIMIT 1),
        -- Organization default configuration
        (SELECT "milestoneWeights" FROM "ROCConfigurations" rc
         JOIN "Project" p ON p."organizationId" = rc."organizationId"
         WHERE p.id = p_project_id AND rc."isDefault" = true AND rc."projectId" IS NULL
         ORDER BY rc."effectiveDate" DESC LIMIT 1),
        -- System default weights
        '{"Receive": 10, "Erect": 30, "Connect": 40, "Test": 15, "Complete": 5}'::jsonb
    ) INTO v_roc_config;
    
    -- Calculate ROC-weighted progress with filters
    WITH filtered_components AS (
        SELECT 
            c.*,
            COALESCE(c."area", 'Unassigned') as area_clean,
            COALESCE(c."system", 'Unassigned') as system_clean,
            COALESCE(c."testPackage", 'Unassigned') as test_package_clean
        FROM "Component" c
        WHERE c."projectId" = p_project_id
        AND c.status != 'DELETED'
        AND (v_area_filter IS NULL OR c."area" = ANY(v_area_filter))
        AND (v_system_filter IS NULL OR c."system" = ANY(v_system_filter))
        AND (v_test_package_filter IS NULL OR c."testPackage" = ANY(v_test_package_filter))
        AND (v_component_type_filter IS NULL OR c.type = ANY(v_component_type_filter))
        AND (v_status_filter IS NULL OR c.status::text = ANY(v_status_filter))
    ),
    component_roc_calculations AS (
        SELECT 
            fc.*,
            -- Calculate ROC-weighted percentage for each component
            CASE 
                WHEN fc."workflowType" = 'MILESTONE_DISCRETE' THEN
                    COALESCE((
                        SELECT SUM(
                            CASE WHEN cm."isCompleted" THEN 
                                COALESCE((v_roc_config->>cm."milestoneName")::numeric, 0)
                            ELSE 0 END
                        )
                        FROM "ComponentMilestone" cm 
                        WHERE cm."componentId" = fc.id
                    ), 0)
                WHEN fc."workflowType" = 'MILESTONE_PERCENTAGE' THEN
                    COALESCE((
                        SELECT SUM(
                            CASE WHEN cm."isCompleted" THEN 
                                COALESCE((v_roc_config->>cm."milestoneName")::numeric, 0) * 
                                COALESCE(cm."percentageValue", 100) / 100.0
                            ELSE 0 END
                        )
                        FROM "ComponentMilestone" cm 
                        WHERE cm."componentId" = fc.id
                    ), 0)
                WHEN fc."workflowType" = 'MILESTONE_QUANTITY' THEN
                    COALESCE((
                        SELECT SUM(
                            CASE WHEN cm."isCompleted" THEN 
                                COALESCE((v_roc_config->>cm."milestoneName")::numeric, 0) *
                                LEAST(
                                    COALESCE(cm."quantityValue", 0) / 
                                    NULLIF(COALESCE(cm."quantityMax", fc."totalQuantity", 1), 0), 
                                    1.0
                                )
                            ELSE 0 END
                        )
                        FROM "ComponentMilestone" cm 
                        WHERE cm."componentId" = fc.id
                    ), 0)
                ELSE fc."completionPercent" -- Fallback to simple percentage
            END as roc_weighted_percent
        FROM filtered_components fc
    ),
    summary_stats AS (
        SELECT 
            COUNT(*) as total_components,
            COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_components,
            ROUND(AVG("completionPercent"), 2) as avg_completion_percent,
            ROUND(AVG(roc_weighted_percent), 2) as avg_roc_weighted_percent
        FROM component_roc_calculations crc
    ),
    area_breakdown AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'area', area_clean,
                'totalCount', COUNT(*),
                'completedCount', COUNT(*) FILTER (WHERE status = 'COMPLETED'),
                'avgCompletionPercent', ROUND(AVG("completionPercent"), 2),
                'avgROCPercent', ROUND(AVG(roc_weighted_percent), 2)
            )
        ) as areas
        FROM component_roc_calculations crc
        WHERE area_clean IS NOT NULL
        GROUP BY area_clean
    ),
    system_breakdown AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'system', system_clean,
                'totalCount', COUNT(*),
                'completedCount', COUNT(*) FILTER (WHERE status = 'COMPLETED'),
                'avgCompletionPercent', ROUND(AVG("completionPercent"), 2),
                'avgROCPercent', ROUND(AVG(roc_weighted_percent), 2)
            )
        ) as systems
        FROM component_roc_calculations crc
        WHERE system_clean IS NOT NULL
        GROUP BY system_clean
    ),
    test_package_breakdown AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'testPackage', test_package_clean,
                'totalCount', COUNT(*),
                'completedCount', COUNT(*) FILTER (WHERE status = 'COMPLETED'),
                'avgCompletionPercent', ROUND(AVG("completionPercent"), 2),
                'avgROCPercent', ROUND(AVG(roc_weighted_percent), 2),
                'isReady', (COUNT(*) FILTER (WHERE "completionPercent" < 100) = 0)
            )
        ) as test_packages
        FROM component_roc_calculations crc
        WHERE test_package_clean IS NOT NULL
        GROUP BY test_package_clean
    )
    SELECT jsonb_build_object(
        'summary', jsonb_build_object(
            'totalComponents', ss.total_components,
            'completedComponents', ss.completed_components,
            'overallCompletionPercent', ss.avg_completion_percent,
            'rocWeightedPercent', ss.avg_roc_weighted_percent,
            'rocConfiguration', v_roc_config
        ),
        'breakdowns', jsonb_build_object(
            'areas', COALESCE(ab.areas, '[]'::jsonb),
            'systems', COALESCE(sb.systems, '[]'::jsonb),
            'testPackages', COALESCE(tpb.test_packages, '[]'::jsonb)
        ),
        'filters', p_filters
    ) INTO v_result
    FROM summary_stats ss, area_breakdown ab, system_breakdown sb, test_package_breakdown tpb;
    
    -- Calculate duration
    v_calculation_duration := EXTRACT(milliseconds FROM clock_timestamp() - v_start_time)::INTEGER;
    
    -- Cache the result
    INSERT INTO "ReportingCache" (
        "projectId", "reportType", "cacheKey", "filters", "result", 
        "calculationDuration", "rowCount", "createdBy"
    ) VALUES (
        p_project_id, 'roc_weighted_progress', v_cache_key, p_filters, v_result,
        v_calculation_duration, (v_result->'summary'->>'totalComponents')::INTEGER, auth.uid()
    ) ON CONFLICT ("projectId", "reportType", "cacheKey") DO UPDATE SET
        "result" = EXCLUDED."result",
        "calculatedAt" = NOW(),
        "expiresAt" = NOW() + INTERVAL '5 minutes',
        "calculationDuration" = EXCLUDED."calculationDuration";
    
    RETURN jsonb_build_object(
        'data', v_result,
        'cached', false,
        'calculationDuration', v_calculation_duration,
        'generatedAt', extract(epoch from NOW())
    );
END;
$$;

-- =============================================================================
-- CREATE REPORT PROCESSING EDGE FUNCTION
-- =============================================================================

-- Function to trigger Edge Function for heavy report processing
CREATE OR REPLACE FUNCTION trigger_heavy_report_processing(
    p_project_id TEXT,
    p_report_type TEXT,
    p_filters JSONB DEFAULT '{}'::jsonb,
    p_options JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_report_generation_id TEXT;
    v_result JSONB;
BEGIN
    -- Validate project access
    IF NOT EXISTS(
        SELECT 1 FROM "Project" p
        JOIN "organization" o ON p."organizationId" = o.id
        JOIN "member" m ON o.id = m."organizationId"
        WHERE p.id = p_project_id
        AND m."userId" = auth.uid()
    ) THEN
        RETURN jsonb_build_object('error', 'Project not found or access denied');
    END IF;
    
    -- Create report generation record
    INSERT INTO "ReportGenerations" (
        "projectId", "reportType", "requestedBy", "filters",
        "outputFormat", "deliveryMethod", "status"
    ) VALUES (
        p_project_id, p_report_type, auth.uid(), p_filters,
        COALESCE(p_options->>'outputFormat', 'json'), 
        COALESCE(p_options->>'deliveryMethod', 'download'),
        'pending'
    ) RETURNING id INTO v_report_generation_id;
    
    -- The Edge Function will be triggered by the realtime subscription
    -- or can be called directly via HTTP
    
    RETURN jsonb_build_object(
        'success', true,
        'reportGenerationId', v_report_generation_id,
        'status', 'pending',
        'message', 'Report processing has been queued'
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION trigger_heavy_report_processing(TEXT, TEXT, JSONB, JSONB) TO authenticated;

-- =============================================================================
-- CREATE REPORT CACHE WARMING FUNCTION
-- =============================================================================

-- Function to pre-warm report cache for common queries
CREATE OR REPLACE FUNCTION warm_report_cache(
    p_project_id TEXT,
    p_report_types TEXT[] DEFAULT ARRAY['roc_weighted_progress', 'progress_report']
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_report_type TEXT;
    v_result JSONB;
    v_results JSONB := '[]'::jsonb;
    v_start_time TIMESTAMPTZ := clock_timestamp();
    v_total_duration INTEGER;
BEGIN
    -- Validate project access
    IF NOT EXISTS(
        SELECT 1 FROM "Project" p
        JOIN "organization" o ON p."organizationId" = o.id
        JOIN "member" m ON o.id = m."organizationId"
        WHERE p.id = p_project_id
        AND m."userId" = auth.uid()
    ) THEN
        RETURN jsonb_build_object('error', 'Project not found or access denied');
    END IF;
    
    -- Warm cache for each report type
    FOREACH v_report_type IN ARRAY p_report_types
    LOOP
        CASE v_report_type
            WHEN 'roc_weighted_progress' THEN
                SELECT calculate_roc_weighted_progress(p_project_id, '{}'::jsonb) INTO v_result;
            WHEN 'progress_report' THEN
                SELECT generate_progress_report(p_project_id, '{}'::jsonb) INTO v_result;
            WHEN 'test_package_readiness' THEN
                SELECT get_test_package_readiness_detailed(p_project_id, '{}'::jsonb) INTO v_result;
            ELSE
                v_result := jsonb_build_object('error', 'Unknown report type: ' || v_report_type);
        END CASE;
        
        v_results := v_results || jsonb_build_object(
            'reportType', v_report_type,
            'success', NOT (v_result ? 'error'),
            'cached', COALESCE(v_result->>'cached', 'false')::boolean,
            'calculationDuration', COALESCE(v_result->>'calculationDuration', '0')::integer
        );
    END LOOP;
    
    v_total_duration := EXTRACT(milliseconds FROM clock_timestamp() - v_start_time)::INTEGER;
    
    RETURN jsonb_build_object(
        'success', true,
        'projectId', p_project_id,
        'reportTypes', p_report_types,
        'results', v_results,
        'totalDuration', v_total_duration,
        'warmedAt', extract(epoch from NOW())
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION warm_report_cache(TEXT, TEXT[]) TO authenticated;

-- =============================================================================
-- CREATE COMPONENT STATUS VALIDATION
-- =============================================================================

-- Fix potential HOLD status issue in progress report
CREATE OR REPLACE FUNCTION generate_progress_report(
    p_project_id TEXT,
    p_options JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_result JSONB;
    v_start_time TIMESTAMPTZ;
    v_calculation_duration INTEGER;
    v_cache_key TEXT;
    v_cached_result JSONB;
    v_include_trends BOOLEAN;
    v_include_velocity BOOLEAN;
    v_include_forecasts BOOLEAN;
BEGIN
    v_start_time := clock_timestamp();
    
    -- Validate project access
    IF NOT EXISTS(
        SELECT 1 FROM "Project" p
        JOIN "organization" o ON p."organizationId" = o.id
        JOIN "member" m ON o.id = m."organizationId"
        WHERE p.id = p_project_id
        AND m."userId" = auth.uid()
    ) THEN
        RETURN jsonb_build_object('error', 'Project not found or access denied');
    END IF;
    
    -- Extract options
    v_include_trends := COALESCE((p_options->>'includeTrends')::boolean, true);
    v_include_velocity := COALESCE((p_options->>'includeVelocity')::boolean, true);
    v_include_forecasts := COALESCE((p_options->>'includeForecasts')::boolean, false);
    
    -- Generate cache key
    v_cache_key := generate_cache_key('progress_report', p_options, p_project_id);
    
    -- Check cache
    SELECT result INTO v_cached_result
    FROM "ReportingCache"
    WHERE "projectId" = p_project_id
    AND "reportType" = 'progress_report'
    AND "cacheKey" = v_cache_key
    AND "expiresAt" > NOW();
    
    IF v_cached_result IS NOT NULL THEN
        RETURN jsonb_build_object(
            'data', v_cached_result,
            'cached', true,
            'generatedAt', extract(epoch from NOW())
        );
    END IF;
    
    -- Build comprehensive progress report
    WITH project_stats AS (
        SELECT 
            COUNT(*) as total_components,
            COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_components,
            COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as in_progress_components,
            COUNT(*) FILTER (WHERE status = 'NOT_STARTED') as not_started_components,
            COUNT(*) FILTER (WHERE status = 'ON_HOLD') as hold_components, -- Fixed: was 'HOLD'
            ROUND(AVG("completionPercent"), 2) as avg_completion_percent,
            COUNT(DISTINCT "drawingId") FILTER (WHERE "drawingId" IS NOT NULL) as active_drawings,
            COUNT(DISTINCT "area") FILTER (WHERE "area" IS NOT NULL) as active_areas,
            COUNT(DISTINCT "system") FILTER (WHERE "system" IS NOT NULL) as active_systems,
            COUNT(DISTINCT "testPackage") FILTER (WHERE "testPackage" IS NOT NULL) as test_packages
        FROM "Component"
        WHERE "projectId" = p_project_id
        AND status != 'DELETED'
    ),
    milestone_stats AS (
        SELECT 
            COUNT(*) as total_milestones,
            COUNT(*) FILTER (WHERE "isCompleted" = true) as completed_milestones,
            jsonb_object_agg(
                "milestoneName",
                jsonb_build_object(
                    'total', COUNT(*),
                    'completed', COUNT(*) FILTER (WHERE "isCompleted" = true),
                    'completionRate', ROUND(COUNT(*) FILTER (WHERE "isCompleted" = true) * 100.0 / COUNT(*), 2)
                )
            ) as milestone_breakdown
        FROM "ComponentMilestone" cm
        JOIN "Component" c ON cm."componentId" = c.id
        WHERE c."projectId" = p_project_id
        AND c.status != 'DELETED'
        GROUP BY "milestoneName"
    ),
    recent_velocity AS (
        SELECT 
            COUNT(*) FILTER (WHERE "completedAt" > NOW() - INTERVAL '7 days') as completed_7d,
            COUNT(*) FILTER (WHERE "completedAt" > NOW() - INTERVAL '14 days') as completed_14d,
            COUNT(*) FILTER (WHERE "completedAt" > NOW() - INTERVAL '30 days') as completed_30d,
            ROUND(COUNT(*) FILTER (WHERE "completedAt" > NOW() - INTERVAL '7 days') / 7.0, 2) as daily_velocity_7d,
            ROUND(COUNT(*) FILTER (WHERE "completedAt" > NOW() - INTERVAL '14 days') / 14.0, 2) as daily_velocity_14d
        FROM "ComponentMilestone" cm
        JOIN "Component" c ON cm."componentId" = c.id
        WHERE c."projectId" = p_project_id
        AND c.status != 'DELETED'
        AND cm."isCompleted" = true
        AND cm."completedAt" IS NOT NULL
    ),
    stalled_analysis AS (
        SELECT 
            COUNT(*) FILTER (WHERE last_update < NOW() - INTERVAL '7 days') as stalled_7d,
            COUNT(*) FILTER (WHERE last_update < NOW() - INTERVAL '14 days') as stalled_14d,
            COUNT(*) FILTER (WHERE last_update < NOW() - INTERVAL '21 days') as stalled_21d
        FROM (
            SELECT 
                c.id,
                GREATEST(
                    c."updatedAt",
                    COALESCE(
                        (SELECT MAX(cm."completedAt") FROM "ComponentMilestone" cm WHERE cm."componentId" = c.id AND cm."isCompleted" = true),
                        c."createdAt"
                    )
                ) as last_update
            FROM "Component" c
            WHERE c."projectId" = p_project_id
            AND c.status NOT IN ('COMPLETED', 'NOT_STARTED', 'DELETED')
        ) component_updates
    )
    SELECT jsonb_build_object(
        'overview', jsonb_build_object(
            'totalComponents', ps.total_components,
            'completedComponents', ps.completed_components,
            'inProgressComponents', ps.in_progress_components,
            'notStartedComponents', ps.not_started_components,
            'holdComponents', ps.hold_components,
            'overallCompletionPercent', ps.avg_completion_percent,
            'activeDrawings', ps.active_drawings,
            'activeAreas', ps.active_areas,
            'activeSystems', ps.active_systems,
            'testPackages', ps.test_packages
        ),
        'milestones', jsonb_build_object(
            'total', ms.total_milestones,
            'completed', ms.completed_milestones,
            'completionRate', CASE 
                WHEN ms.total_milestones > 0 
                THEN ROUND(ms.completed_milestones * 100.0 / ms.total_milestones, 2)
                ELSE 0 
            END,
            'breakdown', COALESCE(ms.milestone_breakdown, '{}'::jsonb)
        ),
        'velocity', CASE WHEN v_include_velocity THEN 
            jsonb_build_object(
                'completed7Days', rv.completed_7d,
                'completed14Days', rv.completed_14d,
                'completed30Days', rv.completed_30d,
                'dailyVelocity7Day', rv.daily_velocity_7d,
                'dailyVelocity14Day', rv.daily_velocity_14d,
                'weeklyVelocity', ROUND(rv.daily_velocity_7d * 7, 2)
            )
        ELSE NULL END,
        'qualityMetrics', jsonb_build_object(
            'stalledComponents7Days', sa.stalled_7d,
            'stalledComponents14Days', sa.stalled_14d,
            'stalledComponents21Days', sa.stalled_21d,
            'stalledPercentage', CASE 
                WHEN ps.total_components > 0 
                THEN ROUND(sa.stalled_14d * 100.0 / ps.total_components, 2)
                ELSE 0 
            END
        )
    ) INTO v_result
    FROM project_stats ps, milestone_stats ms, recent_velocity rv, stalled_analysis sa;
    
    -- Add trend analysis if requested
    IF v_include_trends THEN
        v_result := v_result || jsonb_build_object(
            'trends', (
                SELECT jsonb_build_object(
                    'snapshots', jsonb_agg(
                        jsonb_build_object(
                            'date', ps."snapshotDate",
                            'completionPercent', ps."overallCompletionPercent",
                            'rocWeightedPercent', ps."rocWeightedPercent",
                            'velocity', ps."dailyVelocity"
                        ) ORDER BY ps."snapshotDate" DESC
                    )
                )
                FROM "ProgressSnapshots" ps
                WHERE ps."projectId" = p_project_id
                AND ps."snapshotDate" >= CURRENT_DATE - INTERVAL '30 days'
            )
        );
    END IF;
    
    -- Calculate duration and cache result
    v_calculation_duration := EXTRACT(milliseconds FROM clock_timestamp() - v_start_time)::INTEGER;
    
    INSERT INTO "ReportingCache" (
        "projectId", "reportType", "cacheKey", "filters", "result", 
        "calculationDuration", "rowCount", "createdBy"
    ) VALUES (
        p_project_id, 'progress_report', v_cache_key, p_options, v_result,
        v_calculation_duration, (v_result->'overview'->>'totalComponents')::INTEGER, auth.uid()
    ) ON CONFLICT ("projectId", "reportType", "cacheKey") DO UPDATE SET
        "result" = EXCLUDED."result",
        "calculatedAt" = NOW(),
        "expiresAt" = NOW() + INTERVAL '5 minutes',
        "calculationDuration" = EXCLUDED."calculationDuration";
    
    RETURN jsonb_build_object(
        'data', v_result,
        'cached', false,
        'calculationDuration', v_calculation_duration,
        'generatedAt', extract(epoch from NOW())
    );
END;
$$;

-- Update function permissions
GRANT EXECUTE ON FUNCTION generate_progress_report(TEXT, JSONB) TO authenticated;

-- =============================================================================
-- PERFORMANCE OPTIMIZATION
-- =============================================================================

-- Add indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_component_milestone_completed_at" 
ON "ComponentMilestone" ("completedAt" DESC) WHERE "isCompleted" = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_component_project_completion" 
ON "Component" ("projectId", "completionPercent") WHERE status != 'DELETED';

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_component_updated_status" 
ON "Component" ("updatedAt" DESC, status) WHERE status != 'DELETED';

-- Refresh materialized views
SELECT refresh_reporting_views();

COMMENT ON SCHEMA public IS 'PipeTrak Reporting Fixes - Migration 20250811_reporting_fixes';