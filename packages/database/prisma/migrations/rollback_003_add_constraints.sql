-- Rollback for Step 3: Remove constraints and indexes
-- This rollback removes the constraints and indexes added for jobNumber

-- Drop the unique constraint
ALTER TABLE "project" DROP CONSTRAINT IF EXISTS "unique_org_job_number";

-- Drop the performance indexes
DROP INDEX IF EXISTS "idx_project_job_number";
DROP INDEX IF EXISTS "idx_project_org_status";

-- Make columns nullable again
ALTER TABLE "project" 
ALTER COLUMN "jobNumber" DROP NOT NULL,
ALTER COLUMN "jobName" DROP NOT NULL;