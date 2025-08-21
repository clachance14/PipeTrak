-- Rollback: Remove effectiveDate column from ComponentMilestone
-- WARNING: This will permanently delete all effective date data

-- Drop indexes
DROP INDEX IF EXISTS "ComponentMilestone_effectiveDate_idx";
DROP INDEX IF EXISTS "ComponentMilestone_componentId_effectiveDate_idx";

-- Drop column
ALTER TABLE "ComponentMilestone" DROP COLUMN IF EXISTS "effectiveDate";

-- Verification query
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'ComponentMilestone' 
  AND column_name = 'effectiveDate';