-- Migration: Add effectiveDate column to ComponentMilestone for Progress Summary Report backdating support
-- Required for tracking when work was actually completed vs when it was recorded

-- Add effectiveDate column with default to current date
ALTER TABLE "ComponentMilestone" ADD COLUMN "effectiveDate" DATE NOT NULL DEFAULT CURRENT_DATE;

-- Update existing records to use completedAt date if available, otherwise current date
UPDATE "ComponentMilestone" 
SET "effectiveDate" = COALESCE(DATE("completedAt"), CURRENT_DATE)
WHERE "effectiveDate" = CURRENT_DATE;

-- Create indexes for efficient querying by effective date
CREATE INDEX "ComponentMilestone_effectiveDate_idx" ON "ComponentMilestone"("effectiveDate");
CREATE INDEX "ComponentMilestone_componentId_effectiveDate_idx" ON "ComponentMilestone"("componentId", "effectiveDate");

-- Add comment for documentation
COMMENT ON COLUMN "ComponentMilestone"."effectiveDate" IS 'Date when work was actually completed (supports backdating for weekend work entry)';