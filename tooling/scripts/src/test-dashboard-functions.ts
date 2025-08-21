import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDashboardFunctions() {
  console.log('Testing dashboard RPC functions...');
  
  const projectId = 'test-project-id';
  
  try {
    // Test get_dashboard_metrics
    console.log('\n1. Testing get_dashboard_metrics...');
    const { data: metricsData, error: metricsError } = await supabase.rpc('get_dashboard_metrics', {
      p_project_id: projectId
    });
    
    if (metricsError) {
      console.log('❌ get_dashboard_metrics error:', metricsError.message);
    } else {
      console.log('✅ get_dashboard_metrics exists and returns:', typeof metricsData);
    }

    // Test get_area_system_matrix
    console.log('\n2. Testing get_area_system_matrix...');
    const { data: matrixData, error: matrixError } = await supabase.rpc('get_area_system_matrix', {
      p_project_id: projectId
    });
    
    if (matrixError) {
      console.log('❌ get_area_system_matrix error:', matrixError.message);
    } else {
      console.log('✅ get_area_system_matrix exists and returns:', typeof matrixData);
    }

    // Test get_drawing_rollups
    console.log('\n3. Testing get_drawing_rollups...');
    const { data: drawingsData, error: drawingsError } = await supabase.rpc('get_drawing_rollups', {
      p_project_id: projectId
    });
    
    if (drawingsError) {
      console.log('❌ get_drawing_rollups error:', drawingsError.message);
    } else {
      console.log('✅ get_drawing_rollups exists and returns:', typeof drawingsData);
    }

    // Test get_test_package_readiness
    console.log('\n4. Testing get_test_package_readiness...');
    const { data: packagesData, error: packagesError } = await supabase.rpc('get_test_package_readiness', {
      p_project_id: projectId
    });
    
    if (packagesError) {
      console.log('❌ get_test_package_readiness error:', packagesError.message);
    } else {
      console.log('✅ get_test_package_readiness exists and returns:', typeof packagesData);
    }

    // Test get_recent_activity
    console.log('\n5. Testing get_recent_activity...');
    const { data: activityData, error: activityError } = await supabase.rpc('get_recent_activity', {
      p_project_id: projectId,
      p_limit: 10
    });
    
    if (activityError) {
      console.log('❌ get_recent_activity error:', activityError.message);
    } else {
      console.log('✅ get_recent_activity exists and returns:', typeof activityData);
    }

  } catch (error) {
    console.error('Unexpected error testing functions:', error);
  }
}

testDashboardFunctions().then(() => {
  console.log('\nFunction testing complete.');
  process.exit(0);
}).catch(error => {
  console.error('Failed to test functions:', error);
  process.exit(1);
});