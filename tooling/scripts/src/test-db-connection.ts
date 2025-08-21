#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: resolve(process.cwd(), '../../.env.local') });

// Extract credentials from DATABASE_URL
const DATABASE_URL = process.env.DATABASE_URL || '';
const password = DATABASE_URL.match(/:([^@]+)@/)?.[1] || '';
const projectRef = DATABASE_URL.match(/postgres\.([^:]+):/)?.[1] || '';

console.log('Testing Supabase connection with database password as service role key...\n');
console.log('Project Reference:', projectRef);
console.log('Supabase URL:', `https://${projectRef}.supabase.co`);
console.log('Password extracted:', password ? 'Yes' : 'No');

if (!projectRef || !password) {
  console.error('❌ Could not extract credentials from DATABASE_URL');
  process.exit(1);
}

// Try using the database password as a service role key
const supabaseUrl = `https://${projectRef}.supabase.co`;

// Create a JWT-like token from the password (this is a workaround)
async function testConnection() {
  try {
    // First test with anon key from env
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (anonKey) {
      console.log('\nTesting with NEXT_PUBLIC_SUPABASE_ANON_KEY...');
      const client1 = createClient(supabaseUrl, anonKey);
      const { data: data1, error: error1 } = await client1.from('Project').select('id').limit(1);
      if (error1) {
        console.log('❌ Anon key failed:', error1.message);
      } else {
        console.log('✅ Anon key works! Projects found:', data1?.length || 0);
      }
    }

    // Test if we have a service role key
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceKey) {
      console.log('\nTesting with SUPABASE_SERVICE_ROLE_KEY...');
      const client2 = createClient(supabaseUrl, serviceKey);
      const { data: data2, error: error2 } = await client2.from('Project').select('id').limit(1);
      if (error2) {
        console.log('❌ Service role key failed:', error2.message);
      } else {
        console.log('✅ Service role key works! Projects found:', data2?.length || 0);
      }
    } else {
      console.log('\n⚠️  No SUPABASE_SERVICE_ROLE_KEY found in environment');
      console.log('\nTo get the service role key:');
      console.log('1. Go to: https://supabase.com/dashboard/project/ogmahtkaqziaoxldxnts/settings/api');
      console.log('2. Copy the "service_role" key (keep it secret!)');
      console.log('3. Add to .env.local: SUPABASE_SERVICE_ROLE_KEY="your-key-here"');
    }

    // Try direct database connection
    console.log('\n\nTesting direct database connection...');
    const { default: pg } = await import('pg');
    const client = new pg.Client({
      connectionString: process.env.DIRECT_URL,
    });
    
    await client.connect();
    const result = await client.query('SELECT COUNT(*) FROM "Project"');
    console.log('✅ Direct database connection works! Projects in database:', result.rows[0].count);
    
    // Check if RPC functions exist
    const rpcCheck = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name LIKE 'get_dashboard%'
    `);
    console.log('\nDashboard RPC functions found:', rpcCheck.rows.length);
    rpcCheck.rows.forEach(row => {
      console.log('  -', row.routine_name);
    });
    
    await client.end();

  } catch (error) {
    console.error('Error:', error);
  }
}

testConnection().then(() => {
  console.log('\n\n📝 NEXT STEPS:');
  console.log('1. Get the correct API keys from Supabase dashboard');
  console.log('2. Update .env.local with:');
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY="correct-anon-key"');
  console.log('   SUPABASE_SERVICE_ROLE_KEY="correct-service-key"');
  console.log('3. Restart the dev server: pnpm dev');
  process.exit(0);
});