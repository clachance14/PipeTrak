# PipeTrak Project Enhancement - Job Number Field Architecture Specification

## Executive Summary

This specification outlines the technical architecture for adding a `jobNumber` field and renaming the `name` field to `jobName` in the PipeTrak projects table. The enhancement maintains backward compatibility while providing unique job number tracking within organizational boundaries.

## Requirements Analysis

:::brainstorm
**Current State Analysis:**
- The Project model currently has a `name` field (String, required)
- Projects are scoped to organizations via `organizationId`
- Current indexes exist on `organizationId`
- Prisma ORM with PostgreSQL backend
- Zod validation schemas auto-generated
- API layer built with Hono framework
- Frontend types defined in TypeScript interfaces

**New Requirements:**
1. Rename `name` → `jobName` (maintaining required string constraint)
2. Add `jobNumber` field (required string, alphanumeric, max 10 chars)
3. Ensure jobNumber uniqueness within organization scope
4. Maintain performance with appropriate indexing
5. Handle existing production data migration
6. Update all dependent API contracts and validations

**Performance & Scale Considerations:**
- Projects table likely has low-to-moderate volume (hundreds to thousands per org)
- jobNumber queries will be frequent for project lookups
- Composite unique constraint needed: (organizationId, jobNumber)
- Index strategy: single composite index for uniqueness + query performance
:::

## 1. Database Schema Changes

### 1.1 Prisma Schema Updates

**File:** `/packages/database/prisma/schema.prisma`

```prisma
model Project {
    id             String   @id @default(cuid())
    organizationId String
    organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
    
    // RENAMED: name → jobName
    jobName        String   // Renamed from 'name'
    // NEW: jobNumber field with constraints
    jobNumber      String   @db.VarChar(10) // Max 10 characters for job numbers
    description    String?
    status         ProjectStatus @default(ACTIVE)
    
    // Metadata
    location       String?
    startDate      DateTime?
    targetDate     DateTime?
    
    // Audit fields
    createdAt      DateTime @default(now())
    updatedAt      DateTime @updatedAt
    createdBy      String
    creator        User @relation("ProjectCreator", fields: [createdBy], references: [id])
    
    // Relations
    drawings       Drawing[]
    components     Component[]
    milestoneTemplates MilestoneTemplate[]
    importJobs     ImportJob[]
    auditLogs      AuditLog[]
    
    // UPDATED: Indexes for performance and constraints
    @@unique([organizationId, jobNumber], name: "unique_org_job_number")
    @@index([organizationId], name: "idx_project_organization")
    @@index([organizationId, status], name: "idx_project_org_status")
    @@index([jobNumber], name: "idx_project_job_number") // For cross-org job number searches
    @@map("project")
}
```

### 1.2 Migration Strategy

Since Prisma doesn't support automatic column renaming, a multi-step migration approach is required:

**Step 1: Add jobNumber and jobName columns**
```sql
-- Migration: 001_add_job_fields
ALTER TABLE "project" 
ADD COLUMN "jobNumber" VARCHAR(10),
ADD COLUMN "jobName" TEXT;
```

**Step 2: Data Migration**
```sql
-- Migration: 002_migrate_data
-- Copy existing 'name' values to 'jobName'
UPDATE "project" SET "jobName" = "name";

-- Generate jobNumber from existing name or use incremental approach
-- Option A: Use first 10 chars of existing name (if alphanumeric)
UPDATE "project" 
SET "jobNumber" = UPPER(LEFT(REGEXP_REPLACE("name", '[^A-Za-z0-9]', '', 'g'), 10))
WHERE "jobNumber" IS NULL;

-- Option B: Use incremental numbering per organization
-- This script would need to run per organization to ensure uniqueness
WITH numbered_projects AS (
  SELECT 
    id,
    organizationId,
    ROW_NUMBER() OVER (PARTITION BY organizationId ORDER BY createdAt) as row_num
  FROM "project" 
  WHERE "jobNumber" IS NULL
)
UPDATE "project" 
SET "jobNumber" = 'PROJ' || LPAD(np.row_num::TEXT, 4, '0')
FROM numbered_projects np
WHERE "project".id = np.id;
```

**Step 3: Add constraints**
```sql
-- Migration: 003_add_constraints
ALTER TABLE "project" 
ALTER COLUMN "jobNumber" SET NOT NULL,
ALTER COLUMN "jobName" SET NOT NULL;

-- Add unique constraint
ALTER TABLE "project" 
ADD CONSTRAINT "unique_org_job_number" UNIQUE ("organizationId", "jobNumber");

-- Add performance indexes
CREATE INDEX "idx_project_job_number" ON "project" ("jobNumber");
CREATE INDEX "idx_project_org_status" ON "project" ("organizationId", "status");
```

**Step 4: Remove old column**
```sql
-- Migration: 004_drop_name_column
ALTER TABLE "project" DROP COLUMN "name";
```

### 1.3 Rollback Strategy

```sql
-- Rollback steps (reverse order)
-- 004_rollback: Re-add name column
ALTER TABLE "project" ADD COLUMN "name" TEXT;
UPDATE "project" SET "name" = "jobName";
ALTER TABLE "project" ALTER COLUMN "name" SET NOT NULL;

-- 003_rollback: Remove constraints
ALTER TABLE "project" DROP CONSTRAINT "unique_org_job_number";
DROP INDEX "idx_project_job_number";
DROP INDEX "idx_project_org_status";

-- 002_rollback: No data rollback needed (keep both columns)

-- 001_rollback: Remove new columns
ALTER TABLE "project" DROP COLUMN "jobNumber", DROP COLUMN "jobName";
```

## 2. API Contract Specifications

### 2.1 Updated Validation Schemas

**File:** `/packages/api/src/routes/pipetrak/projects.ts`

```typescript
import { z } from "zod";

// Job number validation regex: alphanumeric, 1-10 characters
const jobNumberRegex = /^[A-Za-z0-9]{1,10}$/;

// Updated schemas
const ProjectCreateSchema = z.object({
  organizationId: z.string().cuid(),
  jobName: z.string().min(1).max(255), // Renamed from 'name'
  jobNumber: z.string()
    .min(1, "Job number is required")
    .max(10, "Job number must be 10 characters or less")
    .regex(jobNumberRegex, "Job number must be alphanumeric only"),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().datetime().optional(),
  targetDate: z.string().datetime().optional(),
});

const ProjectUpdateSchema = ProjectCreateSchema.partial().extend({
  status: z.nativeEnum(ProjectStatus).optional(),
  // jobNumber updates require special handling for uniqueness
  jobNumber: z.string()
    .min(1)
    .max(10)
    .regex(jobNumberRegex)
    .optional(),
});

// Validation for jobNumber uniqueness
const validateJobNumberUniqueness = async (
  organizationId: string, 
  jobNumber: string, 
  excludeProjectId?: string
): Promise<boolean> => {
  const existing = await prisma.project.findFirst({
    where: {
      organizationId,
      jobNumber,
      ...(excludeProjectId && { id: { not: excludeProjectId } })
    }
  });
  return !existing;
};
```

### 2.2 API Endpoint Updates

**Updated Create Endpoint:**
```typescript
// POST /api/pipetrak/projects
.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const data = ProjectCreateSchema.parse(body);
    const userId = c.get("user")?.id;

    // Verify organization membership
    const membership = await prisma.member.findFirst({
      where: {
        userId,
        organizationId: data.organizationId,
        role: { in: ["owner", "admin"] },
      },
    });

    if (!membership) {
      return c.json({ error: "Insufficient permissions to create project" }, 403);
    }

    // Validate jobNumber uniqueness
    const isUnique = await validateJobNumberUniqueness(
      data.organizationId, 
      data.jobNumber
    );
    
    if (!isUnique) {
      return c.json({ 
        error: "Job number already exists in this organization",
        details: `Job number "${data.jobNumber}" is already in use`
      }, 409);
    }

    const project = await prisma.project.create({
      data: {
        ...data,
        createdBy: userId,
        status: ProjectStatus.ACTIVE,
      },
      include: {
        organization: {
          select: { id: true, name: true, slug: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Create default milestone templates...
    
    return c.json(project, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ 
        error: "Invalid input", 
        details: error.errors 
      }, 400);
    }
    if (error.code === 'P2002') { // Prisma unique constraint violation
      return c.json({ 
        error: "Job number already exists in this organization" 
      }, 409);
    }
    return c.json({ error: "Failed to create project" }, 500);
  }
})
```

**Updated Response Schema:**
```typescript
// Updated project response type
interface ProjectResponse {
  id: string;
  organizationId: string;
  jobName: string;        // Renamed from 'name'
  jobNumber: string;      // New field
  description?: string;
  status: ProjectStatus;
  location?: string;
  startDate?: string;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  stats?: ProjectStats;
}
```

## 3. Frontend Type Updates

### 3.1 TypeScript Interface Updates

**File:** `/apps/web/modules/pipetrak/types.ts`

```typescript
export interface Project {
  id: string;
  organizationId: string;
  jobName: string;         // Renamed from 'name'
  jobNumber: string;       // New field
  description?: string | null;
  status: ProjectStatus;
  location?: string | null;
  startDate?: Date | null;
  targetDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  creator?: any;
  organization?: any;
  drawings?: Drawing[];
  components?: Component[];
  milestoneTemplates?: MilestoneTemplate[];
  importJobs?: ImportJob[];
  auditLogs?: AuditLog[];
}
```

### 3.2 Form Validation

```typescript
// Client-side validation schema
export const projectFormSchema = z.object({
  jobName: z.string()
    .min(1, "Job name is required")
    .max(255, "Job name must be 255 characters or less"),
  jobNumber: z.string()
    .min(1, "Job number is required")
    .max(10, "Job number must be 10 characters or less")
    .regex(/^[A-Za-z0-9]+$/, "Job number must contain only letters and numbers"),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.date().optional(),
  targetDate: z.date().optional(),
});

export type ProjectFormData = z.infer<typeof projectFormSchema>;
```

## 4. Performance & Indexing Strategy

### 4.1 Index Analysis

**Primary Indexes:**
1. `unique_org_job_number` - Composite unique constraint on (organizationId, jobNumber)
   - Purpose: Ensures uniqueness, optimizes organization-scoped job number lookups
   - Query pattern: `WHERE organizationId = ? AND jobNumber = ?`

2. `idx_project_job_number` - Single column index on jobNumber
   - Purpose: Cross-organization job number searches (admin functions)
   - Query pattern: `WHERE jobNumber = ?`

3. `idx_project_org_status` - Composite index on (organizationId, status)
   - Purpose: Optimizes filtered project lists
   - Query pattern: `WHERE organizationId = ? AND status = ?`

### 4.2 Query Performance Expectations

**Expected Query Patterns:**
- Project lookup by job number within org: `O(1)` with unique index
- Project list for organization: `O(log n)` with org index
- Job number uniqueness check: `O(1)` with composite unique index
- Status-filtered project lists: `O(log n)` with composite index

**Performance Targets:**
- Job number uniqueness validation: < 10ms
- Project creation: < 50ms
- Project list queries: < 100ms (up to 1000 projects per org)

## 5. Migration Execution Plan

### 5.1 Development Environment

```bash
# Step 1: Create migration files
pnpm --filter database migrate:dev --name add_job_fields

# Step 2: Create data migration script
echo "-- Data migration for jobNumber and jobName fields" > migration_data.sql
# Add migration SQL from section 1.2

# Step 3: Test migration
pnpm --filter database migrate:dev --name migrate_project_data

# Step 4: Verify data integrity
pnpm --filter database studio # Manual verification

# Step 5: Generate updated Prisma client
pnpm --filter database generate
```

### 5.2 Production Migration

```bash
# Pre-migration checklist:
# 1. Database backup completed
# 2. Application maintenance mode enabled
# 3. Migration scripts tested in staging

# Migration execution:
pnpm --filter database migrate:deploy

# Post-migration verification:
# 1. Run data integrity checks
# 2. Verify API endpoints
# 3. Test frontend functionality
# 4. Disable maintenance mode
```

## 6. Testing Strategy

### 6.1 Database Tests

```sql
-- Test unique constraint
INSERT INTO project (id, organizationId, jobName, jobNumber, createdBy, status) 
VALUES ('test1', 'org1', 'Test Project 1', 'PROJ001', 'user1', 'ACTIVE');

-- This should fail with unique constraint violation
INSERT INTO project (id, organizationId, jobName, jobNumber, createdBy, status) 
VALUES ('test2', 'org1', 'Test Project 2', 'PROJ001', 'user1', 'ACTIVE');

-- This should succeed (different organization)
INSERT INTO project (id, organizationId, jobName, jobNumber, createdBy, status) 
VALUES ('test3', 'org2', 'Test Project 3', 'PROJ001', 'user1', 'ACTIVE');
```

### 6.2 API Tests

```typescript
describe('Project API with jobNumber', () => {
  test('creates project with valid jobNumber', async () => {
    const response = await api.post('/api/pipetrak/projects', {
      organizationId: 'test-org',
      jobName: 'Test Project',
      jobNumber: 'PROJ001',
      description: 'Test description'
    });
    
    expect(response.status).toBe(201);
    expect(response.data.jobNumber).toBe('PROJ001');
    expect(response.data.jobName).toBe('Test Project');
  });

  test('rejects duplicate jobNumber in same organization', async () => {
    // Create first project
    await api.post('/api/pipetrak/projects', {
      organizationId: 'test-org',
      jobName: 'Project 1',
      jobNumber: 'DUPLICATE'
    });

    // Attempt duplicate
    const response = await api.post('/api/pipetrak/projects', {
      organizationId: 'test-org', 
      jobName: 'Project 2',
      jobNumber: 'DUPLICATE'
    });
    
    expect(response.status).toBe(409);
    expect(response.data.error).toContain('already exists');
  });

  test('allows same jobNumber in different organizations', async () => {
    const responses = await Promise.all([
      api.post('/api/pipetrak/projects', {
        organizationId: 'org1',
        jobName: 'Project 1',
        jobNumber: 'SHARED'
      }),
      api.post('/api/pipetrak/projects', {
        organizationId: 'org2',
        jobName: 'Project 2', 
        jobNumber: 'SHARED'
      })
    ]);

    expect(responses[0].status).toBe(201);
    expect(responses[1].status).toBe(201);
  });
});
```

## 7. Edge Cases & Error Handling

### 7.1 Validation Edge Cases

1. **Job Number Format Validation**
   - Empty string: Reject with "Job number is required"
   - Special characters: Reject with "Alphanumeric only" 
   - Length > 10: Reject with "Maximum 10 characters"
   - Leading/trailing spaces: Strip and validate

2. **Uniqueness Conflicts**
   - Case sensitivity: Treat as case-insensitive for uniqueness
   - Unicode characters: Normalize before storage
   - Concurrent creation: Handle race conditions with proper error responses

### 7.2 Migration Edge Cases

1. **Existing Data Issues**
   - Null/empty names: Use fallback "Untitled Project"
   - Very long names: Truncate to fit jobNumber constraints
   - Special characters in names: Strip non-alphanumeric for jobNumber generation

2. **Rollback Scenarios**
   - Partial migration failure: Automated rollback to previous state
   - Data corruption: Restore from backup with data integrity checks

## 8. Security Considerations

### 8.1 Input Validation
- Server-side validation enforced at API layer
- SQL injection prevention via parameterized queries (Prisma ORM)
- XSS prevention through input sanitization

### 8.2 Authorization
- Organization-scoped access control maintained
- Job number uniqueness enforced at database level
- Audit logging for all project modifications

## 9. Monitoring & Observability

### 9.1 Key Metrics
- Project creation success/failure rates
- Job number uniqueness violation frequency  
- Migration execution time and success rate
- Query performance for job number lookups

### 9.2 Alerting
- Database constraint violations
- API error rate increases
- Migration failures
- Performance degradation on project queries

## 10. Implementation Timeline

### Phase 1: Database Schema (Week 1)
- [ ] Update Prisma schema
- [ ] Create migration scripts
- [ ] Test in development environment
- [ ] Validate data migration logic

### Phase 2: API Layer (Week 1-2)
- [ ] Update validation schemas
- [ ] Modify API endpoints
- [ ] Add error handling for uniqueness violations
- [ ] Update API documentation

### Phase 3: Frontend Updates (Week 2)
- [ ] Update TypeScript interfaces
- [ ] Modify forms and validation
- [ ] Update display components
- [ ] Test UI workflows

### Phase 4: Testing & Deployment (Week 2-3)
- [ ] Complete integration testing
- [ ] Performance testing
- [ ] Production deployment
- [ ] Post-deployment monitoring

## Conclusion

This architecture specification provides a comprehensive plan for adding jobNumber functionality while maintaining system stability and performance. The implementation follows database-first design principles with proper validation, error handling, and migration strategies to ensure zero-downtime deployment and data integrity.

**Key Implementation Files:**
- Database Schema: `/packages/database/prisma/schema.prisma`  
- API Routes: `/packages/api/src/routes/pipetrak/projects.ts`
- Type Definitions: `/apps/web/modules/pipetrak/types.ts`
- Migration Scripts: Custom SQL migrations for data transformation

This specification ensures that backend engineers can implement the changes directly with clear technical requirements, migration strategies, and comprehensive error handling approaches.