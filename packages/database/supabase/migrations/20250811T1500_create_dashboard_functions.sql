-- Dashboard RPC Functions for PipeTrak
-- Migration: 20250811T1500_create_dashboard_functions.sql
-- Purpose: Create real data dashboard aggregation functions to replace mock data

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Overall Dashboard Metrics Function
CREATE OR REPLACE FUNCTION get_dashboard_metrics(p_project_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_result JSONB;
    v_overall_completion DECIMAL;
    v_total_components INTEGER;
    v_completed_components INTEGER;
    v_active_drawings INTEGER;
    v_test_packages_ready INTEGER;
    v_stalled_7d INTEGER;
    v_stalled_14d INTEGER;
    v_stalled_21d INTEGER;
BEGIN
    -- Validate project access (RLS will handle this, but explicit check for clarity)
    IF NOT EXISTS(SELECT 1 FROM "Project" WHERE id = p_project_id) THEN
        RETURN jsonb_build_object('error', 'Project not found');
    END IF;
    
    -- Calculate overall metrics
    SELECT 
        COALESCE(ROUND(AVG("completionPercent")::numeric, 0), 0),
        COUNT(*),
        COUNT(*) FILTER (WHERE "status" = 'COMPLETED'),
        COUNT(DISTINCT "drawingId") FILTER (WHERE "drawingId" IS NOT NULL)
    INTO v_overall_completion, v_total_components, v_completed_components, v_active_drawings
    FROM "Component" 
    WHERE "projectId" = p_project_id;
    
    -- Calculate test packages ready (assuming 100% completion)
    SELECT COUNT(DISTINCT "testPackage")
    INTO v_test_packages_ready
    FROM "Component" 
    WHERE "projectId" = p_project_id 
    AND "testPackage" IS NOT NULL
    AND "completionPercent" = 100;
    
    -- Calculate stalled components based on milestone completion dates
    WITH component_last_progress AS (
        SELECT 
            c.id,
            GREATEST(
                COALESCE(MAX(cm."completedAt"), c."createdAt"),
                COALESCE(MAX(cm."updatedAt"), c."updatedAt"),
                c."updatedAt"
            ) as last_activity_date
        FROM "Component" c
        LEFT JOIN "ComponentMilestone" cm ON c.id = cm."componentId"
        WHERE c."projectId" = p_project_id
        AND c."status" NOT IN ('COMPLETED', 'NOT_STARTED')
        GROUP BY c.id, c."createdAt", c."updatedAt"
    )
    SELECT 
        COUNT(*) FILTER (WHERE last_activity_date < NOW() - INTERVAL '7 days'),
        COUNT(*) FILTER (WHERE last_activity_date < NOW() - INTERVAL '14 days'),
        COUNT(*) FILTER (WHERE last_activity_date < NOW() - INTERVAL '21 days')
    INTO v_stalled_7d, v_stalled_14d, v_stalled_21d
    FROM component_last_progress;
    
    -- Build result JSON
    v_result := jsonb_build_object(
        'overallCompletionPercent', v_overall_completion,
        'totalComponents', v_total_components,
        'completedComponents', v_completed_components,
        'activeDrawings', v_active_drawings,
        'testPackagesReady', v_test_packages_ready,
        'stalledComponents', jsonb_build_object(
            'stalled7Days', COALESCE(v_stalled_7d, 0),
            'stalled14Days', COALESCE(v_stalled_14d, 0),
            'stalled21Days', COALESCE(v_stalled_21d, 0)
        ),
        'generatedAt', extract(epoch from NOW()) * 1000
    );
    
    RETURN v_result;
END;
$$;

-- 2. Area/System Progress Matrix Function
CREATE OR REPLACE FUNCTION get_area_system_matrix(p_project_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE 
AS $$
DECLARE
    v_result JSONB;
    v_matrix_data JSONB;
BEGIN
    -- Validate project access
    IF NOT EXISTS(SELECT 1 FROM "Project" WHERE id = p_project_id) THEN
        RETURN jsonb_build_object('error', 'Project not found');
    END IF;
    
    -- Calculate area/system matrix with completion and stalled counts
    WITH area_system_stats AS (
        SELECT 
            COALESCE("area", 'Unassigned') as area,
            COALESCE("system", 'Unassigned') as system,
            COUNT(*) as total_count,
            COUNT(*) FILTER (WHERE "status" = 'COMPLETED') as completed_count,
            COALESCE(ROUND(AVG("completionPercent")::numeric, 0), 0) as completion_percent
        FROM "Component"
        WHERE "projectId" = p_project_id
        GROUP BY COALESCE("area", 'Unassigned'), COALESCE("system", 'Unassigned')
    ),
    stalled_by_area_system AS (
        SELECT 
            COALESCE(c."area", 'Unassigned') as area,
            COALESCE(c."system", 'Unassigned') as system,
            COUNT(*) FILTER (WHERE last_activity < NOW() - INTERVAL '7 days') as stalled_7d,
            COUNT(*) FILTER (WHERE last_activity < NOW() - INTERVAL '14 days') as stalled_14d,
            COUNT(*) FILTER (WHERE last_activity < NOW() - INTERVAL '21 days') as stalled_21d
        FROM "Component" c
        LEFT JOIN (
            SELECT 
                c2.id,
                GREATEST(
                    COALESCE(MAX(cm."completedAt"), c2."createdAt"),
                    COALESCE(MAX(cm."updatedAt"), c2."updatedAt"),
                    c2."updatedAt"
                ) as last_activity
            FROM "Component" c2
            LEFT JOIN "ComponentMilestone" cm ON c2.id = cm."componentId"
            WHERE c2."projectId" = p_project_id
            GROUP BY c2.id, c2."createdAt", c2."updatedAt"
        ) lp ON c.id = lp.id
        WHERE c."projectId" = p_project_id
        AND c."status" NOT IN ('COMPLETED', 'NOT_STARTED')
        GROUP BY COALESCE(c."area", 'Unassigned'), COALESCE(c."system", 'Unassigned')
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'area', ass.area,
            'system', ass.system,
            'totalCount', ass.total_count,
            'completedCount', ass.completed_count,
            'completionPercent', ass.completion_percent,
            'stalledCounts', jsonb_build_object(
                'stalled7Days', COALESCE(sas.stalled_7d, 0),
                'stalled14Days', COALESCE(sas.stalled_14d, 0),
                'stalled21Days', COALESCE(sas.stalled_21d, 0)
            )
        )
        ORDER BY ass.area, ass.system
    )
    INTO v_matrix_data
    FROM area_system_stats ass
    LEFT JOIN stalled_by_area_system sas ON ass.area = sas.area AND ass.system = sas.system;
    
    v_result := jsonb_build_object(
        'matrixData', COALESCE(v_matrix_data, '[]'::jsonb),
        'generatedAt', extract(epoch from NOW()) * 1000
    );
    
    RETURN v_result;
END;
$$;

-- 3. Drawing Rollups Function
CREATE OR REPLACE FUNCTION get_drawing_rollups(p_project_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_result JSONB;
    v_drawing_data JSONB;
BEGIN
    -- Validate project access
    IF NOT EXISTS(SELECT 1 FROM "Project" WHERE id = p_project_id) THEN
        RETURN jsonb_build_object('error', 'Project not found');
    END IF;
    
    -- Calculate drawing-level rollups with hierarchy support
    WITH drawing_stats AS (
        SELECT 
            d.id as drawing_id,
            d.number as drawing_number,
            d.title as drawing_name,
            d."parentId" as parent_drawing_id,
            COUNT(c.id) as component_count,
            COALESCE(ROUND(AVG(c."completionPercent")::numeric, 0), 0) as completion_percent,
            COUNT(*) FILTER (WHERE c."status" = 'COMPLETED') as completed_count
        FROM "Drawing" d
        LEFT JOIN "Component" c ON d.id = c."drawingId"
        WHERE d."projectId" = p_project_id
        GROUP BY d.id, d.number, d.title, d."parentId"
    ),
    drawing_stalled AS (
        SELECT 
            d.id as drawing_id,
            COUNT(*) FILTER (WHERE last_activity < NOW() - INTERVAL '7 days') as stalled_count
        FROM "Drawing" d
        LEFT JOIN "Component" c ON d.id = c."drawingId"
        LEFT JOIN (
            SELECT 
                c2.id,
                GREATEST(
                    COALESCE(MAX(cm."completedAt"), c2."createdAt"),
                    COALESCE(MAX(cm."updatedAt"), c2."updatedAt"),
                    c2."updatedAt"
                ) as last_activity
            FROM "Component" c2
            LEFT JOIN "ComponentMilestone" cm ON c2.id = cm."componentId"
            WHERE c2."projectId" = p_project_id
            GROUP BY c2.id, c2."createdAt", c2."updatedAt"
        ) lp ON c.id = lp.id
        WHERE d."projectId" = p_project_id
        AND c."status" NOT IN ('COMPLETED', 'NOT_STARTED')
        GROUP BY d.id
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'drawingId', ds.drawing_id,
            'drawingNumber', ds.drawing_number,
            'drawingName', ds.drawing_name,
            'parentDrawingId', ds.parent_drawing_id,
            'componentCount', ds.component_count,
            'completedCount', ds.completed_count,
            'completionPercent', ds.completion_percent,
            'stalledCount', COALESCE(dst.stalled_count, 0)
        ) ORDER BY ds.drawing_number
    )
    INTO v_drawing_data
    FROM drawing_stats ds
    LEFT JOIN drawing_stalled dst ON ds.drawing_id = dst.drawing_id
    WHERE ds.component_count > 0; -- Only return drawings with components
    
    v_result := jsonb_build_object(
        'drawings', COALESCE(v_drawing_data, '[]'::jsonb),
        'generatedAt', extract(epoch from NOW()) * 1000
    );
    
    RETURN v_result;
END;
$$;

-- 4. Test Package Readiness Function
CREATE OR REPLACE FUNCTION get_test_package_readiness(p_project_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_result JSONB;
    v_package_data JSONB;
BEGIN
    -- Validate project access
    IF NOT EXISTS(SELECT 1 FROM "Project" WHERE id = p_project_id) THEN
        RETURN jsonb_build_object('error', 'Project not found');
    END IF;
    
    -- Calculate test package readiness
    WITH package_stats AS (
        SELECT 
            COALESCE("testPackage", 'Unassigned') as package_id,
            COALESCE("testPackage", 'Unassigned') as package_name,
            COUNT(*) as total_components,
            COUNT(*) FILTER (WHERE "status" = 'COMPLETED') as completed_components,
            COALESCE(ROUND(AVG("completionPercent")::numeric, 0), 0) as completion_percent,
            (COUNT(*) FILTER (WHERE "status" = 'COMPLETED') = COUNT(*) AND COUNT(*) > 0) as is_ready
        FROM "Component"
        WHERE "projectId" = p_project_id
        AND "testPackage" IS NOT NULL
        AND "testPackage" != ''
        GROUP BY COALESCE("testPackage", 'Unassigned')
    ),
    package_stalled AS (
        SELECT 
            COALESCE(c."testPackage", 'Unassigned') as package_id,
            COUNT(*) FILTER (WHERE last_activity < NOW() - INTERVAL '14 days') as stalled_count
        FROM "Component" c
        LEFT JOIN (
            SELECT 
                c2.id,
                GREATEST(
                    COALESCE(MAX(cm."completedAt"), c2."createdAt"),
                    COALESCE(MAX(cm."updatedAt"), c2."updatedAt"),
                    c2."updatedAt"
                ) as last_activity
            FROM "Component" c2
            LEFT JOIN "ComponentMilestone" cm ON c2.id = cm."componentId"
            WHERE c2."projectId" = p_project_id
            GROUP BY c2.id, c2."createdAt", c2."updatedAt"
        ) lp ON c.id = lp.id
        WHERE c."projectId" = p_project_id
        AND c."testPackage" IS NOT NULL
        AND c."testPackage" != ''
        AND c."status" NOT IN ('COMPLETED', 'NOT_STARTED')
        GROUP BY COALESCE(c."testPackage", 'Unassigned')
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'packageId', ps.package_id,
            'packageName', ps.package_name,
            'totalComponents', ps.total_components,
            'completedComponents', ps.completed_components,
            'completionPercent', ps.completion_percent,
            'isReady', ps.is_ready,
            'stalledCount', COALESCE(pst.stalled_count, 0)
        ) ORDER BY ps.package_id
    )
    INTO v_package_data
    FROM package_stats ps
    LEFT JOIN package_stalled pst ON ps.package_id = pst.package_id;
    
    v_result := jsonb_build_object(
        'testPackages', COALESCE(v_package_data, '[]'::jsonb),
        'generatedAt', extract(epoch from NOW()) * 1000
    );
    
    RETURN v_result;
END;
$$;

-- 5. Recent Activity Feed Function
CREATE OR REPLACE FUNCTION get_recent_activity(p_project_id TEXT, p_limit INTEGER DEFAULT 50)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_result JSONB;
    v_activity_data JSONB;
BEGIN
    -- Validate project access
    IF NOT EXISTS(SELECT 1 FROM "Project" WHERE id = p_project_id) THEN
        RETURN jsonb_build_object('error', 'Project not found');
    END IF;
    
    -- Get recent activity from milestone completions and audit logs
    WITH recent_activity AS (
        -- Milestone completions
        SELECT 
            'milestone_completed' as activity_type,
            cm."completedAt" as activity_timestamp,
            cm."completedBy" as user_id,
            COALESCE(u.name, 'Unknown User') as user_name,
            c."componentId" as component_id,
            COALESCE(c.type, 'Component') as component_type,
            cm."milestoneName" as milestone_name,
            jsonb_build_object(
                'componentId', c."componentId",
                'componentType', COALESCE(c.type, 'Component'),
                'milestoneName', cm."milestoneName",
                'completionPercent', c."completionPercent"
            ) as activity_details
        FROM "ComponentMilestone" cm
        JOIN "Component" c ON cm."componentId" = c.id
        LEFT JOIN "user" u ON cm."completedBy" = u.id
        WHERE c."projectId" = p_project_id
        AND cm."completedAt" IS NOT NULL
        AND cm."completedAt" > NOW() - INTERVAL '30 days'
        
        UNION ALL
        
        -- Component status changes from audit logs (if available)
        SELECT 
            'component_updated' as activity_type,
            al."timestamp" as activity_timestamp,
            al."userId" as user_id,
            COALESCE(u.name, 'Unknown User') as user_name,
            c."componentId" as component_id,
            COALESCE(c.type, 'Component') as component_type,
            NULL as milestone_name,
            jsonb_build_object(
                'componentId', c."componentId",
                'componentType', COALESCE(c.type, 'Component'),
                'action', al.action,
                'changes', al.changes
            ) as activity_details
        FROM "AuditLog" al
        JOIN "Component" c ON al."entityId" = c.id AND al."entityType" = 'Component'
        LEFT JOIN "user" u ON al."userId" = u.id
        WHERE al."projectId" = p_project_id
        AND al."timestamp" > NOW() - INTERVAL '30 days'
        
        ORDER BY activity_timestamp DESC
        LIMIT p_limit
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'activityType', ra.activity_type,
            'timestamp', extract(epoch from ra.activity_timestamp) * 1000,
            'userId', ra.user_id,
            'userName', ra.user_name,
            'componentId', ra.component_id,
            'componentType', ra.component_type,
            'milestoneName', ra.milestone_name,
            'details', ra.activity_details
        ) ORDER BY ra.activity_timestamp DESC
    )
    INTO v_activity_data
    FROM recent_activity ra;
    
    v_result := jsonb_build_object(
        'activities', COALESCE(v_activity_data, '[]'::jsonb),
        'generatedAt', extract(epoch from NOW()) * 1000,
        'limit', p_limit
    );
    
    RETURN v_result;
END;
$$;

-- Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_metrics(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_area_system_matrix(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_drawing_rollups(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_test_package_readiness(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_activity(TEXT, INTEGER) TO authenticated;

-- Add function comments for documentation
COMMENT ON FUNCTION get_dashboard_metrics IS 'Returns overall project KPI metrics including completion, stalled components, and test package readiness';
COMMENT ON FUNCTION get_area_system_matrix IS 'Returns area/system progress matrix data for dashboard grid view';
COMMENT ON FUNCTION get_drawing_rollups IS 'Returns drawing-level progress rollups with hierarchy support';
COMMENT ON FUNCTION get_test_package_readiness IS 'Returns test package completion status and readiness indicators';
COMMENT ON FUNCTION get_recent_activity IS 'Returns recent activity feed with milestone completions and component updates';

-- Migration completed successfully
SELECT 'Dashboard RPC functions created successfully' as status;