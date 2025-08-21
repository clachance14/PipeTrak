-- Fix activity feed RPC function to use correct entity types from audit log
-- The audit log uses lowercase "component" and "component_milestone" entity types
-- but the RPC function was looking for capitalized "Component"

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
        
        -- Component changes from audit logs (fix entity type)
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
        JOIN "Component" c ON al."entityId" = c.id AND al."entityType" = 'component'
        LEFT JOIN "user" u ON al."userId" = u.id
        WHERE al."projectId" = p_project_id
        AND al."timestamp" > NOW() - INTERVAL '30 days'
        
        UNION ALL
        
        -- Milestone changes from audit logs (add this new section)
        SELECT 
            'milestone_completed' as activity_type,
            al."timestamp" as activity_timestamp,
            al."userId" as user_id,
            COALESCE(u.name, 'Unknown User') as user_name,
            c."componentId" as component_id,
            COALESCE(c.type, 'Component') as component_type,
            cm."milestoneName" as milestone_name,
            jsonb_build_object(
                'componentId', c."componentId",
                'componentType', COALESCE(c.type, 'Component'),
                'milestoneName', cm."milestoneName",
                'action', al.action,
                'changes', al.changes
            ) as activity_details
        FROM "AuditLog" al
        JOIN "ComponentMilestone" cm ON al."entityId" = cm.id AND al."entityType" = 'component_milestone'
        JOIN "Component" c ON cm."componentId" = c.id
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

-- Update permissions
GRANT EXECUTE ON FUNCTION get_recent_activity(TEXT, INTEGER) TO authenticated;

-- Add function comment for documentation
COMMENT ON FUNCTION get_recent_activity IS 'Returns recent project activity from milestone completions and audit logs with correct entity type matching';