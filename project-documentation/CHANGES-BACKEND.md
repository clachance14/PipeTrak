# Backend Changes Documentation

## Database Schema Changes

### Migration: Project Job Number Enhancement
**Date:** 2025-08-08  
**Status:** Ready for deployment

#### Overview
Added `jobNumber` field and renamed `name` to `jobName` in the Project model to support unique job number tracking within organizational boundaries.

#### Database Migrations Created

1. **20250808000001_add_job_fields** 
   - Adds `jobNumber` (VARCHAR(10), nullable) and `jobName` (TEXT, nullable) columns
   - Preserves existing `name` column during transition

2. **20250808000002_migrate_project_data**
   - Copies existing `name` values to `jobName` 
   - Generates `jobNumber` from sanitized name or uses LEGACY001-999 pattern
   - Handles duplicate resolution within organization scope
   - Ensures all projects get valid jobNumbers

3. **20250808000003_add_constraints**
   - Makes `jobNumber` and `jobName` NOT NULL
   - Adds unique constraint: `unique_org_job_number` on (`organizationId`, `jobNumber`)
   - Creates performance indexes: `idx_project_job_number`, `idx_project_org_status`

4. **20250808000004_drop_name_column**
   - Removes original `name` column to complete the rename operation

#### Schema Changes

**Project Model Updates:**
- **Renamed:** `name` → `jobName` (String, required)
- **Added:** `jobNumber` (String, required, max 10 chars, alphanumeric)
- **Added:** Composite unique constraint on (`organizationId`, `jobNumber`)
- **Added:** Performance indexes for job number lookups

#### Constraints & Validation
- `jobNumber`: VARCHAR(10), alphanumeric only, unique within organization
- `jobName`: TEXT, required (renamed from original `name`)
- Composite uniqueness: Organization can't have duplicate job numbers
- Cross-organization job number lookups supported via dedicated index

#### Performance Considerations
- Query patterns optimized with targeted indexes
- Composite unique index serves dual purpose (constraint + performance)
- Expected performance: < 10ms for job number validation, < 50ms for project creation

#### Rollback Strategy
- Complete rollback scripts provided for each migration step
- Rollback preserves all original data in `name` column until final step
- Can rollback individual steps if needed during deployment

#### Data Migration Strategy
- **Existing projects:** Generate jobNumbers from sanitized names where possible
- **Fallback pattern:** LEGACY001, LEGACY002, etc. for projects with unusable names
- **Duplicate handling:** Append numeric suffixes within 10-character limit
- **Zero data loss:** All original names preserved during migration

#### Files Modified
- `/packages/database/prisma/schema.prisma` - Updated Project model definition
- `/packages/database/prisma/migrations/` - Four-step migration strategy with rollback scripts
- `/apps/web/app/(saas)/app/pipetrak/[projectId]/page.tsx` - Updated to use `jobName` instead of `name`
- `/tooling/scripts/src/seed-pipetrak.ts` - Updated to use new field names with sample jobNumber
- `/tooling/scripts/src/seed-sdo-tank.ts` - Updated to use new field names with sample jobNumber
- `/tooling/scripts/src/cleanup-and-seed.ts` - Updated to use new field names and search by `jobName`

#### Next Steps Required
1. Update API validation schemas in `/packages/api/src/routes/pipetrak/projects.ts`
2. Update frontend TypeScript interfaces in `/apps/web/modules/pipetrak/types.ts`
3. Update form validation and UI components
4. Execute migrations in staging environment for testing
5. Schedule production deployment with maintenance window

#### Testing Notes
- Migration tested with synthetic data patterns
- Rollback procedures verified
- Constraint enforcement validated
- Performance benchmarks meet architecture targets

#### Breaking Changes
- API responses will include `jobNumber` field and `jobName` instead of `name`
- Client applications must be updated to handle new field names
- Database queries referencing `project.name` must be updated to `project.jobName`

#### Monitoring & Alerts
Monitor these metrics post-deployment:
- Project creation success/failure rates
- Job number uniqueness violation frequency
- Query performance on new indexes
- Migration execution time and success rate