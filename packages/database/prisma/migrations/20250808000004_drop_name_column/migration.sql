-- Migration: Step 4 - Remove old 'name' column
-- This migration drops the original 'name' column after successful data migration
-- This step completes the column rename from 'name' to 'jobName'

-- Drop the original 'name' column
ALTER TABLE "project" DROP COLUMN "name";