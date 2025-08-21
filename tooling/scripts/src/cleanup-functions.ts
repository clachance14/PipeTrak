import { Client } from 'pg';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });

async function cleanupFunctions() {
  console.log('🧹 Cleaning up PipeTrak functions...\n');
  
  if (!process.env.DIRECT_URL) {
    throw new Error('DIRECT_URL environment variable is not set');
  }

  const connectionConfig: any = {
    connectionString: process.env.DIRECT_URL,
  };

  if (process.env.DIRECT_URL?.includes('supabase')) {
    connectionConfig.ssl = {
      rejectUnauthorized: false,
      ca: undefined
    };
  }

  const client = new Client(connectionConfig);
  
  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    
    // Find all versions of our functions
    const functionsQuery = `
      SELECT 
        p.proname as function_name,
        pg_catalog.pg_get_function_identity_arguments(p.oid) as arguments,
        n.nspname as schema_name
      FROM pg_catalog.pg_proc p
      JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
      WHERE p.proname IN (
        'calculate_component_completion',
        'update_component_milestone',
        'bulk_update_milestones',
        'get_project_progress',
        'initialize_component_milestones',
        'process_import_job',
        'trigger_initialize_milestones'
      )
      AND n.nspname = 'public'
      ORDER BY p.proname;
    `;
    
    const result = await client.query(functionsQuery);
    
    if (result.rows.length === 0) {
      console.log('✅ No PipeTrak functions found to clean up.');
      return;
    }
    
    console.log(`Found ${result.rows.length} function(s) to clean up:\n`);
    
    for (const func of result.rows) {
      console.log(`  - ${func.function_name}(${func.arguments})`);
      
      try {
        const dropQuery = `DROP FUNCTION IF EXISTS ${func.function_name}(${func.arguments}) CASCADE`;
        await client.query(dropQuery);
        console.log(`    ✅ Dropped`);
      } catch (error: any) {
        console.log(`    ❌ Failed to drop: ${error.message}`);
      }
    }
    
    console.log('\n✅ Cleanup complete!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run cleanup
cleanupFunctions()
  .then(() => {
    console.log('\n🎉 Functions cleaned up successfully!');
    console.log('You can now run the deployment script to recreate them.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Cleanup failed:', error.message);
    process.exit(1);
  });