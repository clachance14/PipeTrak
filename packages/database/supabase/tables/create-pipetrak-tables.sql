-- Create PipeTrak tables manually
-- This script creates the core tables needed for PipeTrak

-- Create Drawing table
CREATE TABLE IF NOT EXISTS "Drawing" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "projectId" TEXT NOT NULL,
    number TEXT NOT NULL,
    title TEXT NOT NULL,
    revision TEXT,
    "parentDrawingId" TEXT,
    metadata JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("projectId") REFERENCES "project"(id) ON DELETE CASCADE,
    FOREIGN KEY ("parentDrawingId") REFERENCES "Drawing"(id) ON DELETE SET NULL
);

-- Create MilestoneTemplate table
CREATE TABLE IF NOT EXISTS "MilestoneTemplate" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "projectId" TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    milestones JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("projectId") REFERENCES "project"(id) ON DELETE CASCADE
);

-- Create Component table  
CREATE TABLE IF NOT EXISTS "Component" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "projectId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    type TEXT NOT NULL,
    "workflowType" TEXT NOT NULL DEFAULT 'MILESTONE_DISCRETE',
    spec TEXT,
    size TEXT,
    material TEXT,
    area TEXT,
    system TEXT,
    "testPackage" TEXT,
    location TEXT,
    "parentComponentId" TEXT,
    "drawingId" TEXT,
    "milestoneTemplateId" TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "completionPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    metadata JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("projectId") REFERENCES "project"(id) ON DELETE CASCADE,
    FOREIGN KEY ("drawingId") REFERENCES "Drawing"(id) ON DELETE SET NULL,
    FOREIGN KEY ("milestoneTemplateId") REFERENCES "MilestoneTemplate"(id),
    FOREIGN KEY ("parentComponentId") REFERENCES "Component"(id) ON DELETE SET NULL,
    CONSTRAINT check_workflow_type CHECK ("workflowType" IN ('MILESTONE_DISCRETE', 'MILESTONE_PERCENTAGE', 'MILESTONE_QUANTITY')),
    CONSTRAINT check_status CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'))
);

-- Create ComponentMilestone table
CREATE TABLE IF NOT EXISTS "ComponentMilestone" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "componentId" TEXT NOT NULL,
    "milestoneName" TEXT NOT NULL,
    "milestoneOrder" INTEGER NOT NULL,
    weight DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "percentageValue" DOUBLE PRECISION,
    "quantityValue" DOUBLE PRECISION,
    "quantityUnit" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("componentId") REFERENCES "Component"(id) ON DELETE CASCADE,
    FOREIGN KEY ("completedBy") REFERENCES "user"(id) ON DELETE SET NULL,
    UNIQUE ("componentId", "milestoneName")
);

-- Create ImportJob table
CREATE TABLE IF NOT EXISTS "ImportJob" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    filename TEXT NOT NULL,
    "originalPath" TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    "totalRows" INTEGER,
    "processedRows" INTEGER,
    "errorRows" INTEGER,
    errors JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("projectId") REFERENCES "project"(id) ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE,
    CONSTRAINT check_import_status CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'))
);

-- Create AuditLog table
CREATE TABLE IF NOT EXISTS "AuditLog" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    changes JSONB NOT NULL,
    metadata JSONB,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("projectId") REFERENCES "project"(id) ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_component_project ON "Component"("projectId");
CREATE INDEX IF NOT EXISTS idx_component_drawing ON "Component"("drawingId");
CREATE INDEX IF NOT EXISTS idx_component_area_system ON "Component"(area, system);
CREATE INDEX IF NOT EXISTS idx_component_test_package ON "Component"("testPackage");
CREATE INDEX IF NOT EXISTS idx_component_status ON "Component"(status);
CREATE INDEX IF NOT EXISTS idx_component_milestone_component ON "ComponentMilestone"("componentId");
CREATE INDEX IF NOT EXISTS idx_component_milestone_completed ON "ComponentMilestone"("componentId", "isCompleted");
CREATE INDEX IF NOT EXISTS idx_drawing_project ON "Drawing"("projectId");
CREATE INDEX IF NOT EXISTS idx_milestone_template_project ON "MilestoneTemplate"("projectId");
CREATE INDEX IF NOT EXISTS idx_milestone_template_default ON "MilestoneTemplate"("projectId", "isDefault");
CREATE INDEX IF NOT EXISTS idx_import_job_project ON "ImportJob"("projectId");
CREATE INDEX IF NOT EXISTS idx_audit_log_project ON "AuditLog"("projectId");
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON "AuditLog"(entity, "entityId");