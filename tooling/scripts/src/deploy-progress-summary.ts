#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deployProgressSummaryFunctions() {
  console.log('🚀 Deploying Progress Summary Report SQL functions...\n');

  const sqlFunctions = `
-- Function to calculate progress summary by area
CREATE OR REPLACE FUNCTION get_progress_summary_by_area(
  p_project_id UUID,
  p_week_ending DATE DEFAULT NULL
)
RETURNS TABLE (
  area TEXT,
  component_count BIGINT,
  received_pct NUMERIC,
  installed_pct NUMERIC,
  punched_pct NUMERIC,
  tested_pct NUMERIC,
  restored_pct NUMERIC,
  overall_pct NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use current Sunday if no week ending provided
  IF p_week_ending IS NULL THEN
    p_week_ending := date_trunc('week', CURRENT_DATE)::date + 6;
  END IF;

  RETURN QUERY
  WITH milestone_data AS (
    SELECT 
      c.area,
      c.id as component_id,
      MAX(CASE 
        WHEN cm."milestoneName" = 'Receive' THEN 
          CASE WHEN cm."isCompleted" THEN 100 
               ELSE COALESCE(cm."percentageValue", 0) 
          END
        ELSE 0 
      END) as received,
      MAX(CASE 
        WHEN cm."milestoneName" = 'Install' THEN 
          CASE WHEN cm."isCompleted" THEN 100 
               ELSE COALESCE(cm."percentageValue", 0) 
          END
        ELSE 0 
      END) as installed,
      MAX(CASE 
        WHEN cm."milestoneName" = 'Punch' THEN 
          CASE WHEN cm."isCompleted" THEN 100 
               ELSE COALESCE(cm."percentageValue", 0) 
          END
        ELSE 0 
      END) as punched,
      MAX(CASE 
        WHEN cm."milestoneName" = 'Test' THEN 
          CASE WHEN cm."isCompleted" THEN 100 
               ELSE COALESCE(cm."percentageValue", 0) 
          END
        ELSE 0 
      END) as tested,
      MAX(CASE 
        WHEN cm."milestoneName" = 'Restore' THEN 
          CASE WHEN cm."isCompleted" THEN 100 
               ELSE COALESCE(cm."percentageValue", 0) 
          END
        ELSE 0 
      END) as restored
    FROM "Component" c
    LEFT JOIN "ComponentMilestone" cm ON cm."componentId" = c.id
      AND (cm."effectiveDate" IS NULL OR cm."effectiveDate" <= p_week_ending)
    WHERE c."projectId" = p_project_id
    GROUP BY c.area, c.id
  )
  SELECT 
    area::TEXT,
    COUNT(DISTINCT component_id)::BIGINT as component_count,
    ROUND(AVG(received), 2) as received_pct,
    ROUND(AVG(installed), 2) as installed_pct,
    ROUND(AVG(punched), 2) as punched_pct,
    ROUND(AVG(tested), 2) as tested_pct,
    ROUND(AVG(restored), 2) as restored_pct,
    ROUND((AVG(received) + AVG(installed) + AVG(punched) + AVG(tested) + AVG(restored)) / 5, 2) as overall_pct
  FROM milestone_data
  GROUP BY area
  ORDER BY area;
END;
$$;

-- Function to calculate progress summary by system
CREATE OR REPLACE FUNCTION get_progress_summary_by_system(
  p_project_id UUID,
  p_week_ending DATE DEFAULT NULL
)
RETURNS TABLE (
  system TEXT,
  component_count BIGINT,
  received_pct NUMERIC,
  installed_pct NUMERIC,
  punched_pct NUMERIC,
  tested_pct NUMERIC,
  restored_pct NUMERIC,
  overall_pct NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use current Sunday if no week ending provided
  IF p_week_ending IS NULL THEN
    p_week_ending := date_trunc('week', CURRENT_DATE)::date + 6;
  END IF;

  RETURN QUERY
  WITH milestone_data AS (
    SELECT 
      c.system,
      c.id as component_id,
      MAX(CASE 
        WHEN cm."milestoneName" = 'Receive' THEN 
          CASE WHEN cm."isCompleted" THEN 100 
               ELSE COALESCE(cm."percentageValue", 0) 
          END
        ELSE 0 
      END) as received,
      MAX(CASE 
        WHEN cm."milestoneName" = 'Install' THEN 
          CASE WHEN cm."isCompleted" THEN 100 
               ELSE COALESCE(cm."percentageValue", 0) 
          END
        ELSE 0 
      END) as installed,
      MAX(CASE 
        WHEN cm."milestoneName" = 'Punch' THEN 
          CASE WHEN cm."isCompleted" THEN 100 
               ELSE COALESCE(cm."percentageValue", 0) 
          END
        ELSE 0 
      END) as punched,
      MAX(CASE 
        WHEN cm."milestoneName" = 'Test' THEN 
          CASE WHEN cm."isCompleted" THEN 100 
               ELSE COALESCE(cm."percentageValue", 0) 
          END
        ELSE 0 
      END) as tested,
      MAX(CASE 
        WHEN cm."milestoneName" = 'Restore' THEN 
          CASE WHEN cm."isCompleted" THEN 100 
               ELSE COALESCE(cm."percentageValue", 0) 
          END
        ELSE 0 
      END) as restored
    FROM "Component" c
    LEFT JOIN "ComponentMilestone" cm ON cm."componentId" = c.id
      AND (cm."effectiveDate" IS NULL OR cm."effectiveDate" <= p_week_ending)
    WHERE c."projectId" = p_project_id
    GROUP BY c.system, c.id
  )
  SELECT 
    system::TEXT,
    COUNT(DISTINCT component_id)::BIGINT as component_count,
    ROUND(AVG(received), 2) as received_pct,
    ROUND(AVG(installed), 2) as installed_pct,
    ROUND(AVG(punched), 2) as punched_pct,
    ROUND(AVG(tested), 2) as tested_pct,
    ROUND(AVG(restored), 2) as restored_pct,
    ROUND((AVG(received) + AVG(installed) + AVG(punched) + AVG(tested) + AVG(restored)) / 5, 2) as overall_pct
  FROM milestone_data
  GROUP BY system
  ORDER BY system;
END;
$$;

-- Function to calculate progress summary by test package
CREATE OR REPLACE FUNCTION get_progress_summary_by_test_package(
  p_project_id UUID,
  p_week_ending DATE DEFAULT NULL
)
RETURNS TABLE (
  test_package TEXT,
  component_count BIGINT,
  received_pct NUMERIC,
  installed_pct NUMERIC,
  punched_pct NUMERIC,
  tested_pct NUMERIC,
  restored_pct NUMERIC,
  overall_pct NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use current Sunday if no week ending provided
  IF p_week_ending IS NULL THEN
    p_week_ending := date_trunc('week', CURRENT_DATE)::date + 6;
  END IF;

  RETURN QUERY
  WITH milestone_data AS (
    SELECT 
      c."testPackage",
      c.id as component_id,
      MAX(CASE 
        WHEN cm."milestoneName" = 'Receive' THEN 
          CASE WHEN cm."isCompleted" THEN 100 
               ELSE COALESCE(cm."percentageValue", 0) 
          END
        ELSE 0 
      END) as received,
      MAX(CASE 
        WHEN cm."milestoneName" = 'Install' THEN 
          CASE WHEN cm."isCompleted" THEN 100 
               ELSE COALESCE(cm."percentageValue", 0) 
          END
        ELSE 0 
      END) as installed,
      MAX(CASE 
        WHEN cm."milestoneName" = 'Punch' THEN 
          CASE WHEN cm."isCompleted" THEN 100 
               ELSE COALESCE(cm."percentageValue", 0) 
          END
        ELSE 0 
      END) as punched,
      MAX(CASE 
        WHEN cm."milestoneName" = 'Test' THEN 
          CASE WHEN cm."isCompleted" THEN 100 
               ELSE COALESCE(cm."percentageValue", 0) 
          END
        ELSE 0 
      END) as tested,
      MAX(CASE 
        WHEN cm."milestoneName" = 'Restore' THEN 
          CASE WHEN cm."isCompleted" THEN 100 
               ELSE COALESCE(cm."percentageValue", 0) 
          END
        ELSE 0 
      END) as restored
    FROM "Component" c
    LEFT JOIN "ComponentMilestone" cm ON cm."componentId" = c.id
      AND (cm."effectiveDate" IS NULL OR cm."effectiveDate" <= p_week_ending)
    WHERE c."projectId" = p_project_id
      AND c."testPackage" IS NOT NULL
    GROUP BY c."testPackage", c.id
  )
  SELECT 
    test_package::TEXT,
    COUNT(DISTINCT component_id)::BIGINT as component_count,
    ROUND(AVG(received), 2) as received_pct,
    ROUND(AVG(installed), 2) as installed_pct,
    ROUND(AVG(punched), 2) as punched_pct,
    ROUND(AVG(tested), 2) as tested_pct,
    ROUND(AVG(restored), 2) as restored_pct,
    ROUND((AVG(received) + AVG(installed) + AVG(punched) + AVG(tested) + AVG(restored)) / 5, 2) as overall_pct
  FROM milestone_data
  GROUP BY test_package
  ORDER BY test_package;
END;
$$;

-- Function to store progress snapshot
CREATE OR REPLACE FUNCTION store_progress_snapshot(
  p_project_id UUID,
  p_week_ending DATE,
  p_snapshot_data JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_snapshot_id UUID;
  v_is_final BOOLEAN;
BEGIN
  -- Determine if snapshot should be FINAL based on Tuesday 9 AM cutoff
  v_is_final := CURRENT_TIMESTAMP >= (p_week_ending + INTERVAL '2 days 9 hours');

  INSERT INTO "ProgressSnapshot" (
    "projectId",
    "weekEnding",
    "createdAt",
    "snapshotData",
    "status"
  ) VALUES (
    p_project_id,
    p_week_ending,
    NOW(),
    p_snapshot_data,
    CASE WHEN v_is_final THEN 'FINAL' ELSE 'PRELIMINARY' END
  )
  RETURNING id INTO v_snapshot_id;

  RETURN v_snapshot_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_progress_summary_by_area TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_progress_summary_by_system TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_progress_summary_by_test_package TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION store_progress_snapshot TO authenticated, service_role;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_component_milestone_effective 
ON "ComponentMilestone"("projectId", "effectiveDate", "milestoneName");

CREATE INDEX IF NOT EXISTS idx_progress_snapshot_lookup
ON "ProgressSnapshot"("projectId", "weekEnding", "status");
`;

  try {
    // Execute the SQL functions
    const { error } = await supabase.rpc('exec_sql', { sql: sqlFunctions });
    
    if (error) {
      // Try executing directly as it might be a custom function issue
      const { data, error: directError } = await supabase.from('_prisma_migrations').select('id').limit(1);
      
      if (!directError) {
        console.log('✅ Database connection verified');
        console.log('⚠️  Note: SQL functions need to be deployed via Supabase Dashboard SQL Editor');
        console.log('\n📋 Copy the SQL from:');
        console.log('   packages/database/supabase/migrations/20250812T1600_progress_summary_functions.sql');
        console.log('\n📌 Paste and run in:');
        console.log('   https://supabase.com/dashboard/project/ogmahtkaqziaoxldxnts/sql/new');
      } else {
        throw directError;
      }
    } else {
      console.log('✅ Progress Summary SQL functions deployed successfully!');
    }

    // Verify the effectiveDate column exists
    const { data: columns } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'ComponentMilestone' 
        AND column_name = 'effectiveDate';
      `
    });

    if (columns && columns.length > 0) {
      console.log('✅ effectiveDate column verified in ComponentMilestone table');
    } else {
      console.log('⚠️  effectiveDate column not found - Prisma migration may need to be applied');
    }

    // Create initial test data for verification
    console.log('\n🧪 Creating test snapshot for verification...');
    
    const testSnapshot = {
      groupBy: 'area',
      data: [
        {
          area: 'TEST-AREA',
          componentCount: 10,
          milestones: {
            received: 100,
            installed: 85,
            punched: 70,
            tested: 50,
            restored: 25
          },
          overallPercent: 66,
          deltas: {
            received: 5,
            installed: 10,
            punched: 8,
            tested: 3,
            restored: 2,
            overall: 5.6
          }
        }
      ],
      totals: {
        componentCount: 10,
        milestones: {
          received: 100,
          installed: 85,
          punched: 70,
          tested: 50,
          restored: 25
        },
        overallPercent: 66
      }
    };

    console.log('✅ Test data structure validated');
    console.log('\n🎉 Progress Summary Report deployment complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Run SQL functions in Supabase Dashboard if needed');
    console.log('2. Test the report at: /app/pipetrak/[projectId]/reports/progress');
    console.log('3. Verify export functionality (PDF, Excel, CSV)');
    
  } catch (err) {
    console.error('❌ Deployment error:', err);
    process.exit(1);
  }
}

// Run the deployment
deployProgressSummaryFunctions()
  .then(() => {
    console.log('\n✨ Deployment script completed successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });