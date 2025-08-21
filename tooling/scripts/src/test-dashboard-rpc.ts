import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '../../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

async function checkRPCFunctions() {
  console.log('Testing dashboard RPC functions...\n');
  
  const projectId = 'uy354nt3i2qi8tsh4a8kz2tp';
  
  // Test get_dashboard_metrics
  console.log('Testing get_dashboard_metrics...');
  const { data: metrics, error: metricsError } = await supabase.rpc('get_dashboard_metrics', {
    p_project_id: projectId
  });
  
  if (metricsError) {
    console.error('❌ get_dashboard_metrics error:', metricsError.message);
    console.error('   Details:', metricsError);
  } else {
    console.log('✅ get_dashboard_metrics result:', metrics);
  }
  
  // Test other RPC functions
  console.log('\nTesting get_area_system_matrix...');
  const { data: matrix, error: matrixError } = await supabase.rpc('get_area_system_matrix', {
    p_project_id: projectId
  });
  
  if (matrixError) {
    console.error('❌ get_area_system_matrix error:', matrixError.message);
  } else {
    console.log('✅ get_area_system_matrix result:', matrix ? 'Data received' : 'No data');
  }
  
  // Test drawing rollups
  console.log('\nTesting get_drawing_rollups...');
  const { data: drawings, error: drawingsError } = await supabase.rpc('get_drawing_rollups', {
    p_project_id: projectId
  });
  
  if (drawingsError) {
    console.error('❌ get_drawing_rollups error:', drawingsError.message);
  } else {
    console.log('✅ get_drawing_rollups result:', drawings ? 'Data received' : 'No data');
  }
  
  // Test test package readiness
  console.log('\nTesting get_test_package_readiness...');
  const { data: packages, error: packagesError } = await supabase.rpc('get_test_package_readiness', {
    p_project_id: projectId
  });
  
  if (packagesError) {
    console.error('❌ get_test_package_readiness error:', packagesError.message);
  } else {
    console.log('✅ get_test_package_readiness result:', packages ? 'Data received' : 'No data');
  }
  
  // Test recent activity
  console.log('\nTesting get_recent_activity...');
  const { data: activity, error: activityError } = await supabase.rpc('get_recent_activity', {
    p_project_id: projectId
  });
  
  if (activityError) {
    console.error('❌ get_recent_activity error:', activityError.message);
  } else {
    console.log('✅ get_recent_activity result:', activity ? 'Data received' : 'No data');
  }
  
  process.exit(0);
}

checkRPCFunctions();