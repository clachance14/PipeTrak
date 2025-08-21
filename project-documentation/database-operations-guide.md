# PipeTrak Database Operations Guide

## Overview

This comprehensive guide provides tested, reliable patterns for all database operations in the PipeTrak project. It consolidates lessons learned from numerous execution attempts and provides copy-paste ready solutions that work consistently.

## Connection Configuration

### Two Connection Types

PipeTrak uses two different database connections for different purposes:

#### 1. Pooled Connection (DATABASE_URL) - Port 6543
```bash
DATABASE_URL="postgres://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
```
- **Use for**: Application runtime queries, API operations
- **Features**: Connection pooling via PgBouncer
- **Limitations**: Some SQL features not supported (stored procedures, certain functions)

#### 2. Direct Connection (DIRECT_URL) - Port 5432
```bash
DIRECT_URL="postgres://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"
```
- **Use for**: Migrations, schema changes, function deployment, admin operations
- **Features**: Full PostgreSQL access, no connection pooling
- **Best for**: SQL scripts, manual database operations

### SSL Certificate Handling

Supabase uses self-signed certificates that cause connection issues in local development.

#### Solution 1: Environment Variable (Recommended)
```bash
export NODE_TLS_REJECT_UNAUTHORIZED=0
```

#### Solution 2: In Code
```typescript
const client = new Client({
  connectionString: process.env.DIRECT_URL,
  ssl: {
    rejectUnauthorized: false,
    ca: undefined
  }
});
```

## SQL Script Execution Methods

### Method 1: TypeScript with pg Client (Recommended)

This is the most reliable method for SQL script execution:

```typescript
#!/usr/bin/env tsx
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env.local') });

async function executeSQLScript(sqlFilePath: string) {
  // Always use DIRECT_URL for schema operations
  const connectionString = process.env.DIRECT_URL;
  
  if (!connectionString) {
    console.error('DIRECT_URL not found in environment variables');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully');

    // Read SQL file
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
    
    // Execute SQL
    await client.query(sqlContent);
    console.log('✅ SQL script executed successfully');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}
```

### Method 2: psql Command (For Simple Scripts)

```bash
# Set SSL environment variable first
export NODE_TLS_REJECT_UNAUTHORIZED=0

# Execute SQL file using DIRECT_URL
psql "$DIRECT_URL" -f path/to/script.sql

# Execute single command
psql "$DIRECT_URL" -c "SELECT COUNT(*) FROM \"Component\";"
```

### Method 3: Supabase Dashboard SQL Editor (Production)

For complex functions or production deployments:
1. Open [Supabase SQL Editor](https://supabase.com/dashboard/project/ogmahtkaqziaoxldxnts/sql/new)
2. Copy SQL content from your file
3. Execute in the web interface
4. More reliable for complex PostgreSQL functions

### Method 4: Prisma Migrations (Schema Changes)

```bash
# For schema model changes
cd packages/database

# Create and apply migration
pnpm prisma migrate dev --name descriptive_name

# Push without migration (development)
pnpm prisma db push

# Force push (with data loss warning)
pnpm prisma db push --accept-data-loss
```

## Common Errors and Solutions

### Error 1: "self-signed certificate in certificate chain"

**Cause**: Supabase SSL certificate not trusted

**Solution**:
```bash
export NODE_TLS_REJECT_UNAUTHORIZED=0
```

### Error 2: "Connection timeout"

**Cause**: Using pooled connection for migrations

**Solution**: Always use DIRECT_URL for schema operations:
```typescript
const connectionString = process.env.DIRECT_URL; // Not DATABASE_URL
```

### Error 3: "Function cannot be created"

**Cause**: PgBouncer doesn't support all PostgreSQL features

**Solutions**:
1. Use DIRECT_URL connection
2. Use Supabase Dashboard SQL Editor
3. Split complex functions into smaller parts

### Error 4: "Table does not exist" (case sensitivity)

**Cause**: PostgreSQL table names are case-sensitive

**Solution**: Always quote PascalCase table names:
```sql
SELECT * FROM "Component";  -- ✅ Correct
SELECT * FROM component;    -- ❌ Wrong
```

### Error 5: "Statement parsing errors" (Functions with $$)

**Cause**: SQL functions with $$ delimiters can't be split on semicolons

**Solution**: Use special parsing for function statements:
```typescript
// Don't split on semicolons for functions
const statements = sqlContent.split(/\$\$;/).filter(stmt => stmt.trim());
```

## SQL Script Templates

### Template 1: Simple Migration Script

```typescript
#!/usr/bin/env tsx
import { executeSQLFile } from './lib/sql-executor';

async function applyMigration() {
  console.log('🚀 Applying migration...');
  
  try {
    await executeSQLFile('../../../packages/database/supabase/migrations/your-migration.sql');
    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
```

### Template 2: Function Deployment Script

```typescript
#!/usr/bin/env tsx
import { Client } from 'pg';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../../.env.local' });

async function deployFunctions() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Read function definitions
    const functionsSQL = fs.readFileSync('functions.sql', 'utf-8');
    
    // Split by function boundaries (handles $$ delimiters)
    const functions = functionsSQL
      .split(/\$\$;/)
      .map(fn => fn.includes('$$') ? fn + '$$;' : fn)
      .filter(fn => fn.trim());

    for (const func of functions) {
      try {
        await client.query(func);
        console.log('✅ Function deployed:', func.substring(0, 50) + '...');
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          console.log('⚠️  Function exists:', func.substring(0, 50) + '...');
        } else {
          throw error;
        }
      }
    }
    
  } finally {
    await client.end();
  }
}

deployFunctions();
```

### Template 3: Verification Script

```typescript
#!/usr/bin/env tsx
import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../../.env.local' });

async function verifyDeployment() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Check tables exist
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('Component', 'Drawing', 'ComponentMilestone')
    `);
    
    console.log('📊 Tables found:', tables.rows.length);
    
    // Check functions exist
    const functions = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public'
      AND routine_name LIKE 'get_%'
    `);
    
    console.log('⚙️  Functions found:', functions.rows.length);
    
  } finally {
    await client.end();
  }
}

verifyDeployment();
```

## Best Practices

### 1. Always Use DIRECT_URL for Schema Operations

```typescript
// ✅ Correct for migrations/schema
const connectionString = process.env.DIRECT_URL;

// ❌ Wrong for migrations (pooled connection)
const connectionString = process.env.DATABASE_URL;
```

### 2. Set SSL Environment Variable

```bash
# Add to all database script commands
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/your-script.ts
```

### 3. Handle Connection Timeouts

```typescript
// Add timeout to connection
const connectPromise = client.connect();
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Connection timeout')), 10000)
);

await Promise.race([connectPromise, timeoutPromise]);
```

### 4. Use Proper Error Handling

```typescript
try {
  await client.query(statement);
  console.log('✅ Success:', statement.substring(0, 50) + '...');
} catch (error: any) {
  if (error.message.includes('already exists')) {
    console.log('⚠️  Already exists:', statement.substring(0, 50) + '...');
  } else {
    console.error('❌ Failed:', error.message);
    throw error;
  }
}
```

### 5. Quote All Table Names

```sql
-- ✅ Always quote PascalCase tables
SELECT * FROM "Component" WHERE "projectId" = $1;

-- ❌ Unquoted names will be lowercased
SELECT * FROM Component WHERE projectId = $1;
```

## Useful Commands Reference

### Database Connection Testing

```bash
# Test both connections
cd tooling/scripts
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/test-connections.ts
```

### Table Management

```bash
# Verify all tables exist
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/verify-tables.ts

# Drop all PipeTrak tables
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/drop-pipetrak-tables.ts

# Create tables manually
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/migrate-pipetrak-tables.ts
```

### Function Deployment

```bash
# Deploy dashboard functions
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/apply-dashboard-functions.ts

# Deploy progress summary functions
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/deploy-progress-summary.ts

# Test functions
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/test-dashboard-functions-real.ts
```

### Data Operations

```bash
# Clean all component data
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/clean-components.ts

# Seed test data
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/seed-sdo-tank.ts

# Test full import flow
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/test-full-import.ts
```

### Prisma Operations

```bash
cd packages/database

# Generate client
pnpm prisma generate

# Push schema
pnpm prisma db push

# Create migration
pnpm prisma migrate dev --name migration_name

# Open database browser
pnpm prisma studio
```

## Package.json Script Examples

Add these to your package.json for consistent execution:

```json
{
  "scripts": {
    "db:test": "NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/test-connections.ts",
    "db:verify": "NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/verify-tables.ts",
    "db:apply-sql": "NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/apply-sql.ts",
    "db:deploy-functions": "NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/deploy-functions.ts"
  }
}
```

## Troubleshooting Decision Tree

1. **Connection Issues**
   - ✅ Check NODE_TLS_REJECT_UNAUTHORIZED=0 is set
   - ✅ Verify DIRECT_URL is used (not DATABASE_URL)
   - ✅ Test with test-connections.ts script

2. **SQL Execution Failures**
   - ✅ Use DIRECT_URL for schema operations
   - ✅ Check SQL syntax with quoted table names
   - ✅ Try Supabase Dashboard SQL Editor for complex functions

3. **Function Deployment Issues**
   - ✅ Parse functions by $$ delimiters, not semicolons
   - ✅ Use DIRECT_URL connection
   - ✅ Fall back to Supabase Dashboard SQL Editor

4. **Table Not Found Errors**
   - ✅ Verify table names are PascalCase with quotes
   - ✅ Run verify-tables.ts to check what exists
   - ✅ Regenerate Prisma client if needed

5. **Migration Issues**
   - ✅ Use pnpm prisma db push for development
   - ✅ Clear Prisma cache and regenerate
   - ✅ Use direct SQL scripts as fallback

## Summary

This guide provides battle-tested patterns for PipeTrak database operations. Key takeaways:

1. **Always use NODE_TLS_REJECT_UNAUTHORIZED=0** for local development
2. **Use DIRECT_URL for all schema operations** (migrations, functions, admin tasks)
3. **Quote all PascalCase table names** in SQL
4. **Handle PostgreSQL functions specially** (don't split on semicolons)
5. **Use Supabase Dashboard SQL Editor** as fallback for complex operations

Following these patterns will eliminate the connection errors and execution failures that have been consuming tokens and development time.