-- Add client field to Project table
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "client" VARCHAR(255);

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Project' 
AND column_name = 'client';