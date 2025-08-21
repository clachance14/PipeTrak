# Database Script Execution Guide - Definitive Reference

## Overview

This guide provides the definitive patterns for executing database scripts in PipeTrak. Following these patterns will prevent the common execution errors that waste development time and tokens.

## 🚨 Critical Rules

### Rule #1: ALL database scripts MUST be in `tooling/scripts/src/`
- ✅ `tooling/scripts/src/your-script.ts`
- ❌ `packages/database/scripts/your-script.ts`
- ❌ `packages/database/src/your-script.ts`

### Rule #2: tsx is ONLY available in `tooling/scripts`
- ✅ `cd tooling/scripts && pnpm tsx src/script.ts`
- ❌ `pnpm tsx packages/database/scripts/script.ts`
- ❌ `npx tsx anywhere` (tsx not installed globally)

### Rule #3: ALWAYS use NODE_TLS_REJECT_UNAUTHORIZED=0 for Supabase
- ✅ `NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/script.ts`
- ❌ `pnpm tsx src/script.ts` (SSL errors)

## ✅ Correct Execution Patterns

### Pattern 1: From tooling/scripts directory (Recommended)
```bash
cd tooling/scripts
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/your-script.ts
```

### Pattern 2: Using pnpm filter from root
```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm --filter scripts tsx src/your-script.ts
```

### Pattern 3: Using predefined scripts
```bash
cd tooling/scripts
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm seed:sdo
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm migrate:tables
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm verify:tables
```

## ❌ Common Errors and Why They Fail

### Error: "tsx: command not found"
```bash
# ❌ This fails
pnpm tsx packages/database/scripts/script.ts
npx tsx packages/database/scripts/script.ts

# ✅ This works
cd tooling/scripts && pnpm tsx src/script.ts
```
**Reason**: tsx is only installed in `tooling/scripts`, not globally or in packages/database.

### Error: "Cannot find module 'ts-node/register'"
```bash
# ❌ This fails
node -r ts-node/register packages/database/scripts/script.ts

# ✅ This works
cd tooling/scripts && pnpm tsx src/script.ts
```
**Reason**: ts-node is not installed in this project. Use tsx instead.

### Error: "Cannot find module" when script exists
```bash
# ❌ This fails - wrong path resolution
node packages/database/scripts/script.js

# ✅ This works
cd tooling/scripts && pnpm tsx src/script.ts
```
**Reason**: Node resolves paths differently than expected. Scripts must be in the correct location.

### Error: "Invalid value for '-e': '.env.local' is not a valid boolean"
```bash
# ❌ This fails - wrong dotenv syntax
dotenv -e .env.local -- node script.js

# ✅ This works - correct dotenv syntax
dotenv -c -e .env.local -- node script.js
```
**Reason**: dotenv requires `-c` flag with `-e` flag.

### Error: "self-signed certificate in certificate chain"
```bash
# ❌ This fails - SSL issues with Supabase
pnpm tsx src/script.ts

# ✅ This works
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/script.ts
```
**Reason**: Supabase uses self-signed certificates in development.

## 📁 Project Structure for Scripts

```
PipeTrak/
├── tooling/scripts/              # ✅ Scripts go here
│   ├── package.json              # Has tsx dependency
│   ├── src/
│   │   ├── your-script.ts        # ✅ Your scripts here
│   │   ├── seed-sdo-tank.ts      # ✅ Example script
│   │   └── migrate-pipetrak-tables.ts
│   └── node_modules/
│       └── .bin/tsx              # ✅ tsx is here
└── packages/database/            # ❌ Don't put scripts here
    ├── package.json              # No tsx dependency
    ├── scripts/                  # ❌ Wrong location
    └── src/
```

## 🔧 Creating New Database Scripts

### Step 1: Create script in correct location
```bash
# Create in tooling/scripts/src/
touch tooling/scripts/src/your-new-script.ts
```

### Step 2: Use correct imports
```typescript
#!/usr/bin/env tsx
import { db } from "@repo/database";  // ✅ Correct import

// ❌ Don't use these
// import { db } from "../packages/database/src/client";
// import { db } from "../../packages/database";
```

### Step 3: Add to package.json (optional)
```json
// In tooling/scripts/package.json
{
  "scripts": {
    "your-script": "dotenv -c -e ../../.env -- tsx ./src/your-new-script.ts"
  }
}
```

### Step 4: Execute using correct pattern
```bash
cd tooling/scripts
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/your-new-script.ts
```

## 📋 Quick Command Reference

### Available Predefined Scripts
```bash
cd tooling/scripts

# Seeding
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm seed:sdo          # Seed SDO tank data
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm seed:demo         # Seed demo data

# Table Management
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm migrate:tables    # Create PipeTrak tables
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm verify:tables     # Verify tables exist
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm clean:components  # Clean component data

# Testing
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm test:excel-import # Test Excel import
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm test:full-import  # Test full import flow

# Migrations
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm migrate:component-type  # Component type migration
```

### Direct Script Execution
```bash
cd tooling/scripts

# Test connections
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/test-connections.ts

# Verify tables
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/verify-tables.ts

# Apply SQL migrations
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/apply-supabase-sql.ts

# Deploy functions
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/deploy-progress-summary.ts
```

## 🚨 Emergency Troubleshooting

### If you get "command not found" errors:
1. ✅ Check you're in `tooling/scripts` directory
2. ✅ Run `pnpm install` to ensure tsx is installed
3. ✅ Use `pnpm tsx` not `npx tsx`

### If you get module resolution errors:
1. ✅ Move script to `tooling/scripts/src/`
2. ✅ Use `@repo/database` imports
3. ✅ Check script is using correct imports

### If you get SSL certificate errors:
1. ✅ Always prefix with `NODE_TLS_REJECT_UNAUTHORIZED=0`
2. ✅ Verify `.env.local` exists with connection strings

### If you get database connection errors:
1. ✅ Run test-connections.ts first: `NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/test-connections.ts`
2. ✅ Check environment variables are loaded
3. ✅ Verify you're using DIRECT_URL for schema operations

## 🎯 Script Template

Copy this template for new database scripts:

```typescript
#!/usr/bin/env tsx
import { db } from "@repo/database";

async function yourScriptName() {
  console.log('🚀 Starting your script...');
  
  try {
    // Your database operations here
    const result = await db.yourTable.findMany();
    console.log(`✅ Found ${result.length} records`);
    
    // Example operations
    // await db.yourTable.create({ data: { ... } });
    // await db.yourTable.update({ where: { ... }, data: { ... } });
    
    console.log('🎉 Script completed successfully!');
  } catch (error: any) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

// Run the script
yourScriptName();
```

## 📖 Usage Examples

### Moving a script from wrong location:
```bash
# If you have a script in packages/database/scripts/
mv packages/database/scripts/your-script.ts tooling/scripts/src/

# Update imports in the script
# Change: import { db } from "../src/client";
# To:     import { db } from "@repo/database";

# Execute correctly
cd tooling/scripts
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/your-script.ts
```

### Creating and running a new seeding script:
```bash
# 1. Create script
echo '#!/usr/bin/env tsx
import { db } from "@repo/database";

async function seedYourData() {
  console.log("🌱 Seeding your data...");
  // Your seeding logic here
  console.log("✅ Seeding complete!");
}

seedYourData();' > tooling/scripts/src/seed-your-data.ts

# 2. Execute script
cd tooling/scripts
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/seed-your-data.ts
```

## 🔄 Migration from Old Patterns

If you have scripts in the wrong location, follow this migration:

### Step 1: Move the script
```bash
mv packages/database/scripts/your-script.ts tooling/scripts/src/
```

### Step 2: Update imports
```typescript
// Before (❌)
import { db } from "../src/client";
import { db } from "../../packages/database";

// After (✅)
import { db } from "@repo/database";
```

### Step 3: Test execution
```bash
cd tooling/scripts
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/your-script.ts
```

## 📚 Summary

**The Golden Rules:**
1. **Location**: All scripts in `tooling/scripts/src/`
2. **Execution**: Always use `NODE_TLS_REJECT_UNAUTHORIZED=0`
3. **Imports**: Use `@repo/database` not relative paths
4. **Directory**: Always `cd tooling/scripts` first
5. **Command**: Use `pnpm tsx src/script.ts`

Following these rules will eliminate 99% of database script execution errors and save significant development time.