#!/usr/bin/env tsx
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env.local') });

async function applySQL() {
  // Use DIRECT_URL for direct connection (not pooled)
  const connectionString = process.env.DIRECT_URL;
  
  if (!connectionString) {
    console.error('DIRECT_URL not found in environment variables');
    process.exit(1);
  }

  console.log('Using connection string:', connectionString.substring(0, 50) + '...');

  // Parse connection string to extract components
  const url = new URL(connectionString);
  
  const client = new Client({
    host: url.hostname,
    port: parseInt(url.port),
    database: url.pathname.substring(1),
    user: url.username,
    password: url.password,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to database...');
    
    // Add timeout for connection
    const connectPromise = client.connect();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), 5000)
    );
    
    await Promise.race([connectPromise, timeoutPromise]);
    console.log('Connected successfully');

    // Read SQL files
    const rlsPath = path.join(__dirname, '../../../packages/database/supabase/policies/pipetrak-rls-fixed.sql');
    const functionsPath = path.join(__dirname, '../../../packages/database/supabase/functions/pipetrak-functions.sql');

    console.log('\nApplying RLS policies...');
    const rlsSQL = fs.readFileSync(rlsPath, 'utf-8');
    
    // Parse SQL statements properly handling functions
    const rlsStatements: string[] = [];
    let currentStatement = '';
    let inFunction = false;
    
    const lines = rlsSQL.split('\n');
    for (const line of lines) {
      currentStatement += line + '\n';
      
      // Check if we're entering or exiting a function definition
      if (line.includes('AS $$')) {
        inFunction = true;
      } else if (line.includes('$$;')) {
        inFunction = false;
        rlsStatements.push(currentStatement.trim());
        currentStatement = '';
      } else if (!inFunction && line.trim().endsWith(';')) {
        rlsStatements.push(currentStatement.trim());
        currentStatement = '';
      }
    }
    
    if (currentStatement.trim()) {
      rlsStatements.push(currentStatement.trim());
    }

    for (const statement of rlsStatements) {
      try {
        await client.query(statement);
        console.log('✓ Applied:', statement.substring(0, 50).replace(/\n/g, ' ') + '...');
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          console.log('⚠ Already exists:', statement.substring(0, 50).replace(/\n/g, ' ') + '...');
        } else {
          console.error('✗ Failed:', statement.substring(0, 50).replace(/\n/g, ' ') + '...');
          console.error('  Error:', error.message);
        }
      }
    }

    console.log('\nApplying RPC functions...');
    const functionsSQL = fs.readFileSync(functionsPath, 'utf-8');
    
    // Split by $$ delimiter for functions
    const functionStatements = functionsSQL
      .split(/\$\$;/)
      .map(stmt => stmt.includes('$$') ? stmt + '$$;' : stmt + ';')
      .filter(stmt => stmt.trim().length > 0);

    for (const statement of functionStatements) {
      try {
        await client.query(statement);
        console.log('✓ Applied:', statement.substring(0, 50).replace(/\n/g, ' ') + '...');
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          console.log('⚠ Already exists:', statement.substring(0, 50).replace(/\n/g, ' ') + '...');
        } else {
          console.error('✗ Failed:', statement.substring(0, 50).replace(/\n/g, ' ') + '...');
          console.error('  Error:', error.message);
        }
      }
    }

    console.log('\n✅ SQL application complete!');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

// Run the script
applySQL();