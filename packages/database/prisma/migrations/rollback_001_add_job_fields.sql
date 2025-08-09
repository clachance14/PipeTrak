-- Rollback for Step 1: Remove new columns
-- This rollback removes the jobNumber and jobName columns

-- Drop the new columns
ALTER TABLE "project" 
DROP COLUMN IF EXISTS "jobNumber", 
DROP COLUMN IF EXISTS "jobName";