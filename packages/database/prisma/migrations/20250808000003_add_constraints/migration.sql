-- Migration: Step 3 - Add constraints and indexes
-- This migration adds NOT NULL constraints and creates indexes for performance

-- Make the new columns NOT NULL now that they have data
ALTER TABLE "project" 
ALTER COLUMN "jobNumber" SET NOT NULL,
ALTER COLUMN "jobName" SET NOT NULL;

-- Add unique constraint for jobNumber within organization scope
ALTER TABLE "project" 
ADD CONSTRAINT "unique_org_job_number" UNIQUE ("organizationId", "jobNumber");

-- Add performance indexes as specified in the architecture
CREATE INDEX "idx_project_job_number" ON "project" ("jobNumber");
CREATE INDEX "idx_project_org_status" ON "project" ("organizationId", "status");

-- Note: idx_project_organization already exists from the original schema
-- We keep it for backward compatibility with existing query patterns