# Database Setup

> 📖 **Comprehensive Guides Available**:
> - [Database Operations Guide](../project-documentation/database-operations-guide.md) - Complete reference with tested patterns
> - [Database Quick Reference](../project-documentation/database-quick-reference.md) - Copy-paste commands for common tasks

## Supabase Configuration
This project uses Supabase cloud (not local Docker) for the database:
- Connection strings are configured in `.env.local` (symlinked to `.env`)
- DATABASE_URL: Uses connection pooler (port 6543) for serverless/edge functions
- DIRECT_URL: Uses direct connection (port 5432) for migrations
- **Important**: Use `NODE_TLS_REJECT_UNAUTHORIZED=0` for local development with Supabase SSL

## Database Management
```bash
# Push schema changes to Supabase
pnpm --filter database push

# Force push with data loss acceptance
pnpm --filter database push:force

# Generate Prisma client after schema changes
pnpm --filter database generate

# Create a new migration
pnpm --filter database migrate dev --name migration-name

# Deploy migrations to production
pnpm --filter database migrate:deploy
```

## Table Naming Convention
- **All tables use PascalCase**: Component, Drawing, MilestoneTemplate, etc.
- **No @@map directives needed** - Prisma models match table names exactly
- This ensures frontend TypeScript interfaces and backend database tables use identical naming

## Schema Location
- Database schema: `packages/database/prisma/schema.prisma`
- Migrations: `packages/database/prisma/migrations/`
- Generated types: `packages/database/src/client.ts`
- Manual SQL scripts: `packages/database/supabase/`

## Useful Scripts
Located in `tooling/scripts/src/`:
- `migrate-pipetrak-tables.ts` - Create PipeTrak tables manually
- `verify-tables.ts` - Verify all tables exist with row counts
- `drop-pipetrak-tables.ts` - Drop all PipeTrak tables
- `check-tables-direct.ts` - Check table names and structure
- `clean-components.ts` - Clean all component data

## Component Instance Tracking

### Overview
PipeTrak handles the industrial construction reality where the same component (gasket, valve, fitting) appears multiple times on a drawing. Each instance is tracked separately for installation progress.

### Design Principles
- **Instance tracking is per drawing, not per project**
- Components can appear multiple times on the same drawing (e.g., 10 identical gaskets)
- Each instance has its own milestone tracking and completion status
- Foremen can mark "gasket 3 of 10" as installed while others remain pending

### Schema Design
```typescript
model Component {
  // Identification
  componentId        String   // Part number (e.g., "GSWAZ1DZZASG5331")
  instanceNumber     Int      // Instance on THIS drawing (1, 2, 3...)
  totalInstancesOnDrawing Int? // Total count on THIS drawing
  displayId          String?  // "GSWAZ1DZZASG5331 (3 of 10)"
  
  // Unique per drawing, not project
  @@unique([drawingId, componentId, instanceNumber])
}
```

### Import Behavior
- Groups components by drawingId + componentId
- Assigns sequential instance numbers per drawing
- Generates human-readable displayId
- Handles data quality issues (logs warnings for missing drawings)

### Example
Drawing P-35F11 might have:
- GSWAZ1DZZASG5331 (1 of 3)
- GSWAZ1DZZASG5331 (2 of 3)  
- GSWAZ1DZZASG5331 (3 of 3)

Each instance tracks its own installation progress independently.

## Production Setup

### Database
- [ ] Run database migrations on production Supabase
- [ ] Verify RLS policies are enabled
- [ ] Set up database backups