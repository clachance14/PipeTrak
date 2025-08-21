# PipeTrak Database Scripts

## 🚀 Quick Start

All database scripts must be executed from this directory with the correct environment setup:

```bash
cd tooling/scripts
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/script-name.ts
```

## 📋 Available Scripts

### 🌱 Data Seeding
```bash
# Seed SDO Tank test data (87 components)
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm seed:sdo

# Seed demo/development data
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm seed:demo

# Clean and reseed all data
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm cleanup-seed
```

### 🗄️ Table Management
```bash
# Create PipeTrak tables manually
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm migrate:tables

# Verify all tables exist with row counts
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm verify:tables

# Clean all component data (preserves schema)
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm clean:components
```

### 🔄 Data Migration
```bash
# Apply component type migration
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm migrate:component-type

# Fix component type migration issues
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/fix-component-type-migration.ts

# Apply SQL migrations manually
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm apply-sql
```

### 📊 Import/Export Testing
```bash
# Test Excel import functionality
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm test:excel-import

# Test full import workflow
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm test:full-import

# Test database component creation
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm test:db-component

# Universal import (handles multiple formats)
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm import
```

### 🔧 Database Operations
```bash
# Test database connections
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/test-connections.ts

# Deploy dashboard functions
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/apply-dashboard-functions.ts

# Deploy progress summary functions
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/deploy-progress-summary.ts

# Deploy realtime system
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/deploy-realtime-system.ts
```

### 👥 User Management
```bash
# Create a new user
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm create:user

# Add user to organization
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/add-user-to-org.ts

# Ensure organization membership
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/ensure-org-membership.ts
```

### 🧪 Testing & Verification
```bash
# Test database connections
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/test-connections.ts

# Test PipeTrak API endpoints
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/test-pipetrak-api.ts

# Test dashboard functions with real data
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/test-dashboard-functions-real.ts

# Verify enum exists
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm check:enum
```

## 🚨 Critical Requirements

### 1. Always run from `tooling/scripts` directory
```bash
cd tooling/scripts  # REQUIRED
```

### 2. Always use NODE_TLS_REJECT_UNAUTHORIZED=0
```bash
NODE_TLS_REJECT_UNAUTHORIZED=0  # REQUIRED for Supabase SSL
```

### 3. Scripts must be in `src/` subdirectory
- ✅ `tooling/scripts/src/your-script.ts`
- ❌ `packages/database/scripts/your-script.ts`

## 📁 Script Categories

### Core Infrastructure
- `test-connections.ts` - Test database connectivity
- `migrate-pipetrak-tables.ts` - Create all PipeTrak tables
- `verify-tables.ts` - Verify database schema
- `apply-supabase-sql.ts` - Apply SQL migrations

### Data Management
- `seed-sdo-tank.ts` - Seed SDO tank test data
- `seed-pipetrak.ts` - Seed demo data
- `clean-components.ts` - Clean component data
- `cleanup-and-seed.ts` - Full data reset

### Import/Export
- `universal-import.ts` - Multi-format data import
- `import-excel.ts` - Excel file import
- `test-excel-import.ts` - Test Excel import
- `test-full-import.ts` - Test complete import flow

### Function Deployment
- `apply-dashboard-functions.ts` - Deploy dashboard RPC functions
- `deploy-progress-summary.ts` - Deploy progress report functions
- `deploy-realtime-system.ts` - Deploy real-time features

### Testing
- `test-pipetrak-api.ts` - Test API endpoints
- `test-dashboard-functions-real.ts` - Test functions with real data
- `test-db-component-creation.ts` - Test component creation

## 🔧 Creating New Scripts

### 1. Create in correct location
```bash
touch tooling/scripts/src/your-new-script.ts
```

### 2. Use the script template
```typescript
#!/usr/bin/env tsx
import { db } from "@repo/database";

async function yourScriptName() {
  console.log('🚀 Starting your script...');
  
  try {
    // Your database operations here
    console.log('✅ Script completed successfully!');
  } catch (error: any) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

yourScriptName();
```

### 3. Add to package.json (optional)
```json
{
  "scripts": {
    "your-script": "dotenv -c -e ../../.env -- tsx ./src/your-new-script.ts"
  }
}
```

### 4. Execute
```bash
cd tooling/scripts
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/your-new-script.ts
```

## ❌ Common Mistakes to Avoid

### Wrong directory
```bash
# ❌ Don't do this
pnpm tsx packages/database/scripts/script.ts

# ✅ Do this
cd tooling/scripts && pnpm tsx src/script.ts
```

### Missing SSL environment variable
```bash
# ❌ Will get SSL errors
pnpm tsx src/script.ts

# ✅ Correct
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/script.ts
```

### Wrong import paths
```typescript
// ❌ Don't use relative paths
import { db } from "../../../packages/database";

// ✅ Use workspace imports
import { db } from "@repo/database";
```

### Using tsx in wrong location
```bash
# ❌ tsx not available here
npx tsx packages/database/scripts/script.ts

# ✅ tsx available here
cd tooling/scripts && pnpm tsx src/script.ts
```

## 🆘 Troubleshooting

### "tsx: command not found"
- Ensure you're in `tooling/scripts` directory
- Run `pnpm install` to install dependencies

### "Cannot find module" errors
- Move script to `tooling/scripts/src/`
- Use `@repo/database` imports
- Ensure you're running from `tooling/scripts`

### SSL certificate errors
- Always use `NODE_TLS_REJECT_UNAUTHORIZED=0`
- Check `.env.local` exists with connection strings

### Database connection failed
- Run `test-connections.ts` first to diagnose
- Verify environment variables are correct
- Check Supabase is accessible

## 📚 Documentation Links

- [Database Script Execution Guide](../../project-documentation/database-script-execution-guide.md) - Comprehensive guide
- [Database Operations Guide](../../project-documentation/database-operations-guide.md) - SQL operations
- [Database Quick Reference](../../project-documentation/database-quick-reference.md) - Copy-paste commands

## 🎯 Quick Test

To verify your setup works:

```bash
cd tooling/scripts
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/test-connections.ts
```

If this runs successfully, you're ready to execute any database script!