-- Rollback for Step 2: Clear migrated data
-- This rollback clears the data from jobNumber and jobName columns
-- Note: Original data is preserved in 'name' column until Step 4

-- Clear the migrated data from new columns
UPDATE "project" 
SET "jobNumber" = NULL, 
    "jobName" = NULL;