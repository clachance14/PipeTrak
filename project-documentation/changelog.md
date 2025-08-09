# PipeTrak Changelog

All notable changes to the PipeTrak project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [August 8, 2025] - Drawing-Centric Component Management UI Complete

### Added
- **Drawing-Centric Navigation** - Components now grouped by drawing across all views
  - `DrawingGroup` component for desktop with embedded Excel-like tables
  - `MobileDrawingGroup` component with collapsible cards for mobile
  - Automatic grouping by drawing number with statistics
  - Expand/collapse functionality with localStorage persistence
  
- **Mobile Optimization** - Production-ready mobile interface
  - `MobileComponentCard` with swipe gestures (right to select, left to update)
  - Touch-optimized UI with 44x44px minimum touch targets
  - Sticky header with search and bulk actions
  - Visual swipe indicators showing action feedback
  
- **Bulk Operations** - `BulkUpdateModal` for batch updates
  - Field selection system - only update selected fields
  - Support for status, area, system, test package updates
  - Progress indicator during bulk operations
  - Works on both mobile and desktop views

### Fixed
- React hooks order violation when using conditionals
- Indeterminate checkbox prop warning with custom implementation
- Component table performance with virtual scrolling optimization

### Technical Notes
- Implemented drawing-level statistics (completion %, status counts)
- Color-coded visual hierarchy (green=complete, blue=in-progress, gray=not started)
- Separate selection state management for mobile vs desktop
- Column reordering with drag-and-drop persisted to localStorage

---

## [January 9, 2025] - Component Management UI Initial Implementation

### Added
- Component list view with data fetching from API
- Component detail page routing structure
- Server-side data fetching with proper authentication
- Basic ComponentTable with TanStack Table integration
- Column reordering with native HTML5 drag-and-drop

### Fixed
- Next.js 15 async params compatibility across all PipeTrak pages
- CUID validation errors in API endpoints (now accepts both CUID and CUID2)
- Authentication header forwarding in server components using getServerApiClient
- API response structure mismatch for paginated data

### Technical Notes
- Updated all PipeTrak pages to use `Promise<params>` type for Next.js 15
- Removed strict `.cuid()` validation from Zod schemas in API routes
- Implemented proper server-side API client with header forwarding

---

## [0.1.0] - Phase 1: Foundation & Architecture - 2024-01-08

### Summary
Completed foundational architecture and UI components for PipeTrak industrial construction pipe tracking system. Established database schema design, type system, and core React components following Supastarter/Supabase patterns.

### Added

#### Architecture & Planning
- **Database Schema Design** - Comprehensive schema documentation in `architecture-output.md`
  - Project, Drawing, Component, and Milestone tables
  - Three workflow types: discrete (checkbox), percentage, and quantity
  - ROC (Rules of Credit) calculation system
  - Import job and audit log tables
  - Performance optimization strategies with indexes and partitioning plans

- **Product Requirements Document** - Complete PRD in `prd.md`
  - User roles: Foreman (field) and Project Manager (office)
  - Milestone-based workflow definitions
  - Component type to workflow mapping
  - Excel-like table UX standards
  - Performance requirements (<2s load times)

#### Project Structure
- **Module Organization** - `/modules/pipetrak/` directory structure
  ```
  modules/pipetrak/
  ├── components/     # Feature components
  ├── drawings/       # Drawing management
  ├── import/        # Import system
  ├── reports/       # Reporting features
  ├── shared/        # Shared components
  └── types.ts       # Type definitions
  ```

- **Routing Structure** - PipeTrak section in Next.js app router
  ```
  app/(saas)/app/pipetrak/
  ├── [projectId]/
  │   ├── components/
  │   ├── drawings/
  │   ├── import/
  │   └── reports/
  ├── layout.tsx
  └── page.tsx
  ```

#### Type System
- **Comprehensive TypeScript Types** (`types.ts`)
  - Component, Drawing, Project, MilestoneDefinition interfaces
  - Workflow enums: MilestoneStatus, ImportJobStatus
  - API response types with error handling
  - Filter and pagination types
  - Form data and bulk edit payload types

#### UI Components
- **DataTable Component** (`shared/components/DataTable.tsx`)
  - Excel-like functionality with keyboard navigation
  - Multi-column sort and filter
  - Inline editing capabilities
  - Column resize/reorder
  - Mobile responsive design
  - Built with @tanstack/react-table

- **State Components**
  - LoadingState - Consistent loading UI with spinner
  - EmptyState - No-data scenarios with actionable prompts
  - SuccessState - Success feedback with customizable messages

- **ComponentTable** (`components/ComponentTable.tsx`)
  - Specialized table for component management
  - Progress visualization with ROC percentages
  - Filter by discipline, area, milestone status
  - Bulk selection and operations

- **FileUpload Component** (`import/FileUpload.tsx`)
  - Drag-and-drop file upload
  - Excel/CSV file type validation
  - Upload progress tracking
  - Error state handling

### Technical Decisions

#### Architecture Choices
1. **Extend Supastarter Schema** - Build on existing User/Organization tables rather than replacing
2. **Three Workflow Types** - Support discrete, percentage, and quantity-based milestone tracking
3. **Client-Server State Split** - Use Tanstack Query for server state, local state for UI
4. **Mobile-First Design** - 44px minimum touch targets, responsive layouts

#### Technology Stack
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **UI Library**: Shadcn UI with Radix UI primitives
- **Styling**: Tailwind CSS with custom theme
- **Database**: Supabase (PostgreSQL) with Prisma ORM
- **State Management**: Tanstack Query for server state
- **Authentication**: Better-auth (Supastarter integration)
- **Validation**: Zod schemas throughout

#### Performance Strategies
- Virtual scrolling for large datasets (10,000+ rows)
- Cursor-based pagination for API endpoints
- Database indexing on filter columns
- Lazy loading for non-critical components
- Image optimization with Next.js Image

### File Structure Created

```
apps/web/
├── app/(saas)/app/pipetrak/      # PipeTrak routes
├── modules/pipetrak/              # PipeTrak modules
│   ├── components/
│   │   ├── ComponentTable.tsx
│   │   └── index.ts
│   ├── drawings/
│   │   └── index.ts
│   ├── import/
│   │   ├── FileUpload.tsx
│   │   └── index.ts
│   ├── reports/
│   │   └── index.ts
│   ├── shared/components/
│   │   ├── DataTable.tsx
│   │   ├── EmptyState.tsx
│   │   ├── LoadingState.tsx
│   │   ├── SuccessState.tsx
│   │   └── index.ts
│   ├── index.ts
│   └── types.ts
└── project-documentation/
    ├── architecture-output.md     # Database schema design
    ├── prd.md                    # Product requirements
    ├── build-plan.md             # Phase roadmap
    ├── agent-usage-playbook.md   # AI agent prompts
    ├── dev-runbook.md           # Development commands
    └── changelog.md             # This file
```

### Dependencies Added
- `@tanstack/react-table`: ^8.21.3 - Data table functionality
- `react-dropzone`: ^14.3.8 - File upload handling
- Already present in Supastarter:
  - Shadcn UI components
  - Radix UI primitives
  - Tanstack Query
  - Zod validation

### Known Issues
- Import system needs Excel parsing library (xlsx or similar)
- Virtualization for large tables not yet implemented
- Offline capability planning needed for field use
- RLS policies deferred to Phase 5

### Next Steps (Phase 2)
1. Implement Prisma schema with PipeTrak tables
2. Create Supabase RPC functions for ROC calculations
3. Build API endpoints using Hono
4. Implement business logic layer
5. Add authentication and basic security

### Contributors
- Architecture Design: Tech Lead
- UI Components: Frontend Team
- Documentation: Product Team

### Notes
- All components follow Supastarter conventions
- Mobile-first approach for field usability
- Excel-like UX for user familiarity
- Performance targets established (<2s load, <500ms save)

---

## [Unreleased] - Phase 2: Database & API (In Progress)

### Planned
- Prisma schema implementation
- Supabase RPC functions
- API endpoints with Hono
- Business logic layer
- Data validation with Zod
- Basic authentication (no RLS)
- Seed data generation
- Integration testing suite

---

## Version History

- **v0.1.0** - Phase 1: Foundation & Architecture (Current)
- **v0.2.0** - Phase 2: Database & API (Planned)
- **v0.3.0** - Phase 3: Core Features (Planned)
- **v0.4.0** - Phase 4: Advanced Features (Planned)
- **v1.0.0** - Phase 5: Production Release (Planned)

---

*For detailed phase planning, see [build-plan.md](./build-plan.md)*