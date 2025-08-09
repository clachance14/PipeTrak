-- Validation queries to test migration logic
-- Run these after each migration step to verify data integrity

-- After Step 1: Verify columns were added
\d project;

-- After Step 2: Verify data migration
SELECT 
  id, 
  name, 
  "jobName", 
  "jobNumber"
FROM project 
LIMIT 5;

-- Check for null values (should be 0 after step 2)
SELECT 
  COUNT(*) as total_projects,
  COUNT("jobName") as with_job_name,
  COUNT("jobNumber") as with_job_number
FROM project;

-- After Step 3: Verify constraints and indexes
SELECT 
  conname, 
  contype,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'project'::regclass;

SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'project'
ORDER BY indexname;

-- Test uniqueness constraint
SELECT 
  "organizationId", 
  "jobNumber", 
  COUNT(*) 
FROM project 
GROUP BY "organizationId", "jobNumber" 
HAVING COUNT(*) > 1;

-- After Step 4: Verify name column is gone
\d project;