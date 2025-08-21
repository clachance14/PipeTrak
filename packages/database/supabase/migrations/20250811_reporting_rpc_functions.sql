-- PipeTrak Reporting RPC Functions
-- Migration: 20250811_reporting_rpc_functions.sql
-- Purpose: Implement core reporting functions for ROC calculations, progress reports, and analytics

-- =============================================================================
-- ROC-WEIGHTED PROGRESS CALCULATOR
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
                                LEAST(COALESCE(cm."quantityValue", 0) / NULLIF(cm."quantityMax", 0), 1.0)
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
            ROUND(AVG(roc_weighted_percent), 2) as avg_roc_weighted_percent,
            -- Area breakdown
            jsonb_agg(DISTINCT 
                jsonb_build_object(
                    'area', area_clean,
                    'totalCount', (SELECT COUNT(*) FROM component_roc_calculations crc2 WHERE crc2.area_clean = crc.area_clean),
                    'completedCount', (SELECT COUNT(*) FROM component_roc_calculations crc2 WHERE crc2.area_clean = crc.area_clean AND crc2.status = 'COMPLETED'),
                    'avgCompletionPercent', (SELECT ROUND(AVG("completionPercent"), 2) FROM component_roc_calculations crc2 WHERE crc2.area_clean = crc.area_clean),
                    'avgROCPercent', (SELECT ROUND(AVG(roc_weighted_percent), 2) FROM component_roc_calculations crc2 WHERE crc2.area_clean = crc.area_clean)
                )
            ) FILTER (WHERE area_clean IS NOT NULL) as area_breakdown,
            -- System breakdown
            jsonb_agg(DISTINCT 
                jsonb_build_object(
                    'system', system_clean,
                    'totalCount', (SELECT COUNT(*) FROM component_roc_calculations crc2 WHERE crc2.system_clean = crc.system_clean),
                    'completedCount', (SELECT COUNT(*) FROM component_roc_calculations crc2 WHERE crc2.system_clean = crc.system_clean AND crc2.status = 'COMPLETED'),
                    'avgCompletionPercent', (SELECT ROUND(AVG("completionPercent"), 2) FROM component_roc_calculations crc2 WHERE crc2.system_clean = crc.system_clean),
                    'avgROCPercent', (SELECT ROUND(AVG(roc_weighted_percent), 2) FROM component_roc_calculations crc2 WHERE crc2.system_clean = crc.system_clean)
                )
            ) FILTER (WHERE system_clean IS NOT NULL) as system_breakdown,
            -- Test package breakdown
            jsonb_agg(DISTINCT 
                jsonb_build_object(
                    'testPackage', test_package_clean,
                    'totalCount', (SELECT COUNT(*) FROM component_roc_calculations crc2 WHERE crc2.test_package_clean = crc.test_package_clean),
                    'completedCount', (SELECT COUNT(*) FROM component_roc_calculations crc2 WHERE crc2.test_package_clean = crc.test_package_clean AND crc2.status = 'COMPLETED'),
                    'avgCompletionPercent', (SELECT ROUND(AVG("completionPercent"), 2) FROM component_roc_calculations crc2 WHERE crc2.test_package_clean = crc.test_package_clean),
                    'avgROCPercent', (SELECT ROUND(AVG(roc_weighted_percent), 2) FROM component_roc_calculations crc2 WHERE crc2.test_package_clean = crc.test_package_clean),
                    'isReady', (SELECT COUNT(*) FILTER (WHERE "completionPercent" < 100) = 0 FROM component_roc_calculations crc2 WHERE crc2.test_package_clean = crc.test_package_clean)
                )
            ) FILTER (WHERE test_package_clean IS NOT NULL) as test_package_breakdown
        FROM component_roc_calculations crc
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
            'areas', COALESCE(ss.area_breakdown, '[]'::jsonb),
            'systems', COALESCE(ss.system_breakdown, '[]'::jsonb),
            'testPackages', COALESCE(ss.test_package_breakdown, '[]'::jsonb)
        ),
        'filters', p_filters
    ) INTO v_result
    FROM summary_stats ss;
    
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
-- COMPREHENSIVE PROGRESS REPORT GENERATOR
-- =============================================================================

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
            COUNT(*) FILTER (WHERE status = 'HOLD') as hold_components,
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

-- =============================================================================
-- TREND ANALYSIS CALCULATOR
-- =============================================================================

CREATE OR REPLACE FUNCTION calculate_trend_analysis(
    p_project_id TEXT,
    p_days INTEGER DEFAULT 30
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
    
    WITH daily_progress AS (
        SELECT 
            DATE(cm."completedAt") as completion_date,
            COUNT(*) as milestones_completed,
            COUNT(DISTINCT c.id) as components_touched,
            jsonb_object_agg(
                cm."milestoneName",
                COUNT(*)
            ) as milestone_breakdown
        FROM "ComponentMilestone" cm
        JOIN "Component" c ON cm."componentId" = c.id
        WHERE c."projectId" = p_project_id
        AND c.status != 'DELETED'
        AND cm."isCompleted" = true
        AND cm."completedAt" >= CURRENT_DATE - INTERVAL '1 day' * p_days
        GROUP BY DATE(cm."completedAt")
        ORDER BY completion_date
    ),
    velocity_trends AS (
        SELECT 
            completion_date,
            milestones_completed,
            components_touched,
            -- Calculate 7-day rolling average
            AVG(milestones_completed) OVER (
                ORDER BY completion_date 
                ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
            ) as rolling_avg_7d,
            -- Calculate trend slope (simplified linear regression)
            ROW_NUMBER() OVER (ORDER BY completion_date) as day_number
        FROM daily_progress
    ),
    project_forecast AS (
        SELECT 
            (SELECT COUNT(*) FROM "Component" WHERE "projectId" = p_project_id AND status != 'DELETED') as total_components,
            (SELECT COUNT(*) FROM "Component" WHERE "projectId" = p_project_id AND status = 'COMPLETED') as completed_components,
            (SELECT AVG(milestones_completed) FROM daily_progress WHERE completion_date >= CURRENT_DATE - INTERVAL '14 days') as avg_daily_velocity,
            (SELECT COUNT(*) FROM "ComponentMilestone" cm JOIN "Component" c ON cm."componentId" = c.id WHERE c."projectId" = p_project_id AND c.status != 'DELETED') as total_milestones,
            (SELECT COUNT(*) FROM "ComponentMilestone" cm JOIN "Component" c ON cm."componentId" = c.id WHERE c."projectId" = p_project_id AND c.status != 'DELETED' AND cm."isCompleted" = true) as completed_milestones
    )
    SELECT jsonb_build_object(
        'dailyProgress', jsonb_agg(
            jsonb_build_object(
                'date', vt.completion_date,
                'milestonesCompleted', vt.milestones_completed,
                'componentsProgressed', vt.components_touched,
                'rollingAverage7Day', ROUND(vt.rolling_avg_7d, 2),
                'dayNumber', vt.day_number
            ) ORDER BY vt.completion_date
        ),
        'velocityMetrics', jsonb_build_object(
            'averageDailyMilestones', ROUND(AVG(dp.milestones_completed), 2),
            'averageDailyComponents', ROUND(AVG(dp.components_touched), 2),
            'peakDailyMilestones', MAX(dp.milestones_completed),
            'peakDailyComponents', MAX(dp.components_touched),
            'totalDaysWithActivity', COUNT(*),
            'currentTrend', CASE 
                WHEN AVG(dp.milestones_completed) FILTER (WHERE dp.completion_date >= CURRENT_DATE - INTERVAL '7 days') >
                     AVG(dp.milestones_completed) FILTER (WHERE dp.completion_date >= CURRENT_DATE - INTERVAL '14 days' AND dp.completion_date < CURRENT_DATE - INTERVAL '7 days')
                THEN 'increasing'
                WHEN AVG(dp.milestones_completed) FILTER (WHERE dp.completion_date >= CURRENT_DATE - INTERVAL '7 days') <
                     AVG(dp.milestones_completed) FILTER (WHERE dp.completion_date >= CURRENT_DATE - INTERVAL '14 days' AND dp.completion_date < CURRENT_DATE - INTERVAL '7 days')
                THEN 'decreasing'
                ELSE 'stable'
            END
        ),
        'forecast', jsonb_build_object(
            'totalComponents', pf.total_components,
            'completedComponents', pf.completed_components,
            'remainingComponents', (pf.total_components - pf.completed_components),
            'totalMilestones', pf.total_milestones,
            'completedMilestones', pf.completed_milestones,
            'remainingMilestones', (pf.total_milestones - pf.completed_milestones),
            'estimatedDaysToCompletion', CASE 
                WHEN pf.avg_daily_velocity > 0 
                THEN CEILING((pf.total_milestones - pf.completed_milestones) / pf.avg_daily_velocity)
                ELSE NULL 
            END,
            'estimatedCompletionDate', CASE 
                WHEN pf.avg_daily_velocity > 0 
                THEN CURRENT_DATE + (CEILING((pf.total_milestones - pf.completed_milestones) / pf.avg_daily_velocity))::INTEGER
                ELSE NULL 
            END,
            'projectedVelocity', ROUND(pf.avg_daily_velocity, 2)
        )
    ) INTO v_result
    FROM daily_progress dp, velocity_trends vt, project_forecast pf;
    
    v_calculation_duration := EXTRACT(milliseconds FROM clock_timestamp() - v_start_time)::INTEGER;
    
    RETURN jsonb_build_object(
        'data', v_result,
        'calculationDuration', v_calculation_duration,
        'generatedAt', extract(epoch from NOW()),
        'daysAnalyzed', p_days
    );
END;
$$;

-- =============================================================================
-- ENHANCED TEST PACKAGE READINESS
-- =============================================================================

CREATE OR REPLACE FUNCTION get_test_package_readiness_detailed(
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
    v_test_package_filter TEXT[];
    v_area_filter TEXT[];
    v_system_filter TEXT[];
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
    
    -- Extract filters
    v_test_package_filter := CASE 
        WHEN p_filters ? 'testPackages' THEN 
            ARRAY(SELECT jsonb_array_elements_text(p_filters->'testPackages'))
        ELSE NULL 
    END;
    
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
    
    WITH test_package_analysis AS (
        SELECT 
            COALESCE(c."testPackage", 'Unassigned') as test_package,
            COUNT(*) as total_components,
            COUNT(*) FILTER (WHERE c.status = 'COMPLETED') as completed_components,
            COUNT(*) FILTER (WHERE c."completionPercent" = 100) as fully_complete_components,
            ROUND(AVG(c."completionPercent"), 2) as avg_completion_percent,
            
            -- Readiness calculation
            CASE 
                WHEN COUNT(*) FILTER (WHERE c."completionPercent" < 100) = 0 AND COUNT(*) > 0 THEN 'ready'
                WHEN COUNT(*) FILTER (WHERE c."completionPercent" >= 95) >= COUNT(*) * 0.95 THEN 'nearly_ready'
                WHEN COUNT(*) FILTER (WHERE c."completionPercent" > 10) >= COUNT(*) * 0.10 THEN 'in_progress'
                ELSE 'not_started'
            END as readiness_status,
            
            -- Blocking components analysis
            jsonb_agg(
                jsonb_build_object(
                    'componentId', c."componentId",
                    'displayId', c."displayId",
                    'type', c.type,
                    'area', c."area",
                    'system', c."system",
                    'completionPercent', c."completionPercent",
                    'status', c.status,
                    'blockingMilestones', (
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'milestoneName', cm."milestoneName",
                                'isCompleted', cm."isCompleted",
                                'milestoneOrder', cm."milestoneOrder"
                            ) ORDER BY cm."milestoneOrder"
                        )
                        FROM "ComponentMilestone" cm
                        WHERE cm."componentId" = c.id
                        AND cm."isCompleted" = false
                        AND cm."milestoneName" IN ('Connect', 'Test', 'Pressure_Test', 'Complete')
                    )
                )
            ) FILTER (WHERE c."completionPercent" < 100) as blocking_components,
            
            -- Velocity analysis for estimation
            (
                SELECT AVG(daily_completions)
                FROM (
                    SELECT COUNT(*) as daily_completions
                    FROM "ComponentMilestone" cm2
                    JOIN "Component" c2 ON cm2."componentId" = c2.id
                    WHERE c2."projectId" = p_project_id
                    AND c2."testPackage" = c."testPackage"
                    AND cm2."completedAt" > NOW() - INTERVAL '14 days'
                    AND cm2."isCompleted" = true
                    GROUP BY DATE(cm2."completedAt")
                ) recent_activity
            ) as recent_velocity,
            
            -- Area and system breakdown within test package
            jsonb_object_agg(
                COALESCE(c."area", 'Unassigned'),
                jsonb_build_object(
                    'totalComponents', COUNT(*) FILTER (WHERE c."area" = COALESCE(c."area", 'Unassigned')),
                    'completedComponents', COUNT(*) FILTER (WHERE c."area" = COALESCE(c."area", 'Unassigned') AND c.status = 'COMPLETED'),
                    'avgCompletion', ROUND(AVG(c."completionPercent") FILTER (WHERE c."area" = COALESCE(c."area", 'Unassigned')), 2)
                )
            ) as area_breakdown
            
        FROM "Component" c
        WHERE c."projectId" = p_project_id
        AND c."testPackage" IS NOT NULL
        AND c.status != 'DELETED'
        AND (v_test_package_filter IS NULL OR c."testPackage" = ANY(v_test_package_filter))
        AND (v_area_filter IS NULL OR c."area" = ANY(v_area_filter))
        AND (v_system_filter IS NULL OR c."system" = ANY(v_system_filter))
        GROUP BY c."testPackage"
    )
    SELECT jsonb_build_object(
        'testPackages', jsonb_agg(
            jsonb_build_object(
                'packageId', tpa.test_package,
                'packageName', tpa.test_package,
                'totalComponents', tpa.total_components,
                'completedComponents', tpa.completed_components,
                'fullyCompleteComponents', tpa.fully_complete_components,
                'avgCompletionPercent', tpa.avg_completion_percent,
                'readinessStatus', tpa.readiness_status,
                'isReady', (tpa.readiness_status = 'ready'),
                'blockingComponents', COALESCE(tpa.blocking_components, '[]'::jsonb),
                'estimatedDaysToReady', CASE 
                    WHEN tpa.readiness_status = 'ready' THEN 0
                    WHEN tpa.recent_velocity > 0 
                    THEN CEILING((tpa.total_components - tpa.fully_complete_components) / tpa.recent_velocity)
                    ELSE NULL 
                END,
                'estimatedReadyDate', CASE 
                    WHEN tpa.readiness_status = 'ready' THEN CURRENT_DATE
                    WHEN tpa.recent_velocity > 0 
                    THEN CURRENT_DATE + CEILING((tpa.total_components - tpa.fully_complete_components) / tpa.recent_velocity)::INTEGER
                    ELSE NULL 
                END,
                'areaBreakdown', tpa.area_breakdown,
                'recentVelocity', ROUND(tpa.recent_velocity, 2)
            ) ORDER BY 
                CASE tpa.readiness_status 
                    WHEN 'ready' THEN 1
                    WHEN 'nearly_ready' THEN 2
                    WHEN 'in_progress' THEN 3
                    ELSE 4
                END,
                tpa.test_package
        ),
        'summary', jsonb_build_object(
            'totalTestPackages', COUNT(*),
            'readyPackages', COUNT(*) FILTER (WHERE tpa.readiness_status = 'ready'),
            'nearlyReadyPackages', COUNT(*) FILTER (WHERE tpa.readiness_status = 'nearly_ready'),
            'inProgressPackages', COUNT(*) FILTER (WHERE tpa.readiness_status = 'in_progress'),
            'notStartedPackages', COUNT(*) FILTER (WHERE tpa.readiness_status = 'not_started'),
            'totalComponents', SUM(tpa.total_components),
            'totalCompletedComponents', SUM(tpa.completed_components),
            'overallReadinessPercent', ROUND(
                COUNT(*) FILTER (WHERE tpa.readiness_status = 'ready') * 100.0 / COUNT(*), 2
            )
        ),
        'filters', p_filters
    ) INTO v_result
    FROM test_package_analysis tpa;
    
    RETURN jsonb_build_object(
        'data', v_result,
        'generatedAt', extract(epoch from NOW())
    );
END;
$$;

-- =============================================================================
-- COMPONENT DETAILS REPORT WITH PAGINATION
-- =============================================================================

CREATE OR REPLACE FUNCTION get_component_details_report(
    p_project_id TEXT,
    p_filters JSONB DEFAULT '{}'::jsonb,
    p_pagination JSONB DEFAULT '{"limit": 1000, "offset": 0}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_result JSONB;
    v_limit INTEGER;
    v_offset INTEGER;
    v_total_count INTEGER;
    v_area_filter TEXT[];
    v_system_filter TEXT[];
    v_test_package_filter TEXT[];
    v_status_filter TEXT[];
    v_completion_min DECIMAL;
    v_completion_max DECIMAL;
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
    
    -- Extract pagination parameters
    v_limit := COALESCE((p_pagination->>'limit')::INTEGER, 1000);
    v_offset := COALESCE((p_pagination->>'offset')::INTEGER, 0);
    
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
    
    v_status_filter := CASE 
        WHEN p_filters ? 'statuses' THEN 
            ARRAY(SELECT jsonb_array_elements_text(p_filters->'statuses'))
        ELSE NULL 
    END;
    
    v_completion_min := COALESCE((p_filters->>'completionMin')::DECIMAL, 0);
    v_completion_max := COALESCE((p_filters->>'completionMax')::DECIMAL, 100);
    
    -- Get total count first
    SELECT COUNT(*)
    INTO v_total_count
    FROM "Component" c
    WHERE c."projectId" = p_project_id
    AND c.status != 'DELETED'
    AND (v_area_filter IS NULL OR c."area" = ANY(v_area_filter))
    AND (v_system_filter IS NULL OR c."system" = ANY(v_system_filter))
    AND (v_test_package_filter IS NULL OR c."testPackage" = ANY(v_test_package_filter))
    AND (v_status_filter IS NULL OR c.status::text = ANY(v_status_filter))
    AND c."completionPercent" BETWEEN v_completion_min AND v_completion_max;
    
    -- Get paginated component details
    WITH component_details AS (
        SELECT 
            c.*,
            d.number as drawing_number,
            d.title as drawing_title,
            d.revision as drawing_revision,
            mt.name as milestone_template_name,
            mt."workflowType" as workflow_type,
            -- Get all milestones for each component
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'milestoneName', cm."milestoneName",
                        'isCompleted', cm."isCompleted",
                        'completedAt', cm."completedAt",
                        'completedBy', u.name,
                        'milestoneOrder', cm."milestoneOrder",
                        'percentageValue', cm."percentageValue",
                        'quantityValue', cm."quantityValue",
                        'weight', cm.weight
                    ) ORDER BY cm."milestoneOrder"
                )
                FROM "ComponentMilestone" cm
                LEFT JOIN "user" u ON cm."completedBy" = u.id
                WHERE cm."componentId" = c.id
            ) as milestones,
            -- Get recent activity
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'timestamp', al."timestamp",
                        'action', al.action,
                        'userName', au.name,
                        'changes', al.changes
                    ) ORDER BY al."timestamp" DESC
                )
                FROM "AuditLog" al
                LEFT JOIN "user" au ON al."userId" = au.id
                WHERE al."entityId" = c.id
                AND al."entityType" = 'Component'
                LIMIT 5
            ) as recent_activity,
            -- Calculate days since last update
            EXTRACT(days FROM NOW() - GREATEST(
                c."updatedAt",
                COALESCE(
                    (SELECT MAX(cm."completedAt") FROM "ComponentMilestone" cm WHERE cm."componentId" = c.id AND cm."isCompleted" = true),
                    c."createdAt"
                )
            )) as days_since_update
        FROM "Component" c
        LEFT JOIN "Drawing" d ON c."drawingId" = d.id
        LEFT JOIN "MilestoneTemplate" mt ON c."milestoneTemplateId" = mt.id
        WHERE c."projectId" = p_project_id
        AND c.status != 'DELETED'
        AND (v_area_filter IS NULL OR c."area" = ANY(v_area_filter))
        AND (v_system_filter IS NULL OR c."system" = ANY(v_system_filter))
        AND (v_test_package_filter IS NULL OR c."testPackage" = ANY(v_test_package_filter))
        AND (v_status_filter IS NULL OR c.status::text = ANY(v_status_filter))
        AND c."completionPercent" BETWEEN v_completion_min AND v_completion_max
        ORDER BY c."componentId"
        LIMIT v_limit OFFSET v_offset
    )
    SELECT jsonb_build_object(
        'components', jsonb_agg(
            jsonb_build_object(
                'id', cd.id,
                'componentId', cd."componentId",
                'displayId', cd."displayId",
                'type', cd.type,
                'status', cd.status,
                'completionPercent', cd."completionPercent",
                'area', cd."area",
                'system', cd."system",
                'testPackage', cd."testPackage",
                'description', cd.description,
                'spec', cd.spec,
                'size', cd.size,
                'material', cd.material,
                'pressureRating', cd."pressureRating",
                'instanceNumber', cd."instanceNumber",
                'totalInstancesOnDrawing', cd."totalInstancesOnDrawing",
                'workflowType', cd.workflow_type,
                'drawing', jsonb_build_object(
                    'number', cd.drawing_number,
                    'title', cd.drawing_title,
                    'revision', cd.drawing_revision
                ),
                'milestoneTemplate', cd.milestone_template_name,
                'milestones', COALESCE(cd.milestones, '[]'::jsonb),
                'recentActivity', COALESCE(cd.recent_activity, '[]'::jsonb),
                'daysSinceUpdate', cd.days_since_update,
                'createdAt', cd."createdAt",
                'updatedAt', cd."updatedAt"
            ) ORDER BY cd."componentId"
        ),
        'pagination', jsonb_build_object(
            'totalCount', v_total_count,
            'limit', v_limit,
            'offset', v_offset,
            'hasMore', (v_offset + v_limit) < v_total_count,
            'currentPage', FLOOR(v_offset / v_limit) + 1,
            'totalPages', CEILING(v_total_count::DECIMAL / v_limit)
        ),
        'filters', p_filters
    ) INTO v_result
    FROM component_details cd;
    
    RETURN jsonb_build_object(
        'data', v_result,
        'generatedAt', extract(epoch from NOW())
    );
END;
$$;

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION calculate_roc_weighted_progress(TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_progress_report(TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_trend_analysis(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_test_package_readiness_detailed(TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_component_details_report(TEXT, JSONB, JSONB) TO authenticated;

-- Add function comments for documentation
COMMENT ON FUNCTION calculate_roc_weighted_progress IS 'Calculate ROC-weighted progress with filtering and caching support';
COMMENT ON FUNCTION generate_progress_report IS 'Generate comprehensive progress report with velocity and trend analysis';
COMMENT ON FUNCTION calculate_trend_analysis IS 'Analyze completion trends and forecast project completion dates';
COMMENT ON FUNCTION get_test_package_readiness_detailed IS 'Detailed test package readiness analysis with blocking component identification';
COMMENT ON FUNCTION get_component_details_report IS 'Paginated component details report with milestone and activity data';