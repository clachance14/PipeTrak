# PipeTrak Agent Usage Playbook

## Overview

This playbook provides ready-to-use prompts and decision trees for leveraging AI agents throughout PipeTrak development. Each phase has specific agent strategies optimized for the Supastarter/Supabase stack.

---

## Agent Selection Decision Tree

```
Start Here
    ↓
Is it architecture/planning work?
    YES → Use Architect Agent
    NO ↓
    
Is it database/schema work?
    YES → Use Database Specialist Agent
    NO ↓
    
Is it UI/React components?
    YES → Use Frontend Developer Agent
    NO ↓
    
Is it API/backend logic?
    YES → Use Backend Developer Agent
    NO ↓
    
Is it testing/QA?
    YES → Use QA Engineer Agent
    NO ↓
    
Is it documentation?
    YES → Use Technical Writer Agent
    NO → Use General Development Agent
```

---

## Phase 1: Foundation & Architecture (COMPLETED)

### Architect Agent Prompts

**Schema Design Review**
```
Review the PipeTrak database schema in architecture-output.md. We're using Supastarter with Supabase/Prisma. Validate that:
1. The schema supports three workflow types (discrete, percentage, quantity)
2. ROC calculations can be performed efficiently
3. Tables are properly indexed for million-row scale
4. The design extends (not replaces) existing Supastarter tables

Provide specific recommendations for optimization.
```

**Type System Alignment**
```
Check the TypeScript types in modules/pipetrak/types.ts against the Prisma schema. Ensure:
1. All types match database fields exactly
2. Enums are consistent between frontend and backend
3. API response types handle nullable fields correctly
4. Pagination and filter types support Excel-like operations

Generate any missing type definitions.
```

### Example from Phase 1 Implementation

**Used Prompt:**
```
Create a DataTable component for PipeTrak that provides Excel-like functionality. Requirements:
- Built with @tanstack/react-table
- Supports inline editing
- Keyboard navigation (arrow keys, tab)
- Multi-column sort and filter
- Column resize/reorder
- Mobile responsive
- Uses Shadcn UI components
- Follows Supastarter patterns

Location: modules/pipetrak/shared/components/DataTable.tsx
```

**Result:** Successfully created reusable DataTable component used throughout the application.

---

## Phase 2: Database Implementation & API Layer

### Database Specialist Agent Prompts

**Prisma Schema Extension**
```
Extend the existing Supastarter Prisma schema at packages/database/prisma/schema.prisma with PipeTrak tables. Use the architecture-output.md as reference. Include:

1. Project model linked to Organization
2. Drawing model with hierarchy support
3. Component model with three workflow types
4. ComponentMilestone model with ROC weights
5. MilestoneTemplate model for reusable milestone sets
6. ImportJob and AuditLog models

Ensure all relations are properly defined and use appropriate cascade rules.
```

**Supabase RPC Functions**
```
Create Supabase RPC functions for PipeTrak milestone calculations:

1. calculate_component_completion(component_id)
   - Handles three workflow types
   - Returns percentage 0-100
   - Updates component status

2. bulk_update_milestones(updates[])
   - Accepts array of milestone updates
   - Validates permissions
   - Returns success/error for each update

3. get_project_progress(project_id)
   - Aggregates by Area, System, Test Package
   - Calculates weighted ROC
   - Returns summary statistics

Use the function templates from architecture-output.md.
```

**Migration Scripts**
```
Generate Prisma migration for PipeTrak tables with:
1. Proper indexes for performance
2. Check constraints for data integrity
3. Default values where appropriate
4. Seed data for development (10 projects, 100 drawings, 1000 components)

Include rollback strategy and test the migration locally.
```

### Backend Developer Agent Prompts

**API Route Implementation**
```
Implement Next.js API routes for PipeTrak components using Hono and Supastarter patterns:

Location: packages/api/modules/pipetrak/

Routes needed:
- GET /api/pipetrak/components (with filters, pagination)
- GET /api/pipetrak/components/[id]
- PUT /api/pipetrak/components/[id]
- POST /api/pipetrak/milestones/update
- POST /api/pipetrak/milestones/bulk-update
- GET /api/pipetrak/progress/[projectId]

Follow existing Supastarter API patterns. Include:
- Zod validation
- Error handling
- Auth checks
- Response typing
```

**Business Logic Layer**
```
Implement ROC calculation engine at packages/api/modules/pipetrak/services/roc-calculator.ts:

Requirements:
1. Support three workflow types from PRD
2. Calculate weighted percentages based on milestone templates
3. Handle partial completion for percentage/quantity workflows
4. Update component status automatically
5. Trigger audit log entries

Include unit tests with Jest.
```

---

## Phase 3: Core Features Implementation

### Frontend Developer Agent Prompts

**Component Management UI**
```
Build the component management interface at app/(saas)/app/pipetrak/[projectId]/components/page.tsx:

Requirements:
1. Use the existing DataTable component
2. Implement inline editing for milestone updates
3. Add filters for Area, System, Test Package, Status
4. Show progress bars with ROC percentages
5. Mobile responsive with touch targets ≥44px
6. Keyboard navigation (Excel-like)

Use Tanstack Query for data fetching and Shadcn UI components.
```

**Milestone Update Interface**
```
Create milestone update components for three workflow types:

1. DiscreteWorkflow.tsx - Checkbox interface
2. PercentageWorkflow.tsx - Input with 0-100 validation
3. QuantityWorkflow.tsx - Input with unit selector

Location: modules/pipetrak/components/milestones/

Requirements:
- Real-time progress calculation
- Optimistic updates with rollback
- Bulk selection and update
- Touch-friendly for mobile
- Integrate with ComponentTable
```

**Import System UI**
```
Build Excel/CSV import interface at app/(saas)/app/pipetrak/[projectId]/import/page.tsx:

Steps:
1. FileUpload component (already scaffolded)
2. Column mapping interface
3. Validation preview with errors
4. Import progress tracking
5. Error remediation workflow

Features:
- Drag-drop file upload
- Auto-detect column headers
- Show validation errors inline
- Allow partial success commits
- Download error report
```

### Mobile Optimization Prompts

**Field Interface**
```
Optimize PipeTrak for field use on mobile devices:

1. Create mobile-specific layout at app/(saas)/app/pipetrak/mobile/
2. Simplify navigation to drawing → components → milestones
3. Large touch targets (minimum 44x44px)
4. Swipe gestures for milestone updates
5. Offline capability preparation (save to localStorage)
6. Minimize data transfer

Test on iPhone 12 mini and Samsung A52 viewport sizes.
```

---

## Phase 4: Advanced Features & Polish

### Performance Optimization Agent Prompts

**Table Virtualization**
```
Implement virtual scrolling for ComponentTable to handle 10,000+ rows:

1. Use @tanstack/react-virtual
2. Maintain Excel-like features (freeze headers, sticky columns)
3. Smooth scrolling with 60fps
4. Dynamic row height support
5. Preserve selection state during scroll

Update: modules/pipetrak/shared/components/DataTable.tsx
```

**Query Optimization**
```
Optimize Supabase queries for PipeTrak:

1. Implement cursor-based pagination
2. Add database indexes for common filters
3. Use select() to limit returned fields
4. Implement query result caching
5. Add request debouncing for search

Review and optimize all queries in packages/api/modules/pipetrak/
```

### Reporting Suite Prompts

**Report Builder**
```
Create custom report builder at app/(saas)/app/pipetrak/[projectId]/reports/page.tsx:

Features:
1. Drag-drop field selection
2. Grouping by Area/System/Test Package
3. Aggregation functions (sum, avg, count)
4. Export to Excel with formatting
5. Save report templates

Use React DnD for drag-drop and ExcelJS for export.
```

---

## Phase 5: Production Readiness

### Security Agent Prompts

**RLS Implementation**
```
Implement Row Level Security for PipeTrak in Supabase:

1. Organization-level access control
2. Project-based permissions
3. Role-based restrictions (Foreman vs PM)
4. Audit log access controls
5. API rate limiting

Update packages/database/supabase/migrations/ with RLS policies from architecture-output.md.
```

### DevOps Agent Prompts

**Production Setup**
```
Configure PipeTrak for production deployment:

1. Environment variables for production
2. Database connection pooling
3. CDN configuration for static assets
4. Error tracking with Sentry
5. Performance monitoring
6. Backup automation

Create production configuration at:
- apps/web/.env.production
- packages/database/prisma/schema.production.prisma
- vercel.json (if using Vercel)
```

---

## Common Development Patterns

### Component Creation Pattern
```
Create a new PipeTrak component following Supastarter patterns:

1. Type definitions in modules/pipetrak/types.ts
2. Component in modules/pipetrak/components/[ComponentName].tsx
3. API route in packages/api/modules/pipetrak/
4. Database query in packages/database/queries/
5. Tests in __tests__/ directory

Component: [describe the component]
Location: [specify where it should be created]
```

### API Endpoint Pattern
```
Add a new API endpoint for PipeTrak using Hono:

Route: [HTTP method] /api/pipetrak/[endpoint]
Purpose: [what it does]
Request body: [Zod schema]
Response: [TypeScript interface]
Database queries: [what tables/views]
Auth requirements: [who can access]

Follow patterns in packages/api/modules/
```

### Database Migration Pattern
```
Create a database migration for PipeTrak:

Change: [what's being added/modified]
Tables affected: [list tables]
Indexes needed: [for performance]
Data migration: [if modifying existing data]
Rollback plan: [how to undo]

Generate with: pnpm prisma migrate dev --name [migration-name]
```

---

## Testing Prompts

### Unit Test Generation
```
Generate unit tests for [component/function] using:
- Jest for backend
- React Testing Library for components
- Mock Supabase client for API tests
- Factory pattern for test data

Cover:
1. Happy path
2. Error scenarios
3. Edge cases
4. Performance bounds

Location: __tests__/[matching-path]/
```

### E2E Test Scenarios
```
Create Playwright E2E tests for PipeTrak [feature]:

Scenarios:
1. [User action] → [Expected result]
2. [Error condition] → [Error handling]
3. [Performance check] → [Under 2s]

Location: apps/web/tests/pipetrak/
Use existing Supastarter test helpers.
```

---

## Documentation Prompts

### API Documentation
```
Document the PipeTrak API endpoint:

Endpoint: [path]
Method: [GET/POST/PUT/DELETE]
Purpose: [one sentence]
Authentication: [required/optional]
Request params: [with types]
Request body: [with example]
Response: [with example]
Errors: [possible error codes]
Rate limits: [if applicable]

Format as OpenAPI spec compatible.
```

### User Guide Creation
```
Write user documentation for [PipeTrak feature]:

Audience: [Foreman/PM]
Format: Step-by-step guide
Include:
1. Purpose and benefits
2. Prerequisites
3. Step-by-step instructions
4. Screenshots (describe what to show)
5. Common issues and solutions
6. Tips for efficiency

Tone: Clear, concise, field-friendly language.
```

---

## Troubleshooting Patterns

### Debug Database Issues
```
Debug PipeTrak database issue:

Symptom: [what's happening]
Expected: [what should happen]
Error message: [if any]

Check:
1. Prisma schema sync
2. Migration status
3. RLS policies
4. Connection pool exhaustion
5. Query performance

Provide diagnostic queries and fixes.
```

### Performance Investigation
```
Investigate PipeTrak performance issue:

Page/Feature: [what's slow]
Current time: [measured time]
Target time: [goal]
Data volume: [number of records]

Analyze:
1. Database query efficiency
2. React re-renders
3. Bundle size
4. Network waterfall
5. Memory leaks

Provide specific optimizations.
```

---

## Best Practices for Agent Use

### DO's
- ✅ Always specify the exact file path
- ✅ Reference existing patterns in the codebase
- ✅ Include error handling requirements
- ✅ Specify testing requirements
- ✅ Request TypeScript types explicitly
- ✅ Ask for mobile responsiveness
- ✅ Request accessibility features

### DON'Ts
- ❌ Don't ask for generic solutions
- ❌ Don't forget to specify the tech stack
- ❌ Don't skip performance requirements
- ❌ Don't forget auth/security needs
- ❌ Don't request features outside PRD scope
- ❌ Don't skip validation requirements

---

## Quick Reference Prompts

### "Make it Like Excel"
```
Add Excel-like features to [component]:
- Keyboard navigation (arrows, Tab, Enter)
- Copy/paste support
- Multi-select with Shift/Ctrl
- Inline editing
- Undo/redo
- Column freeze
- Sort indicators
```

### "Optimize for Field Use"
```
Optimize [feature] for construction field use:
- Large touch targets (44px minimum)
- High contrast for sunlight
- Minimal data usage
- Offline capability
- Simple navigation
- Quick actions prominent
- Error recovery without data loss
```

### "Add Supastarter Auth"
```
Add authentication to [feature] using Supastarter's better-auth:
- Check user session
- Verify organization membership
- Check user role (Foreman/PM)
- Handle unauthorized access
- Add to auth middleware
```

---

*This playbook is based on Phase 1 implementation experience and Supastarter best practices. Update with new patterns as they emerge during development.*