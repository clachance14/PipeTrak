import { Client } from 'pg';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables BEFORE importing Prisma
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Now import Prisma after env vars are loaded
import { db as prisma } from "@repo/database";

async function testConnections() {
  console.log('🔍 Testing database connections...\n');
  
  // Test DIRECT_URL connection
  console.log('1️⃣ Testing DIRECT_URL connection (migrations):');
  console.log(`   URL: ${process.env.DIRECT_URL?.replace(/:[^@]+@/, ':****@')}`);
  
  const directConfig: any = {
    connectionString: process.env.DIRECT_URL,
  };
  
  if (process.env.DIRECT_URL?.includes('supabase')) {
    directConfig.ssl = {
      rejectUnauthorized: false,
      ca: undefined
    };
  }
  
  const directClient = new Client(directConfig);
  
  try {
    await directClient.connect();
    const result = await directClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'Component'
    `);
    
    if (result.rows.length > 0) {
      console.log('   ✅ Component table found via DIRECT_URL');
    } else {
      console.log('   ❌ Component table NOT found via DIRECT_URL');
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  } finally {
    await directClient.end();
  }
  
  // Test DATABASE_URL connection (pooled)
  console.log('\n2️⃣ Testing DATABASE_URL connection (pooled/runtime):');
  console.log(`   URL: ${process.env.DATABASE_URL?.replace(/:[^@]+@/, ':****@')}`);
  
  const pooledConfig: any = {
    connectionString: process.env.DATABASE_URL,
  };
  
  if (process.env.DATABASE_URL?.includes('supabase')) {
    pooledConfig.ssl = {
      rejectUnauthorized: false,
      ca: undefined
    };
  }
  
  const pooledClient = new Client(pooledConfig);
  
  try {
    await pooledClient.connect();
    const result = await pooledClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'Component'
    `);
    
    if (result.rows.length > 0) {
      console.log('   ✅ Component table found via DATABASE_URL');
    } else {
      console.log('   ❌ Component table NOT found via DATABASE_URL');
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  } finally {
    await pooledClient.end();
  }
  
  // Test Prisma connection
  console.log('\n3️⃣ Testing Prisma Client:');
  try {
    // Try to count components
    const count = await prisma.component.count();
    console.log(`   ✅ Prisma can access Component table (${count} rows)`);
  } catch (error: any) {
    console.log(`   ❌ Prisma error: ${error.message}`);
    if (error.code === 'P2021') {
      console.log('   ℹ️  Table does not exist according to Prisma');
    }
  }
  
  // Check which URL Prisma is using
  console.log('\n4️⃣ Environment Check:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`   DATABASE_URL exists: ${!!process.env.DATABASE_URL}`);
  console.log(`   DIRECT_URL exists: ${!!process.env.DIRECT_URL}`);
  
  // List all tables visible to each connection
  console.log('\n5️⃣ All PipeTrak tables:');
  
  const tableListQuery = `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('Drawing', 'Component', 'ComponentMilestone', 'MilestoneTemplate', 'ImportJob', 'AuditLog')
    ORDER BY table_name;
  `;
  
  const testClient = new Client(pooledConfig);
  try {
    await testClient.connect();
    const result = await testClient.query(tableListQuery);
    
    if (result.rows.length > 0) {
      result.rows.forEach(row => {
        console.log(`   ✓ ${row.table_name}`);
      });
    } else {
      console.log('   ❌ No PipeTrak tables found');
    }
  } finally {
    await testClient.end();
  }
}

// Run tests
testConnections()
  .then(() => {
    console.log('\n✅ Connection tests complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });