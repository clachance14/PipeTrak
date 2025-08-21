-- Add ComponentType enum and update Component table
-- This migration fixes the schema mismatch where Prisma expects enum but DB has TEXT

-- Step 1: Create ComponentType enum with all values from Prisma schema
CREATE TYPE "ComponentType" AS ENUM (
  'SPOOL',
  'PIPING_FOOTAGE', 
  'THREADED_PIPE',
  'FITTING',
  'VALVE',
  'FLANGE',
  'GASKET',
  'SUPPORT',
  'FIELD_WELD',
  'INSTRUMENT',
  'INSULATION',
  'PAINT',
  'OTHER'
);

-- Step 2: Update Component table to use enum type
-- First ensure all existing data has valid enum values
UPDATE "Component" 
SET type = 'OTHER' 
WHERE type NOT IN (
  'SPOOL', 'PIPING_FOOTAGE', 'THREADED_PIPE', 'FITTING',
  'VALVE', 'FLANGE', 'GASKET', 'SUPPORT', 'FIELD_WELD',
  'INSTRUMENT', 'INSULATION', 'PAINT', 'OTHER'
);

-- Step 3: Alter column type from TEXT to ComponentType enum
ALTER TABLE "Component" 
ALTER COLUMN "type" TYPE "ComponentType" 
USING "type"::"ComponentType";

-- Step 4: Verify the change
-- Check enum values are available
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'ComponentType'::regtype ORDER BY enumsortorder;

-- Check table structure
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'Component' AND column_name = 'type';

-- Step 5: Add comment for documentation
COMMENT ON TYPE "ComponentType" IS 'Component types for PipeTrak industrial construction tracking';
COMMENT ON COLUMN "Component"."type" IS 'Component type using ComponentType enum (was TEXT before migration)';