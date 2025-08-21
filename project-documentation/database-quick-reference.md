# Database Operations Quick Reference

## 🚀 Most Common Commands

### Essential Environment Setup
```bash
# ALWAYS set this for Supabase operations
export NODE_TLS_REJECT_UNAUTHORIZED=0

# ALWAYS run from this directory
cd tooling/scripts
```

### Test Database Connection
```bash
cd tooling/scripts
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/test-connections.ts
```

## 🎯 Database Script Execution

### Critical Rules for Scripts
1. **All scripts MUST be in `tooling/scripts/src/`**
2. **Always run from `tooling/scripts` directory**
3. **Always use `NODE_TLS_REJECT_UNAUTHORIZED=0`**
4. **Use `@repo/database` imports, not relative paths**

### Script Execution Pattern
```bash
# The ONLY pattern that works
cd tooling/scripts
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/script-name.ts
```

### Common Script Execution Errors

#### ❌ "tsx: command not found"
```bash
# Wrong - tsx not available outside tooling/scripts
pnpm tsx packages/database/scripts/script.ts
npx tsx anywhere

# Right - tsx is only in tooling/scripts
cd tooling/scripts && pnpm tsx src/script.ts
```

#### ❌ "Cannot find module 'ts-node/register'"
```bash
# Wrong - ts-node not installed
node -r ts-node/register packages/database/scripts/script.ts

# Right - use tsx
cd tooling/scripts && pnpm tsx src/script.ts
```

#### ❌ "Cannot find module" (path resolution)
```bash
# Wrong - scripts in wrong location
node packages/database/scripts/script.js

# Right - scripts in correct location
cd tooling/scripts && pnpm tsx src/script.ts
```

### Execute SQL File
```bash
# Using the standardized executor
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx -e "
import { executeSQLFile } from './src/lib/sql-executor';
executeSQLFile('path/to/your/file.sql').then(() => process.exit(0));
"
```

### Verify Tables Exist
```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/verify-tables.ts
```

## 🔧 Emergency Commands

### Start Fresh (Nuclear Option)
```bash
# Drop all PipeTrak tables and recreate
cd tooling/scripts
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/drop-pipetrak-tables.ts
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/migrate-pipetrak-tables.ts
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/seed-sdo-tank.ts
```

### Fix Prisma Issues
```bash
cd packages/database
rm -rf node_modules/.prisma
pnpm prisma generate
pnpm prisma db push --accept-data-loss
```

## 📊 Common SQL Operations

### Execute Single SQL Command
```bash
psql "$DIRECT_URL" -c 'SELECT COUNT(*) FROM "Component";'
```

### Execute SQL File via psql
```bash
psql "$DIRECT_URL" -f packages/database/supabase/migrations/your-file.sql
```

### Check What Tables Exist
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

## 🎯 Connection Troubleshooting

### Problem: Connection Timeout
**Solution**: Use DIRECT_URL, not DATABASE_URL
```typescript
const connectionString = process.env.DIRECT_URL; // ✅ Correct
const connectionString = process.env.DATABASE_URL; // ❌ Wrong for schema ops
```

### Problem: SSL Certificate Error
**Solution**: Set environment variable
```bash
export NODE_TLS_REJECT_UNAUTHORIZED=0
```

### Problem: Function Won't Deploy
**Solutions**:
1. Use DIRECT_URL connection
2. Try Supabase Dashboard SQL Editor
3. Check for $$ delimiter parsing issues

## 🗂️ File Locations

### SQL Scripts Location
```
packages/database/supabase/migrations/
```

### TypeScript Scripts Location
```
tooling/scripts/src/
```

### Environment File
```
.env.local (symlinked to .env)
```

## 📋 Copy-Paste Templates

### Simple SQL Execution Script
```typescript
#!/usr/bin/env tsx
import { executeSQLFile } from './lib/sql-executor';

async function main() {
  try {
    await executeSQLFile('path/to/your/file.sql');
    console.log('✅ Success');
  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
}

main();
```

### Test Script Template
```typescript
#!/usr/bin/env tsx
import { SQLExecutor } from './lib/sql-executor';

async function test() {
  const executor = new SQLExecutor();
  
  try {
    await executor.connect();
    
    const result = await executor.executeStatement(
      'SELECT COUNT(*) as count FROM "Component"'
    );
    
    console.log('Component count:', result.rows[0].count);
    
  } finally {
    await executor.disconnect();
  }
}

test();
```

## 🎪 Function Deployment

### Deploy Dashboard Functions
```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/apply-dashboard-functions.ts
```

### Deploy Progress Functions
```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/deploy-progress-summary.ts
```

### Test Functions Work
```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/test-dashboard-functions-real.ts
```

## 🚨 When Things Go Wrong

### Can't Connect to Database
1. ✅ Check `NODE_TLS_REJECT_UNAUTHORIZED=0` is set
2. ✅ Use `DIRECT_URL` not `DATABASE_URL`
3. ✅ Run `test-connections.ts` to diagnose

### Table Not Found
1. ✅ Check table name is quoted: `"Component"` not `component`
2. ✅ Run `verify-tables.ts` to see what exists
3. ✅ Regenerate Prisma client: `pnpm prisma generate`

### Function Deployment Fails
1. ✅ Use `DIRECT_URL` connection
2. ✅ Try Supabase Dashboard SQL Editor
3. ✅ Check function has proper `$$ ... $$` delimiters

### Migration Issues
1. ✅ Use `pnpm prisma db push` for development
2. ✅ Clear cache: `rm -rf node_modules/.prisma`
3. ✅ Use direct SQL scripts as fallback

## 🎯 Decision Tree

**Need to execute SQL?**
1. Simple schema change → Use Prisma: `pnpm prisma db push`
2. Complex function → Use TypeScript script with `sql-executor`
3. Production function → Use Supabase Dashboard SQL Editor
4. Testing/debugging → Use psql with `DIRECT_URL`

**Connection failing?**
1. Set `NODE_TLS_REJECT_UNAUTHORIZED=0`
2. Use `DIRECT_URL` for schema operations
3. Run `test-connections.ts` to diagnose

**Function not working?**
1. Check function exists: Query `information_schema.routines`
2. Test with simple parameters
3. Check logs in Supabase Dashboard

## 📞 Emergency Contacts

- **Supabase Dashboard**: https://supabase.com/dashboard/project/ogmahtkaqziaoxldxnts
- **SQL Editor**: https://supabase.com/dashboard/project/ogmahtkaqziaoxldxnts/sql/new
- **Database Logs**: https://supabase.com/dashboard/project/ogmahtkaqziaoxldxnts/logs/postgres-logs

## 💡 Pro Tips

1. **Always prefix with NODE_TLS_REJECT_UNAUTHORIZED=0** for Supabase
2. **Use DIRECT_URL for schema changes**, DATABASE_URL for app queries
3. **Quote PascalCase table names** in SQL: `"Component"` 
4. **Test with simple script first** before complex operations
5. **Supabase Dashboard SQL Editor** is your fallback for complex functions
6. **Check existing scripts** in `tooling/scripts/src/` before writing new ones