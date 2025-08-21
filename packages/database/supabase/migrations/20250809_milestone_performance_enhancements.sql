-- Milestone Update System Performance Enhancements
-- Migration: 20250809_milestone_performance_enhancements.sql
-- Purpose: Add indexes, triggers, and RPC functions for optimized milestone processing

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Performance Indexes
-- Component milestone queries (most common access patterns)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_component_milestone_component_id 
ON "ComponentMilestone" ("componentId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_component_milestone_completed_at 
ON "ComponentMilestone" ("completedAt") WHERE "completedAt" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_component_milestone_project_completion 
ON "ComponentMilestone" ("componentId", "isCompleted", "percentageComplete", "quantityComplete");

-- Audit log performance for recent updates
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_project_milestone_updates 
ON "AuditLog" ("projectId", "entityType", "createdAt" DESC) 
WHERE "entityType" = 'component_milestone';

-- Component queries with milestones
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_component_project_drawing 
ON "Component" ("projectId", "drawingId", "status");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_component_completion 
ON "Component" ("completionPercent", "status") 
WHERE "status" != 'NOT_STARTED';

-- Project organization access patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_member_organization_user 
ON "Member" ("organizationId", "userId");

-- Drawing hierarchy queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drawing_project_hierarchy 
ON "Drawing" ("projectId", "parentDrawingId", "level");

-- 2. Transaction Tracking Table for Bulk Operations
CREATE TABLE IF NOT EXISTS "BulkOperationTransaction" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "projectId" TEXT NOT NULL REFERENCES "Project"(id) ON DELETE CASCADE,
    "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "transactionType" TEXT NOT NULL CHECK ("transactionType" IN ('bulk_milestone_update', 'bulk_component_update')),
    "operationCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "completedAt" TIMESTAMP WITH TIME ZONE,
    "status" TEXT NOT NULL DEFAULT 'in_progress' CHECK ("status" IN ('in_progress', 'completed', 'failed', 'rolled_back')),
    "metadata" JSONB DEFAULT '{}',
    "errors" JSONB DEFAULT '[]',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for transaction tracking
CREATE INDEX idx_bulk_transaction_project_status ON "BulkOperationTransaction" ("projectId", "status", "startedAt" DESC);
CREATE INDEX idx_bulk_transaction_user ON "BulkOperationTransaction" ("userId", "createdAt" DESC);

-- 3. Optimized Component Completion Calculation Function
CREATE OR REPLACE FUNCTION calculate_component_completion(component_id TEXT)
RETURNS TABLE(completion_percent DECIMAL, status TEXT) 
LANGUAGE plpgsql
AS $$
DECLARE
    workflow_type TEXT;
    milestone_data JSONB;
    total_weight DECIMAL := 0;
    completed_weight DECIMAL := 0;
    weighted_sum DECIMAL := 0;
    calc_completion DECIMAL := 0;
    calc_status TEXT := 'NOT_STARTED';
BEGIN
    -- Get component workflow type and milestone template data
    SELECT c."workflowType", mt.milestones
    INTO workflow_type, milestone_data
    FROM "Component" c
    JOIN "MilestoneTemplate" mt ON c."milestoneTemplateId" = mt.id
    WHERE c.id = component_id;
    
    IF workflow_type IS NULL THEN
        RETURN QUERY SELECT 0::DECIMAL, 'NOT_STARTED'::TEXT;
        RETURN;
    END IF;

    -- Calculate based on workflow type
    IF workflow_type = 'MILESTONE_DISCRETE' THEN
        -- Discrete: weighted sum of completed milestones
        SELECT 
            COALESCE(SUM(
                CASE WHEN jsonb_extract_path(milestone_data, (cm."milestoneOrder")::text, 'weight') IS NOT NULL 
                THEN (jsonb_extract_path_text(milestone_data, (cm."milestoneOrder")::text, 'weight'))::DECIMAL 
                ELSE 1 
                END
            ), 0),
            COALESCE(SUM(
                CASE WHEN cm."isCompleted" THEN
                    CASE WHEN jsonb_extract_path(milestone_data, (cm."milestoneOrder")::text, 'weight') IS NOT NULL 
                    THEN (jsonb_extract_path_text(milestone_data, (cm."milestoneOrder")::text, 'weight'))::DECIMAL 
                    ELSE 1 
                    END
                ELSE 0 
                END
            ), 0)
        INTO total_weight, completed_weight
        FROM "ComponentMilestone" cm 
        WHERE cm."componentId" = component_id;
        
        calc_completion := CASE WHEN total_weight > 0 THEN (completed_weight / total_weight) * 100 ELSE 0 END;
        
    ELSIF workflow_type = 'MILESTONE_PERCENTAGE' THEN
        -- Percentage: weighted average of percentage values
        SELECT 
            COALESCE(SUM(
                CASE WHEN jsonb_extract_path(milestone_data, (cm."milestoneOrder")::text, 'weight') IS NOT NULL 
                THEN (jsonb_extract_path_text(milestone_data, (cm."milestoneOrder")::text, 'weight'))::DECIMAL 
                ELSE 1 
                END
            ), 0),
            COALESCE(SUM(
                COALESCE(cm."percentageComplete", 0) * 
                CASE WHEN jsonb_extract_path(milestone_data, (cm."milestoneOrder")::text, 'weight') IS NOT NULL 
                THEN (jsonb_extract_path_text(milestone_data, (cm."milestoneOrder")::text, 'weight'))::DECIMAL 
                ELSE 1 
                END
            ), 0)
        INTO total_weight, weighted_sum
        FROM "ComponentMilestone" cm 
        WHERE cm."componentId" = component_id;
        
        calc_completion := CASE WHEN total_weight > 0 THEN weighted_sum / total_weight ELSE 0 END;
        
    ELSIF workflow_type = 'MILESTONE_QUANTITY' THEN
        -- Quantity: weighted percentage based on quantities
        SELECT 
            COALESCE(SUM(
                CASE WHEN jsonb_extract_path(milestone_data, (cm."milestoneOrder")::text, 'weight') IS NOT NULL 
                THEN (jsonb_extract_path_text(milestone_data, (cm."milestoneOrder")::text, 'weight'))::DECIMAL 
                ELSE 1 
                END
            ), 0),
            COALESCE(SUM(
                CASE 
                WHEN cm."quantityTotal" > 0 THEN
                    ((COALESCE(cm."quantityComplete", 0)::DECIMAL / cm."quantityTotal"::DECIMAL) * 100) *
                    CASE WHEN jsonb_extract_path(milestone_data, (cm."milestoneOrder")::text, 'weight') IS NOT NULL 
                    THEN (jsonb_extract_path_text(milestone_data, (cm."milestoneOrder")::text, 'weight'))::DECIMAL 
                    ELSE 1 
                    END
                ELSE 0 
                END
            ), 0)
        INTO total_weight, weighted_sum
        FROM "ComponentMilestone" cm 
        WHERE cm."componentId" = component_id;
        
        calc_completion := CASE WHEN total_weight > 0 THEN weighted_sum / total_weight ELSE 0 END;
    END IF;

    -- Ensure completion is between 0 and 100
    calc_completion := LEAST(GREATEST(calc_completion, 0), 100);
    
    -- Determine status
    calc_status := CASE 
        WHEN calc_completion = 0 THEN 'NOT_STARTED'
        WHEN calc_completion < 100 THEN 'IN_PROGRESS' 
        ELSE 'COMPLETED' 
    END;
    
    RETURN QUERY SELECT calc_completion, calc_status;
END;
$$;

-- 4. Bulk Component Completion Update Function
CREATE OR REPLACE FUNCTION update_components_completion(component_ids TEXT[])
RETURNS TABLE(component_id TEXT, old_completion DECIMAL, new_completion DECIMAL, old_status TEXT, new_status TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
    comp_id TEXT;
    calc_result RECORD;
    old_comp RECORD;
BEGIN
    -- Process each component
    FOREACH comp_id IN ARRAY component_ids LOOP
        -- Get current values
        SELECT "completionPercent", "status" INTO old_comp 
        FROM "Component" WHERE id = comp_id;
        
        IF old_comp IS NULL THEN
            CONTINUE;
        END IF;
        
        -- Calculate new values
        SELECT * INTO calc_result FROM calculate_component_completion(comp_id);
        
        -- Update component if values changed
        IF old_comp."completionPercent" != calc_result.completion_percent OR 
           old_comp."status" != calc_result.status THEN
            
            UPDATE "Component" 
            SET 
                "completionPercent" = calc_result.completion_percent,
                "status" = calc_result.status::TEXT,
                "updatedAt" = NOW()
            WHERE id = comp_id;
            
            -- Return the change
            RETURN QUERY SELECT 
                comp_id,
                old_comp."completionPercent",
                calc_result.completion_percent,
                old_comp."status",
                calc_result.status;
        END IF;
    END LOOP;
END;
$$;

-- 5. Milestone Update Trigger for Real-time Updates
CREATE OR REPLACE FUNCTION milestone_update_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    project_id TEXT;
BEGIN
    -- Get project ID for the component
    SELECT c."projectId" INTO project_id
    FROM "Component" c 
    WHERE c.id = NEW."componentId";
    
    -- Notify real-time subscribers
    PERFORM pg_notify(
        'milestone_update',
        json_build_object(
            'projectId', project_id,
            'componentId', NEW."componentId",
            'milestoneId', NEW.id,
            'milestoneName', NEW."milestoneName",
            'isCompleted', NEW."isCompleted",
            'percentageComplete', NEW."percentageComplete",
            'quantityComplete', NEW."quantityComplete",
            'timestamp', extract(epoch from NOW())
        )::text
    );
    
    RETURN NEW;
END;
$$;

-- Create trigger for milestone updates (if not exists)
DROP TRIGGER IF EXISTS milestone_update_notify ON "ComponentMilestone";
CREATE TRIGGER milestone_update_notify
    AFTER UPDATE ON "ComponentMilestone"
    FOR EACH ROW
    WHEN (
        OLD."isCompleted" IS DISTINCT FROM NEW."isCompleted" OR
        OLD."percentageComplete" IS DISTINCT FROM NEW."percentageComplete" OR
        OLD."quantityComplete" IS DISTINCT FROM NEW."quantityComplete"
    )
    EXECUTE FUNCTION milestone_update_trigger();

-- 6. Materialized View for Project Progress Summary
CREATE MATERIALIZED VIEW IF NOT EXISTS project_milestone_summary AS
SELECT 
    p.id as "projectId",
    p."jobName",
    p."organizationId",
    COUNT(DISTINCT c.id) as total_components,
    COUNT(DISTINCT CASE WHEN c."status" = 'COMPLETED' THEN c.id END) as completed_components,
    COUNT(DISTINCT CASE WHEN c."status" = 'IN_PROGRESS' THEN c.id END) as in_progress_components,
    ROUND(AVG(c."completionPercent"), 2) as avg_completion_percent,
    COUNT(DISTINCT cm.id) as total_milestones,
    COUNT(DISTINCT CASE WHEN cm."isCompleted" = true THEN cm.id END) as completed_milestones,
    ROUND(
        COUNT(DISTINCT CASE WHEN cm."isCompleted" = true THEN cm.id END)::DECIMAL / 
        NULLIF(COUNT(DISTINCT cm.id), 0) * 100, 2
    ) as milestone_completion_percent,
    MAX(cm."completedAt") as last_milestone_completion,
    COUNT(DISTINCT cm."completedBy") as active_users
FROM "Project" p
LEFT JOIN "Component" c ON p.id = c."projectId"
LEFT JOIN "ComponentMilestone" cm ON c.id = cm."componentId"
GROUP BY p.id, p."jobName", p."organizationId";

-- Index for materialized view
CREATE UNIQUE INDEX idx_project_milestone_summary_project_id 
ON project_milestone_summary ("projectId");

-- 7. Function to refresh project summary
CREATE OR REPLACE FUNCTION refresh_project_summary(project_id_param TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    IF project_id_param IS NULL THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY project_milestone_summary;
    ELSE
        -- For single project, we'd need to implement selective refresh
        -- For now, refresh the entire view
        REFRESH MATERIALIZED VIEW CONCURRENTLY project_milestone_summary;
    END IF;
END;
$$;

-- 8. Batch Milestone Update RPC Function
CREATE OR REPLACE FUNCTION batch_update_milestones(
    updates JSONB,
    user_id TEXT,
    transaction_id TEXT DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    component_id TEXT,
    milestone_name TEXT,
    error_message TEXT,
    updated_milestone JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    update_item JSONB;
    milestone_record RECORD;
    component_record RECORD;
    update_data JSONB := '{}';
    result_milestone JSONB;
    has_access BOOLEAN := false;
BEGIN
    -- Validate user authentication
    IF user_id IS NULL THEN
        RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT, 'User not authenticated'::TEXT, NULL::JSONB;
        RETURN;
    END IF;
    
    -- Process each update
    FOR update_item IN SELECT * FROM jsonb_array_elements(updates) LOOP
        BEGIN
            -- Validate required fields
            IF NOT (update_item ? 'componentId' AND update_item ? 'milestoneName') THEN
                RETURN QUERY SELECT 
                    false, 
                    COALESCE(update_item->>'componentId', ''), 
                    COALESCE(update_item->>'milestoneName', ''), 
                    'Missing componentId or milestoneName'::TEXT, 
                    NULL::JSONB;
                CONTINUE;
            END IF;
            
            -- Find milestone and verify access
            SELECT cm.*, c."workflowType", c."projectId", p."organizationId"
            INTO milestone_record
            FROM "ComponentMilestone" cm
            JOIN "Component" c ON cm."componentId" = c.id
            JOIN "Project" p ON c."projectId" = p.id
            WHERE cm."componentId" = (update_item->>'componentId')
            AND cm."milestoneName" = (update_item->>'milestoneName');
            
            IF milestone_record IS NULL THEN
                RETURN QUERY SELECT 
                    false, 
                    update_item->>'componentId', 
                    update_item->>'milestoneName', 
                    'Milestone not found'::TEXT, 
                    NULL::JSONB;
                CONTINUE;
            END IF;
            
            -- Check user access to organization
            SELECT EXISTS(
                SELECT 1 FROM "Member" m 
                WHERE m."userId" = user_id 
                AND m."organizationId" = milestone_record."organizationId"
            ) INTO has_access;
            
            IF NOT has_access THEN
                RETURN QUERY SELECT 
                    false, 
                    update_item->>'componentId', 
                    update_item->>'milestoneName', 
                    'Access denied'::TEXT, 
                    NULL::JSONB;
                CONTINUE;
            END IF;
            
            -- Prepare update based on workflow type
            update_data := '{}';
            
            IF milestone_record."workflowType" = 'MILESTONE_DISCRETE' AND update_item ? 'isCompleted' THEN
                update_data := jsonb_build_object(
                    'isCompleted', (update_item->>'isCompleted')::BOOLEAN,
                    'completedAt', CASE 
                        WHEN (update_item->>'isCompleted')::BOOLEAN THEN NOW() 
                        ELSE NULL 
                    END,
                    'completedBy', CASE 
                        WHEN (update_item->>'isCompleted')::BOOLEAN THEN user_id 
                        ELSE NULL 
                    END
                );
            ELSIF milestone_record."workflowType" = 'MILESTONE_PERCENTAGE' AND update_item ? 'percentageValue' THEN
                update_data := jsonb_build_object(
                    'percentageComplete', (update_item->>'percentageValue')::DECIMAL,
                    'isCompleted', (update_item->>'percentageValue')::DECIMAL >= 100,
                    'completedAt', CASE 
                        WHEN (update_item->>'percentageValue')::DECIMAL >= 100 THEN NOW() 
                        ELSE NULL 
                    END,
                    'completedBy', CASE 
                        WHEN (update_item->>'percentageValue')::DECIMAL >= 100 THEN user_id 
                        ELSE NULL 
                    END
                );
            ELSIF milestone_record."workflowType" = 'MILESTONE_QUANTITY' AND update_item ? 'quantityValue' THEN
                update_data := jsonb_build_object(
                    'quantityComplete', (update_item->>'quantityValue')::DECIMAL,
                    'isCompleted', (update_item->>'quantityValue')::DECIMAL >= COALESCE(milestone_record."quantityTotal", 0),
                    'completedAt', CASE 
                        WHEN (update_item->>'quantityValue')::DECIMAL >= COALESCE(milestone_record."quantityTotal", 0) THEN NOW() 
                        ELSE NULL 
                    END,
                    'completedBy', CASE 
                        WHEN (update_item->>'quantityValue')::DECIMAL >= COALESCE(milestone_record."quantityTotal", 0) THEN user_id 
                        ELSE NULL 
                    END
                );
            ELSE
                RETURN QUERY SELECT 
                    false, 
                    update_item->>'componentId', 
                    update_item->>'milestoneName', 
                    'Invalid update for workflow type'::TEXT, 
                    NULL::JSONB;
                CONTINUE;
            END IF;
            
            -- Perform update
            UPDATE "ComponentMilestone"
            SET 
                "isCompleted" = COALESCE((update_data->>'isCompleted')::BOOLEAN, "isCompleted"),
                "percentageComplete" = COALESCE((update_data->>'percentageComplete')::DECIMAL, "percentageComplete"),
                "quantityComplete" = COALESCE((update_data->>'quantityComplete')::DECIMAL, "quantityComplete"),
                "completedAt" = CASE 
                    WHEN update_data ? 'completedAt' THEN (update_data->>'completedAt')::TIMESTAMP WITH TIME ZONE
                    ELSE "completedAt"
                END,
                "completedBy" = CASE 
                    WHEN update_data ? 'completedBy' AND update_data->>'completedBy' IS NOT NULL THEN update_data->>'completedBy'
                    WHEN update_data ? 'completedBy' AND update_data->>'completedBy' IS NULL THEN NULL
                    ELSE "completedBy"
                END,
                "updatedAt" = NOW()
            WHERE id = milestone_record.id;
            
            -- Get updated milestone data
            SELECT to_jsonb(cm.*) INTO result_milestone
            FROM "ComponentMilestone" cm
            WHERE cm.id = milestone_record.id;
            
            RETURN QUERY SELECT 
                true, 
                update_item->>'componentId', 
                update_item->>'milestoneName', 
                NULL::TEXT, 
                result_milestone;
                
        EXCEPTION
            WHEN OTHERS THEN
                RETURN QUERY SELECT 
                    false, 
                    COALESCE(update_item->>'componentId', ''), 
                    COALESCE(update_item->>'milestoneName', ''), 
                    SQLERRM::TEXT, 
                    NULL::JSONB;
        END;
    END LOOP;
END;
$$;

-- 9. Grant appropriate permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON project_milestone_summary TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_component_completion(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_components_completion(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_project_summary(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION batch_update_milestones(JSONB, TEXT, TEXT) TO authenticated;
GRANT INSERT, SELECT, UPDATE ON "BulkOperationTransaction" TO authenticated;

-- 10. Comments for documentation
COMMENT ON FUNCTION calculate_component_completion IS 'Optimized function to calculate component completion percentage based on milestone progress and weights';
COMMENT ON FUNCTION update_components_completion IS 'Batch update component completion status for multiple components';
COMMENT ON FUNCTION batch_update_milestones IS 'RPC function for secure batch milestone updates with proper access control';
COMMENT ON MATERIALIZED VIEW project_milestone_summary IS 'Pre-computed project progress statistics for dashboard performance';
COMMENT ON TABLE "BulkOperationTransaction" IS 'Transaction tracking for bulk operations with rollback support';