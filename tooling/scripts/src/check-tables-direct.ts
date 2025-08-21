import { Client } from 'pg';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });

async function checkTables() {
  console.log('🔍 Checking all tables in database...\n');
  
  const connectionConfig: any = {
    connectionString: process.env.DATABASE_URL,
  };

  if (process.env.DATABASE_URL?.includes('supabase')) {
    connectionConfig.ssl = {
      rejectUnauthorized: false,
      ca: undefined
    };
  }

  const client = new Client(connectionConfig);
  
  try {
    await client.connect();
    
    // Get ALL tables in public schema
    const allTablesQuery = `
      SELECT 
        table_name,
        table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    const result = await client.query(allTablesQuery);
    
    console.log(`Found ${result.rows.length} tables in public schema:\n`);
    
    // Group tables by pattern
    const piperakTables: string[] = [];
    const authTables: string[] = [];
    const otherTables: string[] = [];
    
    result.rows.forEach(row => {
      const tableName = row.table_name;
      
      // Check for PipeTrak tables (case insensitive)
      if (tableName.toLowerCase() === 'component' || 
          tableName.toLowerCase() === 'componentmilestone' ||
          tableName.toLowerCase() === 'drawing' ||
          tableName.toLowerCase() === 'milestonetemplate' ||
          tableName.toLowerCase() === 'importjob' ||
          tableName.toLowerCase() === 'auditlog') {
        piperakTables.push(tableName);
      } else if (tableName.includes('auth') || tableName === 'user' || tableName === 'session') {
        authTables.push(tableName);
      } else {
        otherTables.push(tableName);
      }
    });
    
    if (piperakTables.length > 0) {
      console.log('📦 PipeTrak Tables:');
      piperakTables.forEach(t => console.log(`   ✓ ${t}`));
      console.log('');
    }
    
    if (authTables.length > 0) {
      console.log('🔐 Auth Tables:');
      authTables.forEach(t => console.log(`   • ${t}`));
      console.log('');
    }
    
    if (otherTables.length > 0) {
      console.log('📋 Other Tables:');
      otherTables.forEach(t => console.log(`   • ${t}`));
      console.log('');
    }
    
    // Check specific for Component variations
    console.log('🔎 Searching for Component table variations:');
    const componentSearch = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND (
        LOWER(table_name) LIKE '%component%'
        OR table_name = 'Component'
        OR table_name = 'component'
        OR table_name = '"Component"'
      );
    `;
    
    const componentResult = await client.query(componentSearch);
    if (componentResult.rows.length > 0) {
      componentResult.rows.forEach(row => {
        console.log(`   Found: "${row.table_name}"`);
      });
    } else {
      console.log('   No Component tables found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run check
checkTables()
  .then(() => {
    console.log('\n✅ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Check failed:', error.message);
    process.exit(1);
  });