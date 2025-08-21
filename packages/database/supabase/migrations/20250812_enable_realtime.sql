-- Enable Realtime for PipeTrak Components
-- Migration: 20250812_enable_realtime.sql
-- Description: Configure Supabase Realtime for Component, ComponentMilestone, Drawing, and ImportJob tables

-- Enable realtime for key PipeTrak tables
BEGIN;

-- Enable realtime on the publication for tables that need live updates
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public."Component";
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public."ComponentMilestone";
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public."Drawing";
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public."ImportJob";
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public."Project";
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public."AuditLog";

-- Create indexes for realtime performance
CREATE INDEX IF NOT EXISTS "idx_component_realtime" ON public."Component" ("projectId", "updatedAt");
CREATE INDEX IF NOT EXISTS "idx_milestone_realtime" ON public."ComponentMilestone" ("componentId", "updatedAt");
CREATE INDEX IF NOT EXISTS "idx_drawing_realtime" ON public."Drawing" ("projectId", "updatedAt");
CREATE INDEX IF NOT EXISTS "idx_import_realtime" ON public."ImportJob" ("projectId", "status", "updatedAt");
CREATE INDEX IF NOT EXISTS "idx_audit_realtime" ON public."AuditLog" ("projectId", "timestamp");

-- Create function to broadcast custom events to project channels
CREATE OR REPLACE FUNCTION broadcast_project_event()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function will be called from application code to broadcast custom events
  -- The actual broadcasting will be done from the application layer
  RETURN;
END;
$$;

-- Create function to check user access to project for realtime subscriptions
CREATE OR REPLACE FUNCTION check_realtime_access(project_id TEXT, user_id TEXT)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_access boolean := false;
  project_org_id text;
BEGIN
  -- Get project's organization ID
  SELECT "organizationId" INTO project_org_id
  FROM public."Project"
  WHERE id = project_id;
  
  -- Check if user is member of project's organization
  IF project_org_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1
      FROM public.member m
      WHERE m."userId" = user_id
        AND m."organizationId" = project_org_id
    ) INTO has_access;
  END IF;
  
  RETURN has_access;
END;
$$;

-- Create function to get active project users (for presence)
CREATE OR REPLACE FUNCTION get_active_project_users(project_id TEXT)
RETURNS TABLE(
  user_id TEXT,
  user_name TEXT,
  user_email TEXT,
  last_seen TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  project_org_id text;
BEGIN
  -- Get project's organization ID
  SELECT "organizationId" INTO project_org_id
  FROM public."Project"
  WHERE id = project_id;
  
  -- Return organization members who have been active recently
  RETURN QUERY
  SELECT 
    u.id,
    u.name,
    u.email,
    GREATEST(u."updatedAt", COALESCE(s."updatedAt", u."updatedAt")) as last_seen
  FROM public."user" u
  INNER JOIN public.member m ON u.id = m."userId"
  LEFT JOIN public.session s ON u.id = s."userId" 
    AND s."expiresAt" > NOW()
  WHERE m."organizationId" = project_org_id
    AND GREATEST(u."updatedAt", COALESCE(s."updatedAt", u."updatedAt")) > NOW() - INTERVAL '24 hours'
  ORDER BY last_seen DESC;
END;
$$;

-- Create trigger function for audit log realtime notifications
CREATE OR REPLACE FUNCTION notify_audit_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Send notification for audit log changes
  PERFORM pg_notify(
    'audit_log_' || NEW."projectId",
    json_build_object(
      'type', 'audit_log',
      'action', TG_OP,
      'data', row_to_json(NEW)
    )::text
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for audit log notifications
DROP TRIGGER IF EXISTS audit_log_notify ON public."AuditLog";
CREATE TRIGGER audit_log_notify
  AFTER INSERT OR UPDATE OR DELETE ON public."AuditLog"
  FOR EACH ROW
  EXECUTE FUNCTION notify_audit_change();

-- Create trigger function for component change notifications
CREATE OR REPLACE FUNCTION notify_component_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Send notification for component changes
  PERFORM pg_notify(
    'component_' || NEW."projectId",
    json_build_object(
      'type', 'component',
      'action', TG_OP,
      'component_id', NEW.id,
      'drawing_id', NEW."drawingId",
      'status', NEW.status,
      'completion_percent', NEW."completionPercent"
    )::text
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for component notifications
DROP TRIGGER IF EXISTS component_change_notify ON public."Component";
CREATE TRIGGER component_change_notify
  AFTER INSERT OR UPDATE ON public."Component"
  FOR EACH ROW
  EXECUTE FUNCTION notify_component_change();

-- Create trigger function for milestone change notifications
CREATE OR REPLACE FUNCTION notify_milestone_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  project_id text;
BEGIN
  -- Get project ID from component
  SELECT c."projectId" INTO project_id
  FROM public."Component" c
  WHERE c.id = NEW."componentId";
  
  -- Send notification for milestone changes
  PERFORM pg_notify(
    'milestone_' || project_id,
    json_build_object(
      'type', 'milestone',
      'action', TG_OP,
      'component_id', NEW."componentId",
      'milestone_name', NEW."milestoneName",
      'is_completed', NEW."isCompleted",
      'completed_by', NEW."completedBy",
      'completed_at', NEW."completedAt"
    )::text
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for milestone notifications
DROP TRIGGER IF EXISTS milestone_change_notify ON public."ComponentMilestone";
CREATE TRIGGER milestone_change_notify
  AFTER INSERT OR UPDATE ON public."ComponentMilestone"
  FOR EACH ROW
  EXECUTE FUNCTION notify_milestone_change();

-- Create trigger function for import job notifications
CREATE OR REPLACE FUNCTION notify_import_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Send notification for import job status changes
  PERFORM pg_notify(
    'import_' || NEW."projectId",
    json_build_object(
      'type', 'import_job',
      'action', TG_OP,
      'job_id', NEW.id,
      'status', NEW.status,
      'filename', NEW.filename,
      'processed_rows', NEW."processedRows",
      'total_rows', NEW."totalRows",
      'error_rows', NEW."errorRows"
    )::text
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for import job notifications
DROP TRIGGER IF EXISTS import_job_notify ON public."ImportJob";
CREATE TRIGGER import_job_notify
  AFTER INSERT OR UPDATE ON public."ImportJob"
  FOR EACH ROW
  EXECUTE FUNCTION notify_import_change();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_realtime_access(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_project_users(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION broadcast_project_event() TO authenticated;

COMMIT;