-- Add unique constraint for job number within organization
ALTER TABLE "Project" 
ADD CONSTRAINT unique_org_job_number 
UNIQUE ("organizationId", "jobNumber");