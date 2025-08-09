-- Migration: Step 2 - Data Migration
-- This migration copies existing 'name' values to 'jobName' and generates jobNumbers
-- Uses the LEGACY pattern for existing projects to ensure uniqueness

-- Copy existing 'name' values to 'jobName'
UPDATE "project" SET "jobName" = "name";

-- Generate jobNumber from existing name using sanitization approach first
UPDATE "project" 
SET "jobNumber" = UPPER(LEFT(REGEXP_REPLACE("name", '[^A-Za-z0-9]', '', 'g'), 10))
WHERE "jobNumber" IS NULL 
  AND LENGTH(REGEXP_REPLACE("name", '[^A-Za-z0-9]', '', 'g')) > 0;

-- For projects where sanitized name is too short or empty, use incremental numbering per organization
WITH numbered_projects AS (
  SELECT 
    id,
    organizationId,
    ROW_NUMBER() OVER (PARTITION BY organizationId ORDER BY createdAt) as row_num
  FROM "project" 
  WHERE "jobNumber" IS NULL OR LENGTH("jobNumber") = 0
)
UPDATE "project" 
SET "jobNumber" = 'LEGACY' || LPAD(np.row_num::TEXT, 3, '0')
FROM numbered_projects np
WHERE "project".id = np.id;

-- Handle any potential duplicates by making them unique within organization scope
WITH duplicate_check AS (
  SELECT 
    id,
    organizationId,
    jobNumber,
    ROW_NUMBER() OVER (PARTITION BY organizationId, jobNumber ORDER BY createdAt) as dup_num
  FROM "project" 
  WHERE "jobNumber" IS NOT NULL
)
UPDATE "project" 
SET "jobNumber" = "jobNumber" || '-' || dc.dup_num::TEXT
FROM duplicate_check dc
WHERE "project".id = dc.id 
  AND dc.dup_num > 1
  AND LENGTH("jobNumber" || '-' || dc.dup_num::TEXT) <= 10;