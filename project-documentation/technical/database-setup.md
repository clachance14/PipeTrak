# PipeTrak Database Setup Guide

## Overview

This document provides comprehensive guidance for setting up and maintaining the PipeTrak database using Prisma ORM with Supabase PostgreSQL.

## Environment Configuration

### Required Environment Variables

```bash
# .env.local (symlinked to .env for scripts)

# Pooled connection for application runtime (port 6543)
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection for migrations (port 5432)
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

### SSL Certificate Handling

Supabase uses self-signed certificates which cause issues in local development.

**Solution for scripts**:
```bash
export NODE_TLS_REJECT_UNAUTHORIZED=0
```

**Solution in code**:
```typescript
const client = new Client({
  connectionString: process.env.DIRECT_URL,
  ssl: {
    rejectUnauthorized: false,
    ca: undefined
  }
});
```

## Table Naming Convention

### PascalCase Tables
All PipeTrak tables use PascalCase naming to ensure consistency between frontend and backend:

- ✅ `Component` (not `component`)
- ✅ `Drawing` (not `drawing`)
- ✅ `MilestoneTemplate` (not `milestone_template`)
- ✅ `ComponentMilestone` (not `component_milestone`)
- ✅ `ImportJob` (not `import_job`)
- ✅ `AuditLog` (not `audit_log`)

### Why This Matters
- Prisma models match table names exactly
- No `@@map` directives needed
- TypeScript interfaces align with database tables
- Reduces cognitive overhead

## Database Management Commands

### Basic Operations

```bash
# Generate Prisma client after schema changes
pnpm --filter database generate

# Push schema to database (development)
pnpm --filter database push

# Force push with potential data loss
pnpm --filter database push:force

# Open Prisma Studio (database GUI)
pnpm --filter database studio
```

### Migration Commands

```bash
# Create a new migration
pnpm --filter database migrate dev --name descriptive-name

# Deploy migrations to production
pnpm --filter database migrate:deploy

# Reset database (WARNING: deletes all data)
pnpm --filter database migrate reset
```

## Utility Scripts

Located in `tooling/scripts/src/`:

### Table Management

#### migrate-pipetrak-tables.ts
Creates PipeTrak tables manually using raw SQL.
```bash
pnpm --filter scripts migrate:tables
```

#### verify-tables.ts
Verifies all tables exist and shows row counts.
```bash
pnpm --filter scripts verify:tables
```

Output example:
```
📊 PipeTrak Tables Status:
────────────────────────────────────
✅ Drawing              | 20 columns | 3 indexes
✅ Component            | 20 columns | 8 indexes
✅ ComponentMilestone   | 13 columns | 3 indexes
────────────────────────────────────
📈 Table Row Counts:
────────────────────────────────────
Component            | 87 rows
ComponentMilestone   | 435 rows
Drawing              | 20 rows
```

#### drop-pipetrak-tables.ts
Drops all PipeTrak tables (useful for clean restarts).
```bash
pnpm --filter scripts run:script drop-pipetrak-tables
```

#### check-tables-direct.ts
Lists all tables in the database.
```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/check-tables-direct.ts
```

### Data Management

#### clean-components.ts
Removes all component data while preserving schema.
```bash
pnpm --filter scripts clean:components
```

#### seed-sdo-tank.ts
Seeds database with SDO Tank test data (87 components).
```bash
pnpm --filter scripts seed:sdo
```

## Common Issues and Solutions

### Issue 1: "Table does not exist" Error

**Symptom**: Prisma operations fail with "The table `Component` does not exist"

**Causes**:
1. Tables created with wrong case (lowercase instead of PascalCase)
2. Prisma client cache outdated
3. Wrong database connection

**Solution**:
```bash
# 1. Verify tables exist
pnpm --filter scripts verify:tables

# 2. Regenerate Prisma client
rm -rf packages/database/prisma/generated/client
pnpm --filter database generate

# 3. Force push schema
pnpm --filter database push:force
```

### Issue 2: SSL Certificate Errors

**Symptom**: "self-signed certificate in certificate chain"

**Solution for development**:
```bash
# Set environment variable
export NODE_TLS_REJECT_UNAUTHORIZED=0

# Or in package.json script
"script": "NODE_TLS_REJECT_UNAUTHORIZED=0 tsx script.ts"
```

### Issue 3: Prisma Client Not Finding New Tables

**Symptom**: New tables in schema.prisma not recognized

**Solution**:
```bash
# Clear all caches
rm -rf packages/database/prisma/generated/client
rm -rf packages/database/node_modules/.prisma
rm -rf node_modules/.pnpm

# Reinstall and regenerate
pnpm install
pnpm --filter database generate
```

### Issue 4: Migration Failures

**Symptom**: "Migration failed to apply cleanly"

**Solution**:
```bash
# Use push instead of migrate for development
pnpm --filter database push:force

# For production, create fresh migration
pnpm --filter database migrate dev --create-only
# Review and edit migration if needed
pnpm --filter database migrate dev
```

## Database Schema Best Practices

### 1. Always Define Indexes
```prisma
model Component {
  // ... fields ...
  
  @@index([projectId, status])
  @@index([drawingId, componentId])
}
```

### 2. Use Appropriate Field Types
```prisma
completionPercent Float    @default(0) // Not Int
createdAt        DateTime @default(now())
id               String   @id @default(cuid())
```

### 3. Define Relationships Clearly
```prisma
drawing   Drawing  @relation(fields: [drawingId], references: [id])
drawingId String   // Foreign key field
```

### 4. Add Constraints Where Needed
```prisma
@@unique([drawingId, componentId, instanceNumber])
```

## Backup and Recovery

### Manual Backup
```sql
-- Connect to Supabase SQL Editor
pg_dump -h aws-0-us-east-1.pooler.supabase.com -p 5432 -U postgres -d postgres > backup.sql
```

### Restore from Backup
```bash
psql -h aws-0-us-east-1.pooler.supabase.com -p 5432 -U postgres -d postgres < backup.sql
```

## Performance Monitoring

### Check Slow Queries
```sql
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### Table Size Analysis
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Production Deployment Checklist

### Before Deployment
- [ ] All migrations tested locally
- [ ] Backup production database
- [ ] Review migration SQL for destructive changes
- [ ] Test rollback procedure

### Deployment Steps
1. Set production environment variables
2. Run migrations: `pnpm --filter database migrate:deploy`
3. Verify tables: `pnpm --filter scripts verify:tables`
4. Run smoke tests
5. Monitor error logs

### Post-Deployment
- [ ] Verify all tables created
- [ ] Check application connectivity
- [ ] Monitor performance metrics
- [ ] Document any issues

## Troubleshooting Guide

### Debug Connection Issues
```typescript
// Test connection script
import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

client.connect()
  .then(() => console.log('Connected!'))
  .catch(err => console.error('Connection failed:', err))
  .finally(() => client.end());
```

### Verify Prisma Configuration
```bash
# Check Prisma config
npx prisma validate

# Test database connection
npx prisma db pull --print
```

### Reset Everything (Nuclear Option)
```bash
# WARNING: Deletes all data
pnpm --filter database migrate reset
pnpm --filter database push
pnpm --filter database generate
pnpm --filter scripts seed:sdo
```

## Migration History

### Key Migrations
1. **Initial Schema** - Base tables from Supastarter
2. **Add PipeTrak Tables** - Component, Drawing, etc.
3. **Add Instance Tracking** - instanceNumber, displayId fields
4. **Fix Constraints** - Changed from project-level to drawing-level unique

### Migration Naming Convention
```
YYYYMMDDHHMMSS_descriptive_name.sql
20250808000001_add_pipetrak_tables.sql
20250808150000_add_instance_tracking.sql
```

## Security Considerations

### Connection Security
- Use connection pooling for application queries
- Use direct connection only for migrations
- Rotate passwords regularly
- Never commit credentials to version control

### Query Security
- Use parameterized queries
- Validate all inputs
- Implement row-level security (RLS) for production
- Audit sensitive operations

## Conclusion

This database setup ensures:
- **Consistency**: PascalCase naming throughout
- **Reliability**: Proper migration tracking
- **Performance**: Appropriate indexes and connections
- **Maintainability**: Clear scripts and documentation

Follow these guidelines to maintain a healthy, performant database for PipeTrak.