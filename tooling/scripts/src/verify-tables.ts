import { Client } from 'pg';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });

interface TableInfo {
  table_name: string;
  column_count: number;
  has_indexes: boolean;
}

async function verifyTables() {
  console.log('🔍 Verifying PipeTrak tables...\n');
  
  if (!process.env.DIRECT_URL) {
    throw new Error('DIRECT_URL environment variable is not set');
  }

  // Parse connection string and add SSL config
  const connectionConfig: any = {
    connectionString: process.env.DIRECT_URL,
  };

  // For Supabase, we need to handle SSL properly
  if (process.env.DIRECT_URL?.includes('supabase')) {
    connectionConfig.ssl = {
      rejectUnauthorized: false,
      ca: undefined
    };
  }

  const client = new Client(connectionConfig);
  
  try {
    await client.connect();
    
    // Check which PipeTrak tables exist
    const tableQuery = `
      SELECT 
        t.table_name,
        COUNT(c.column_name) as column_count
      FROM information_schema.tables t
      LEFT JOIN information_schema.columns c 
        ON t.table_name = c.table_name 
        AND t.table_schema = c.table_schema
      WHERE t.table_schema = 'public' 
      AND t.table_name IN ('Drawing', 'Component', 'ComponentMilestone', 'MilestoneTemplate', 'ImportJob', 'AuditLog')
      GROUP BY t.table_name
      ORDER BY t.table_name;
    `;
    
    const tableResult = await client.query(tableQuery);
    
    if (tableResult.rows.length === 0) {
      console.log('❌ No PipeTrak tables found in the database!');
      console.log('   Run the migration script first: pnpm tsx src/migrate-pipetrak-tables.ts');
      return;
    }
    
    console.log('📊 PipeTrak Tables Status:');
    console.log('─'.repeat(60));
    
    const expectedTables = [
      'Drawing', 'Component', 'ComponentMilestone', 
      'MilestoneTemplate', 'ImportJob', 'AuditLog'
    ];
    
    // Check each expected table
    for (const tableName of expectedTables) {
      const table = tableResult.rows.find(r => r.table_name === tableName);
      
      if (table) {
        // Check for indexes
        const indexQuery = `
          SELECT COUNT(*) as index_count 
          FROM pg_indexes 
          WHERE tablename = $1 AND schemaname = 'public';
        `;
        const indexResult = await client.query(indexQuery, [tableName]);
        const indexCount = parseInt(indexResult.rows[0].index_count);
        
        console.log(`✅ ${tableName.padEnd(20)} | ${table.column_count} columns | ${indexCount} indexes`);
      } else {
        console.log(`❌ ${tableName.padEnd(20)} | MISSING`);
      }
    }
    
    console.log('─'.repeat(60));
    
    // Check foreign key relationships
    const fkQuery = `
      SELECT 
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name IN ('Drawing', 'Component', 'ComponentMilestone', 'MilestoneTemplate', 'ImportJob', 'AuditLog')
      ORDER BY tc.table_name, kcu.column_name;
    `;
    
    const fkResult = await client.query(fkQuery);
    
    if (fkResult.rows.length > 0) {
      console.log('\n🔗 Foreign Key Relationships:');
      console.log('─'.repeat(60));
      
      let currentTable = '';
      fkResult.rows.forEach(fk => {
        if (fk.table_name !== currentTable) {
          currentTable = fk.table_name;
          console.log(`\n${currentTable}:`);
        }
        console.log(`  → ${fk.column_name} references ${fk.foreign_table_name}(${fk.foreign_column_name})`);
      });
    }
    
    // Check row counts
    console.log('\n📈 Table Row Counts:');
    console.log('─'.repeat(60));
    
    for (const table of tableResult.rows) {
      const countQuery = `SELECT COUNT(*) as row_count FROM "${table.table_name}";`;
      const countResult = await client.query(countQuery);
      const rowCount = parseInt(countResult.rows[0].row_count);
      console.log(`${table.table_name.padEnd(20)} | ${rowCount} rows`);
    }
    
    console.log('─'.repeat(60));
    console.log('\n✅ Verification complete!');
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run verification
verifyTables()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Verification failed:', error.message);
    process.exit(1);
  });