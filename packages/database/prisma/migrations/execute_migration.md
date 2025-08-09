# Project Job Number Migration Execution Guide

## Overview
This guide outlines the execution of the 4-step migration for adding jobNumber and renaming name to jobName in the Project model.

## Pre-Migration Checklist

### Development Environment
- [ ] Database backup completed
- [ ] Migration files reviewed and approved
- [ ] Rollback scripts tested
- [ ] Updated Prisma schema validated with `pnpm --filter database generate`

### Production Environment  
- [ ] Full database backup completed
- [ ] Application maintenance mode enabled
- [ ] Migration scripts tested in staging environment
- [ ] Rollback procedures verified
- [ ] Monitoring and alerting configured

## Migration Execution

### Step 1: Add New Columns
```bash
# Execute first migration
psql $DATABASE_URL -f 20250808000001_add_job_fields/migration.sql

# Verify columns added
psql $DATABASE_URL -c "\d project"
```

### Step 2: Migrate Data
```bash
# Execute data migration
psql $DATABASE_URL -f 20250808000002_migrate_project_data/migration.sql

# Verify data migration
psql $DATABASE_URL -c "SELECT id, name, \"jobName\", \"jobNumber\" FROM project LIMIT 10;"
psql $DATABASE_URL -c "SELECT COUNT(*) as total, COUNT(\"jobName\") as with_job_name, COUNT(\"jobNumber\") as with_job_number FROM project;"
```

### Step 3: Add Constraints
```bash
# Execute constraints migration
psql $DATABASE_URL -f 20250808000003_add_constraints/migration.sql

# Verify constraints and indexes
psql $DATABASE_URL -c "SELECT conname, contype FROM pg_constraint WHERE conrelid = 'project'::regclass;"
psql $DATABASE_URL -c "SELECT indexname FROM pg_indexes WHERE tablename = 'project';"
```

### Step 4: Drop Old Column
```bash
# Execute final migration
psql $DATABASE_URL -f 20250808000004_drop_name_column/migration.sql

# Verify final state
psql $DATABASE_URL -c "\d project"
```

### Post-Migration Verification
```bash
# Verify data integrity
psql $DATABASE_URL -c "SELECT COUNT(*) FROM project WHERE \"jobName\" IS NULL OR \"jobNumber\" IS NULL;"

# Test uniqueness constraint
psql $DATABASE_URL -c "SELECT \"organizationId\", \"jobNumber\", COUNT(*) FROM project GROUP BY \"organizationId\", \"jobNumber\" HAVING COUNT(*) > 1;"

# Test indexes performance
psql $DATABASE_URL -c "EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM project WHERE \"jobNumber\" = 'LEGACY001';"
```

## Rollback Procedures

### Complete Rollback (Execute in Reverse Order)
```bash
# Step 4 rollback: Re-add name column
psql $DATABASE_URL -f rollback_004_drop_name_column.sql

# Step 3 rollback: Remove constraints
psql $DATABASE_URL -f rollback_003_add_constraints.sql

# Step 2 rollback: Clear migrated data
psql $DATABASE_URL -f rollback_002_migrate_project_data.sql

# Step 1 rollback: Remove new columns
psql $DATABASE_URL -f rollback_001_add_job_fields.sql
```

### Partial Rollback
If migration fails at any step, execute rollback scripts for that step and all subsequent steps in reverse order.

## Using Prisma CLI (Alternative)

### For Development
```bash
# Generate migration files automatically (may require manual adjustment)
pnpm --filter database migrate:dev --name add_job_number_field

# Apply migrations
pnpm --filter database migrate:deploy
```

### For Production
```bash
# Deploy migrations
pnpm --filter database migrate:deploy

# Verify deployment
pnpm --filter database generate
```

## Success Criteria

### Data Integrity
- [ ] All projects have non-null jobName and jobNumber
- [ ] No duplicate jobNumbers within same organization
- [ ] Original data preserved during migration
- [ ] All foreign key relationships intact

### Performance
- [ ] Job number lookups < 10ms
- [ ] Project creation < 50ms
- [ ] Organization project lists < 100ms
- [ ] Index usage confirmed in query plans

### Constraints
- [ ] Unique constraint enforced on (organizationId, jobNumber)
- [ ] VARCHAR(10) constraint enforced on jobNumber
- [ ] NOT NULL constraints active on jobName and jobNumber

## Monitoring Post-Migration

### Key Metrics
- Project creation success rate
- API error rates for project endpoints
- Database query performance metrics
- Constraint violation logs

### Alert Conditions
- Project creation failures > 1%
- Job number uniqueness violations > 0
- Query performance degradation > 20%
- Migration rollback executed

## Contact Information
- Database Team: [Contact Info]
- Backend Team: [Contact Info]  
- DevOps Team: [Contact Info]
- On-call Engineer: [Contact Info]