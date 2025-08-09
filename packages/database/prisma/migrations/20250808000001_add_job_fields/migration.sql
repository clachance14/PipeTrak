-- Migration: Step 1 - Add jobNumber and jobName columns
-- This migration adds the new jobNumber and jobName fields without constraints
-- The existing 'name' field is preserved during this step

-- Add the new columns as nullable initially
ALTER TABLE "project" 
ADD COLUMN "jobNumber" VARCHAR(10),
ADD COLUMN "jobName" TEXT;