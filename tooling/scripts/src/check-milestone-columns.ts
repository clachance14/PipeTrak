import { Client } from 'pg';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env.local') });

const connectionString = process.env.DIRECT_URL;

async function checkMilestoneColumns() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('🔍 Checking ComponentMilestone columns...\n');

    const query = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'ComponentMilestone'
      ORDER BY ordinal_position;
    `;

    const result = await client.query(query);
    
    console.log('ComponentMilestone columns:');
    console.log('─'.repeat(50));
    
    let hasEffectiveDate = false;
    result.rows.forEach(row => {
      const nullable = row.is_nullable === 'YES' ? '(nullable)' : '(required)';
      console.log(`  • ${row.column_name}: ${row.data_type} ${nullable}`);
      if (row.column_name === 'effectiveDate') {
        hasEffectiveDate = true;
      }
    });
    
    console.log('─'.repeat(50));
    
    if (hasEffectiveDate) {
      console.log('\n✅ effectiveDate column exists!');
    } else {
      console.log('\n⚠️  effectiveDate column not found');
    }
    
    // Check ProgressSnapshot table
    const snapshotQuery = `
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_name = 'ProgressSnapshot' OR table_name = 'ProgressSnapshots';
    `;
    
    const snapshotResult = await client.query(snapshotQuery);
    if (snapshotResult.rows[0].count > 0) {
      console.log('✅ ProgressSnapshot table exists!');
    } else {
      console.log('⚠️  ProgressSnapshot table not found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkMilestoneColumns();