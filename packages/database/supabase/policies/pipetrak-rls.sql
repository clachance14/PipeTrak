-- PipeTrak Row Level Security Policies
-- These policies ensure users can only access data within their organization

-- Enable RLS on all PipeTrak tables
ALTER TABLE project ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawing ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE component ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_milestone ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_job ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's organization IDs
CREATE OR REPLACE FUNCTION auth.user_organizations()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT "organizationId" 
  FROM member 
  WHERE "userId" = auth.uid()
  AND role IN ('owner', 'admin', 'member');
$$;

-- Project Policies
-- Users can view projects in their organizations
CREATE POLICY "Users can view projects in their organizations"
  ON project FOR SELECT
  USING ("organizationId" IN (SELECT auth.user_organizations()));

-- Organization admins/owners can create projects
CREATE POLICY "Organization admins can create projects"
  ON project FOR INSERT
  WITH CHECK (
    "organizationId" IN (
      SELECT "organizationId" FROM member 
      WHERE "userId" = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Organization admins/owners can update projects
CREATE POLICY "Organization admins can update projects"
  ON project FOR UPDATE
  USING (
    "organizationId" IN (
      SELECT "organizationId" FROM member 
      WHERE "userId" = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Organization owners can delete projects
CREATE POLICY "Organization owners can delete projects"
  ON project FOR DELETE
  USING (
    "organizationId" IN (
      SELECT "organizationId" FROM member 
      WHERE "userId" = auth.uid() 
      AND role = 'owner'
    )
  );

-- Drawing Policies
-- Users can view drawings for projects in their organizations
CREATE POLICY "Users can view drawings in their organizations"
  ON drawing FOR SELECT
  USING (
    projectId IN (
      SELECT id FROM project 
      WHERE organizationId IN (SELECT auth.user_organizations())
    )
  );

-- Organization admins/owners can manage drawings
CREATE POLICY "Organization admins can create drawings"
  ON drawing FOR INSERT
  WITH CHECK (
    projectId IN (
      SELECT p.id FROM project p
      JOIN member m ON p.organizationId = m.organizationId
      WHERE m.userId = auth.uid() 
      AND m.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Organization admins can update drawings"
  ON drawing FOR UPDATE
  USING (
    projectId IN (
      SELECT p.id FROM project p
      JOIN member m ON p.organizationId = m.organizationId
      WHERE m.userId = auth.uid() 
      AND m.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Organization admins can delete drawings"
  ON drawing FOR DELETE
  USING (
    projectId IN (
      SELECT p.id FROM project p
      JOIN member m ON p.organizationId = m.organizationId
      WHERE m.userId = auth.uid() 
      AND m.role IN ('owner', 'admin')
    )
  );

-- MilestoneTemplate Policies
-- Users can view milestone templates for projects in their organizations
CREATE POLICY "Users can view milestone templates in their organizations"
  ON milestone_template FOR SELECT
  USING (
    projectId IN (
      SELECT id FROM project 
      WHERE organizationId IN (SELECT auth.user_organizations())
    )
  );

-- Organization admins/owners can manage milestone templates
CREATE POLICY "Organization admins can create milestone templates"
  ON milestone_template FOR INSERT
  WITH CHECK (
    projectId IN (
      SELECT p.id FROM project p
      JOIN member m ON p.organizationId = m.organizationId
      WHERE m.userId = auth.uid() 
      AND m.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Organization admins can update milestone templates"
  ON milestone_template FOR UPDATE
  USING (
    projectId IN (
      SELECT p.id FROM project p
      JOIN member m ON p.organizationId = m.organizationId
      WHERE m.userId = auth.uid() 
      AND m.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Organization admins can delete milestone templates"
  ON milestone_template FOR DELETE
  USING (
    projectId IN (
      SELECT p.id FROM project p
      JOIN member m ON p.organizationId = m.organizationId
      WHERE m.userId = auth.uid() 
      AND m.role IN ('owner', 'admin')
    )
  );

-- Component Policies
-- Users can view components for projects in their organizations
CREATE POLICY "Users can view components in their organizations"
  ON component FOR SELECT
  USING (
    projectId IN (
      SELECT id FROM project 
      WHERE organizationId IN (SELECT auth.user_organizations())
    )
  );

-- Organization members can create components (foremen can add components)
CREATE POLICY "Organization members can create components"
  ON component FOR INSERT
  WITH CHECK (
    projectId IN (
      SELECT p.id FROM project p
      JOIN member m ON p.organizationId = m.organizationId
      WHERE m.userId = auth.uid() 
      AND m.role IN ('owner', 'admin', 'member')
    )
  );

-- Organization members can update components (foremen can update milestones)
CREATE POLICY "Organization members can update components"
  ON component FOR UPDATE
  USING (
    projectId IN (
      SELECT p.id FROM project p
      JOIN member m ON p.organizationId = m.organizationId
      WHERE m.userId = auth.uid() 
      AND m.role IN ('owner', 'admin', 'member')
    )
  );

-- Only admins/owners can delete components
CREATE POLICY "Organization admins can delete components"
  ON component FOR DELETE
  USING (
    projectId IN (
      SELECT p.id FROM project p
      JOIN member m ON p.organizationId = m.organizationId
      WHERE m.userId = auth.uid() 
      AND m.role IN ('owner', 'admin')
    )
  );

-- ComponentMilestone Policies
-- Users can view component milestones for components in their organizations
CREATE POLICY "Users can view component milestones in their organizations"
  ON component_milestone FOR SELECT
  USING (
    componentId IN (
      SELECT c.id FROM component c
      JOIN project p ON c.projectId = p.id
      WHERE p.organizationId IN (SELECT auth.user_organizations())
    )
  );

-- Organization members can create/update component milestones (foremen can update)
CREATE POLICY "Organization members can create component milestones"
  ON component_milestone FOR INSERT
  WITH CHECK (
    componentId IN (
      SELECT c.id FROM component c
      JOIN project p ON c.projectId = p.id
      JOIN member m ON p.organizationId = m.organizationId
      WHERE m.userId = auth.uid() 
      AND m.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Organization members can update component milestones"
  ON component_milestone FOR UPDATE
  USING (
    componentId IN (
      SELECT c.id FROM component c
      JOIN project p ON c.projectId = p.id
      JOIN member m ON p.organizationId = m.organizationId
      WHERE m.userId = auth.uid() 
      AND m.role IN ('owner', 'admin', 'member')
    )
  );

-- Only admins/owners can delete component milestones
CREATE POLICY "Organization admins can delete component milestones"
  ON component_milestone FOR DELETE
  USING (
    componentId IN (
      SELECT c.id FROM component c
      JOIN project p ON c.projectId = p.id
      JOIN member m ON p.organizationId = m.organizationId
      WHERE m.userId = auth.uid() 
      AND m.role IN ('owner', 'admin')
    )
  );

-- ImportJob Policies
-- Users can view import jobs for projects in their organizations
CREATE POLICY "Users can view import jobs in their organizations"
  ON import_job FOR SELECT
  USING (
    projectId IN (
      SELECT id FROM project 
      WHERE organizationId IN (SELECT auth.user_organizations())
    )
  );

-- Organization admins/owners can create import jobs
CREATE POLICY "Organization admins can create import jobs"
  ON import_job FOR INSERT
  WITH CHECK (
    projectId IN (
      SELECT p.id FROM project p
      JOIN member m ON p.organizationId = m.organizationId
      WHERE m.userId = auth.uid() 
      AND m.role IN ('owner', 'admin')
    )
  );

-- Organization admins/owners can update import jobs
CREATE POLICY "Organization admins can update import jobs"
  ON import_job FOR UPDATE
  USING (
    projectId IN (
      SELECT p.id FROM project p
      JOIN member m ON p.organizationId = m.organizationId
      WHERE m.userId = auth.uid() 
      AND m.role IN ('owner', 'admin')
    )
  );

-- AuditLog Policies
-- Users can view audit logs for projects in their organizations
CREATE POLICY "Users can view audit logs in their organizations"
  ON audit_log FOR SELECT
  USING (
    projectId IN (
      SELECT id FROM project 
      WHERE organizationId IN (SELECT auth.user_organizations())
    )
  );

-- Audit logs are created automatically, no manual insert allowed
-- No update or delete allowed on audit logs to maintain integrity

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_organization ON project(organizationId);
CREATE INDEX IF NOT EXISTS idx_drawing_project ON drawing(projectId);
CREATE INDEX IF NOT EXISTS idx_component_project ON component(projectId);
CREATE INDEX IF NOT EXISTS idx_component_drawing ON component(drawingId);
CREATE INDEX IF NOT EXISTS idx_component_area_system ON component(projectId, area, system);
CREATE INDEX IF NOT EXISTS idx_component_milestone_component ON component_milestone(componentId);
CREATE INDEX IF NOT EXISTS idx_milestone_template_project ON milestone_template(projectId);
CREATE INDEX IF NOT EXISTS idx_import_job_project ON import_job(projectId);
CREATE INDEX IF NOT EXISTS idx_audit_log_project ON audit_log(projectId);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entityType, entityId);