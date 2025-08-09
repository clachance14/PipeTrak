-- Rollback for Step 4: Re-add 'name' column
-- This rollback recreates the original 'name' column with data from 'jobName'

-- Re-add the original 'name' column
ALTER TABLE "project" ADD COLUMN "name" TEXT;

-- Copy data from 'jobName' back to 'name'
UPDATE "project" SET "name" = "jobName";

-- Make 'name' NOT NULL to match original schema
ALTER TABLE "project" ALTER COLUMN "name" SET NOT NULL;