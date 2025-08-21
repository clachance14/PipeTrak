# PipeTrak Business Logic & Architecture

## Project Overview
PipeTrak is an industrial construction pipe tracking system designed to replace Excel-based workflows with a modern web application for foremen and project managers.

## Current Development Status (January 2025)

**Project Phase**: Phase 3 In Progress (~70% Complete)  
**Status**: Alpha - Core features functional, polish needed  
**Active Focus**: Mobile experience polish and reporting features

### Working Features ✅
- Organization-based multi-tenant routing (`/app/{org}/pipetrak/{projectId}`)
- Component management with Excel-like interface
- **Bulk component updates** ✅ (Advanced filtering, grouping, and batch operations)
- Dashboard with responsive layouts (desktop/tablet/mobile)
- Import system for components and field welds ✅ (V2 complete)
- Milestone tracking with real-time progress calculation
- Drawing navigation with hierarchical structure

### In Progress 🔄
- **Mobile field interface polish**: Touch target optimization, performance improvements
- **General refinements**: Loading states, error boundaries, user experience polish

### Not Started ⏳
- Audit trail system
- Advanced reporting features
- Welder management system
- Offline capability

**Key Reference**: See `project-documentation/current-state.md` for detailed feature status.

## PipeTrak Routing Architecture

PipeTrak uses organization-based multi-tenant routing with the following structure:

```
/app/{organizationSlug}/pipetrak/{projectId}/{feature}
```

### Key URL Patterns:
- `/app/{org}/pipetrak` - Projects list page
- `/app/{org}/pipetrak/{projectId}/dashboard` - Project dashboard
- `/app/{org}/pipetrak/{projectId}/components` - Components table
- `/app/{org}/pipetrak/{projectId}/drawings` - Drawings list
- `/app/{org}/pipetrak/{projectId}/import` - Import wizard
- `/app/{org}/pipetrak/{projectId}/qc/field-welds` - Field weld QC
- `/app/{org}/pipetrak/{projectId}/reports` - Reports section

### Smart Redirect System:
- Legacy URLs `/app/pipetrak/[...slug]` auto-redirect to organization-scoped URLs
- Example: `/app/pipetrak/123/dashboard` → `/app/acme-corp/pipetrak/123/dashboard`

### Critical Architecture Notes:
- All PipeTrak resources are scoped to organizations
- Users MUST be members of an organization to access any PipeTrak data
- Organization context is determined by URL slug, not user session
- Row-level security enforced at database level

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
- ✅ **Core Logic Working**: Groups components by drawingId + componentId to prevent duplicates
- ✅ **Database Operations**: Assigns sequential instance numbers per drawing with transaction safety
- ✅ **Data Integrity**: Generates human-readable displayId, creates missing drawings automatically
- ✅ **Error Handling**: Proper constraint violation prevention, foreign key management
- ✅ **UI/UX Complete**: 4-step wizard with preview, validation, and progress tracking

### Example
Drawing P-35F11 might have:
- GSWAZ1DZZASG5331 (1 of 3)
- GSWAZ1DZZASG5331 (2 of 3)  
- GSWAZ1DZZASG5331 (3 of 3)

Each instance tracks its own installation progress independently.

## Role Mappings

### PipeTrak Role Mapping
- **Foreman**: Organization `member` role
- **Project Manager**: Organization `owner` or `admin` role

### Permission Patterns
```typescript
// Feature gating (client-side)
if (membership?.role === 'member') {
  // Show Foreman features
} else if (membership?.role === 'owner' || membership?.role === 'admin') {
  // Show Project Manager features
}
```

## Key Modules

### Dashboard
- **Location**: `apps/web/modules/pipetrak/dashboard/`
- **Features**: KPI display, progress tracking, activity feed
- **Responsive**: Desktop, tablet, and mobile layouts

### Components
- **Location**: `apps/web/modules/pipetrak/components/`
- **Features**: Excel-like table, milestone tracking, responsive mobile interface
- **Bulk Operations**: Advanced filtering system (Area, Test Package, System, Type, Status) with persistent filters
- **Bulk Updates**: Quick mode (same milestone for all) and Advanced mode (per-component-type configuration)
- **Smart Grouping**: Handles mixed component types (spool vs gasket) with different milestone templates
- **Error Recovery**: Partial success handling, failure export to CSV, retry mechanisms
- **Performance**: Handles millions of components with virtualization

### Import System
- **Location**: `apps/web/modules/pipetrak/import/`
- **Features**: CSV/Excel upload, validation, progress tracking, type mapping, milestone assignment
- **Status**: ✅ V2 implementation complete - Full import workflow with 96% test coverage
- **Technical Details**: See `apps/web/modules/pipetrak/import/CLAUDE.md` for implementation details

### Drawings
- **Location**: `apps/web/modules/pipetrak/drawings/`
- **Features**: Hierarchical tree view, search, component counts

### Reports
- **Location**: `apps/web/modules/pipetrak/reports/`
- **Features**: Progress reports, exports, ROC calculations

## API Structure
- **Base Path**: `packages/api/src/routes/pipetrak/`
- **Organization-scoped**: All endpoints verify organization membership
- **Real-time**: WebSocket support for live updates

## Testing
- **Unit Tests**: Component-level testing with Vitest
- **Integration Tests**: API and database testing
- **E2E Tests**: Playwright for user workflows
- **Location**: `apps/web/modules/pipetrak/*/__tests__/`

For detailed implementation guides, see:
- `project-documentation/current-state.md`
- `project-documentation/dev-runbook.md`
- Individual module README files