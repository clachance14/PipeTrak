# PipeTrak Phase 3: Core Features Implementation - Product Specifications

**Version:** 1.0  
**Date:** January 8, 2025  
**Product Manager:** Claude (PM Role)  
**Phase:** 3 - Core Features Implementation  
**Prerequisites:** Phase 2 Backend Complete (APIs, Database, Supabase Functions)

---

## Executive Summary

### Elevator Pitch
Replace Excel with a construction-native tracking system that lets foremen update pipe installation from their phones while PMs see real-time progress on dashboards.

### Problem Statement
Field crews waste 30+ minutes daily re-entering paper notes into Excel. PMs wait until Friday for progress reports. Nobody trusts the data because five different spreadsheets show different numbers.

### Target Audience
- **Primary**: Foremen with tablets checking off installed components in 100°F field conditions
- **Secondary**: Project Managers on laptops analyzing progress for weekly client reports
- **Tertiary**: Field Engineers importing IFC drawing data and correcting field discrepancies

### Unique Selling Proposition
Drawing-first navigation + milestone credit calculation + Excel-speed editing = construction teams actually use it.

### Success Metrics
- ≤2% import error rate on 100k-row files
- ≤1.0s component list load (10k virtualized rows)
- ≥95% component coverage after initial import
- ≤250ms milestone update commit time
- ≥80% daily active foremen after 2 weeks

---

## Feature Specifications

### Feature 1: Component Management UI

**User Story**: As a field engineer, I want to view and edit components like Excel, so that adoption doesn't require retraining.

**Acceptance Criteria**:
- Given 10,000 components, when I load the list, then virtualized rows display in ≤1.5s
- Given I'm editing a cell, when I press Tab, then focus moves to next cell with data saved
- Given I select 50 rows, when I bulk update area, then all rows update in ≤2s
- Given I filter by ISO "P-35F11", when results load, then only matching components show
- Given I'm on mobile, when I tap a row, then detail view opens with touch-friendly buttons
- Given bad data entry, when I save, then inline validation shows specific error
- Given I paste from Excel, when data validates, then cells populate maintaining structure

**Edge Cases**:
- Duplicate component IDs show warning but allow save
- Missing ISO drawings highlight in yellow with "Drawing Not Found" badge
- Offline edits queue with conflict resolution on reconnect
- Empty test package/area/system allowed but flagged
- Special characters in component IDs preserved exactly

**Priority**: P0 - Core functionality required for any field use

**Dependencies**: 
- Component API endpoints (GET /api/pipetrak/components with filters)
- Drawing lookup table for validation
- User session for audit trail
- Virtual scroll library (TanStack Virtual)

**Technical Constraints**:
- Max 10k rows rendered (paginate beyond)
- 50MB browser memory limit for data cache
- Debounce saves to 500ms
- Batch API calls in groups of 100

**UX Considerations**:
- Sticky header with filters always visible
- Column freeze for componentId and description
- Keyboard shortcuts: Ctrl+S save, Ctrl+Z undo, Ctrl+C/V copy/paste
- Row height 44px minimum for touch
- Loading skeleton shows during data fetch
- Toast notifications for save success/failure

---

### Feature 2: Milestone Update System

**User Story**: As a foreman, I want to quickly update component milestones from my phone, so that progress is captured in real-time.

**Acceptance Criteria**:
- Given discrete workflow, when I tap checkbox, then milestone toggles with haptic feedback
- Given percentage workflow, when I enter "75", then progress bar updates to 75%
- Given quantity workflow, when I enter "150 ft", then system calculates % based on total
- Given I complete final milestone, when saved, then component status becomes "COMPLETED"
- Given another user updated, when I refresh, then latest values show with "Updated by" note
- Given bulk selection, when I mark "Received", then all selected components update
- Given I undo an update, when confirmed, then milestone reverts with audit entry

**Edge Cases**:
- Can't complete milestone 3 if milestone 2 incomplete (for sequential workflows)
- Over 100% entry shows error "Maximum 100%"
- Negative values rejected with inline error
- Concurrent updates show conflict dialog
- Test milestone requires test package assignment

**Priority**: P0 - Primary field interaction point

**Dependencies**:
- Milestone update API (PUT /api/pipetrak/milestones/batch)
- Component workflow type definitions
- Milestone templates with ROC weights
- User authentication for completedBy field

**Technical Constraints**:
- Optimistic UI updates with rollback on failure
- Queue updates when offline (localStorage)
- Max 100 components per bulk update
- Debounce percentage inputs to 1s

**UX Considerations**:
- Checkbox size 44x44px minimum
- Percentage input with slider for touch
- Quantity input with unit selector dropdown
- Progress rings show visual completion
- Color coding: gray=pending, blue=in progress, green=complete
- Swipe gestures for quick navigation between components

---

### Feature 3: ISO Drawing Navigation

**User Story**: As a PM, I want to navigate drawings hierarchically, so that I can drill from area ISOs to spool details.

**Acceptance Criteria**:
- Given project has 100 ISOs, when I load drawing list, then tree view shows with counts
- Given I search "P-35F", when typing, then autocomplete suggests "P-35F11", "P-35F12"
- Given I click ISO "P-35F11", when it loads, then component list filters to that ISO
- Given ISO has child spools, when I expand, then "SP-1234", "SP-1235" appear indented
- Given I'm on component, when I click "View on ISO", then drawing viewer opens
- Given drawing has 0 components, when listed, then shows with "Empty" badge

**Edge Cases**:
- Orphaned components (no ISO) appear under "Unassigned" section
- Deleted ISOs preserve component data with warning
- Circular parent references blocked with validation
- ISO number changes cascade to components
- Large drawings (>1000 components) show count with warning

**Priority**: P0 - Core navigation paradigm

**Dependencies**:
- Drawing API with parent/child relationships
- Component counts per drawing (aggregated)
- Drawing metadata (revision, title)
- Tree view component library

**Technical Constraints**:
- Lazy load child nodes on expand
- Cache expanded state in sessionStorage
- Max depth 5 levels (ISO → Spool → Sub-assembly)
- Virtual scroll for >100 drawings

**UX Considerations**:
- Indent child drawings 24px per level
- Icons differentiate ISO/Spool/GA types
- Component count badges right-aligned
- Search highlights matching text
- Breadcrumb shows current path
- Mobile: collapsible sidebar with hamburger menu

---

### Feature 4: Project Dashboard

**User Story**: As a project manager, I want to see overall progress and trends, so that I can report to clients weekly.

**Acceptance Criteria**:
- Given project has 402 milestones, when dashboard loads, then overall % shows in ≤2s
- Given I select "Area 401", when filtered, then charts update to show only that area
- Given last 7 days activity, when timeline loads, then shows who updated what
- Given I click "Export", when processing, then Excel downloads with all visible data
- Given poor connection, when loading, then cached data shows with "Offline" badge
- Given I select date range, when applied, then ROC curve shows progress over time

**Edge Cases**:
- Zero progress shows "Not Started" vs error
- Future-dated milestones excluded from % 
- Deleted components removed from calculations
- Test packages without components show 0%
- Excel export >65k rows splits to multiple sheets

**Priority**: P0 - Executive visibility required

**Dependencies**:
- Progress calculation RPC functions
- Audit log for activity timeline
- Excel export library (ExcelJS)
- Charting library (Recharts)
- Component aggregation queries

**Technical Constraints**:
- Dashboard data cached 5 minutes
- Calculations done server-side (RPC)
- Max 10k points on charts
- Export limited to 100k rows

**UX Considerations**:
- Cards for key metrics (total %, components, milestones)
- Donut charts for area/system breakdown
- Line chart for ROC curve
- Activity timeline with user avatars
- Responsive grid layout (mobile stacks vertical)
- Print-friendly CSS for reports

---

### Feature 5: Import System

**User Story**: As a field engineer, I want to import IFC data from Excel, so that initial setup takes hours not weeks.

**Acceptance Criteria**:
- Given 50MB Excel file, when uploaded, then parsing begins with progress bar
- Given columns don't match, when mapping screen shows, then I can drag columns to match
- Given 1000 rows with 10 errors, when validated, then error report shows row numbers
- Given I fix mappings, when I retry, then validation reruns without re-upload
- Given import succeeds, when complete, then summary shows "990 imported, 10 skipped"
- Given duplicate component IDs, when detected, then options show: skip/update/create new

**Edge Cases**:
- Files >100MB rejected with size error
- Non-Excel formats (.txt) show format error
- Missing required columns block import
- ISO numbers not in system highlighted for review
- Special characters preserved (don't sanitize)
- Empty rows ignored without error
- Partial success commits good rows

**Priority**: P0 - Cannot start project without data import

**Dependencies**:
- File upload API with streaming
- Excel parser (SheetJS)
- Import job queue system
- Column mapping storage
- Validation rule engine

**Technical Constraints**:
- Client-side parsing for <10MB files
- Server-side parsing for larger files
- Max 100k rows per import
- Chunked processing (1000 rows/batch)
- WebSocket for progress updates

**UX Considerations**:
- Drag-drop upload zone
- Column mapping with preview
- Validation errors in scrollable table
- Row-level error details on hover
- Sample template download link
- Progress bar with row counter
- Success notification with summary

---

### Feature 6: Mobile Field Interface

**User Story**: As a foreman, I want to update components from my phone in the field, so that progress is captured immediately.

**Acceptance Criteria**:
- Given I'm on 4G, when I load component list, then data appears in ≤3s
- Given I have gloves on, when I tap milestone, then 44x44px target registers
- Given sun glare, when viewing, then high contrast mode maintains readability
- Given I lose connection, when I update, then changes queue with sync icon
- Given I search "GA-401", when typing, then results filter as I type
- Given battery at 10%, when active, then reduced animations save power

**Edge Cases**:
- Offline mode shows cached data with warning
- Sync conflicts show both versions for choice
- Large lists (>1000) prompt for filter
- Session timeout redirects to login
- Background sync when app minimized

**Priority**: P0 - Field adoption critical

**Dependencies**:
- PWA service worker for offline
- IndexedDB for local storage
- Touch gesture library
- Responsive CSS framework
- Push notification system (future)

**Technical Constraints**:
- Initial load <50MB
- Offline storage <100MB
- Touch targets minimum 44x44px
- Support iOS Safari 14+
- Support Android Chrome 90+

**UX Considerations**:
- Bottom tab navigation (thumb reach)
- Pull-to-refresh gesture
- Swipe between components
- Large fonts (minimum 16px)
- High contrast toggle
- Haptic feedback on actions
- Loading states for slow connections

---

## Requirements Documentation

### Functional Requirements

#### User Flows

**Import Flow**:
1. Upload Excel/CSV → Parse headers → Column mapping → Validation → Error review → Fix or skip → Import → Summary

**Component Update Flow**:
1. Select ISO → Filter components → Select component → Update milestones → Auto-save → Sync indicator → Confirmation

**Dashboard Flow**:
1. Load dashboard → Select filters (area/system) → View metrics → Drill into details → Export report

#### State Management

**Client State**:
- Current filters/sort
- Selected components
- Offline queue
- Column preferences
- Expanded tree nodes

**Server State**:
- Component data
- Milestone status
- User sessions
- Import jobs
- Audit logs

**Optimistic Updates**:
- Milestone checkboxes update immediately
- Rollback on API failure
- Queue for offline sync

#### Validation Rules

**Import Validation**:
- Required: componentId, type, workflowType
- ISO format: Letter-NumberLetterNumber (e.g., P-35F11)
- Spool format: SP-Number (e.g., SP-1234)
- Line format: Size-Service-Number-Spec (e.g., 8-PG-1001-CS1)
- Workflow type must match: MILESTONE_DISCRETE | MILESTONE_PERCENTAGE | MILESTONE_QUANTITY
- Component type maps to workflow type per PRD rules

**Milestone Validation**:
- Sequential milestones enforce order
- Percentage 0-100 range
- Quantity must be positive
- Test milestone requires testPackage
- Cannot uncomplete if later milestone complete

#### Integration Points

**Supabase Tables**:
- Component: Main data table
- ComponentMilestone: Progress tracking
- Drawing: ISO hierarchy
- MilestoneTemplate: ROC definitions
- ImportJob: Import status
- AuditLog: Change history

**API Endpoints**:
- GET /api/pipetrak/components (list/filter)
- PUT /api/pipetrak/components/:id (update)
- PUT /api/pipetrak/milestones/batch (bulk update)
- GET /api/pipetrak/drawings (hierarchy)
- POST /api/pipetrak/import (upload)
- GET /api/pipetrak/progress (dashboard)

**RPC Functions**:
- calculate_project_progress()
- get_component_summary()
- process_import_batch()

---

### Non-Functional Requirements

#### Performance Targets

**Page Load**:
- Component list: ≤1.5s (10k virtualized)
- Dashboard: ≤2.0s (with charts)
- ISO tree: ≤1.0s (lazy loaded)
- Search results: ≤500ms

**Data Operations**:
- Single save: ≤250ms
- Bulk update (100): ≤2s
- Import parse (10k): ≤10s
- Excel export (10k): ≤5s

**Mobile Performance**:
- First paint: ≤2s on 4G
- Interaction: ≤100ms response
- Offline sync: ≤30s on reconnect

#### Scalability

**Data Limits**:
- 1M components per project (Phase 0 goal)
- 10k components per ISO
- 100k rows per import
- 1000 concurrent users

**Implementation**:
- Database indexes on all filter columns
- Pagination with cursor-based navigation
- Virtual scrolling for long lists
- Server-side filtering/sorting
- CDN for static assets
- Queue system for imports

#### Security

**MVP Approach**:
- Authentication required (better-auth)
- All users see all data
- UI-based role checking
- Audit log all changes
- HTTPS only

**Future RLS**:
- Row-level security by project
- Role-based permissions
- Field vs office features
- Organization isolation

#### Accessibility

**WCAG AA Compliance**:
- Keyboard navigation
- Screen reader labels
- Color contrast 4.5:1
- Focus indicators
- Error announcements
- Alternative text

---

### User Experience Requirements

#### Information Architecture

```
Project (SDO Tank)
├── Dashboard
│   ├── Progress Cards
│   ├── Area Breakdown
│   ├── System Progress
│   └── Recent Activity
├── ISOs
│   ├── ISO List (P-35F11, etc)
│   │   └── Components
│   │       └── Milestones
│   └── Spool List (SP-1234, etc)
│       └── Components
├── Components
│   ├── List View (filterable)
│   ├── Detail View
│   └── Bulk Edit
├── Import
│   ├── Upload
│   ├── Mapping
│   └── Jobs
└── Reports
    └── Export
```

#### Progressive Disclosure

**Default View**: Simple list with key fields
**Advanced**: Show via "More" button:
- Additional filters
- Bulk operations
- Audit history
- Custom fields

#### Error Prevention

**Import Templates**:
- Download sample with headers
- Required columns marked
- Format examples in header row
- Validation before commit

**Data Entry**:
- Dropdown for known values
- Auto-complete for ISOs
- Format hints in placeholders
- Confirm dialogs for destructive actions

#### Feedback Patterns

**Success**:
- Green toast (top-right)
- Checkmark animation
- Progress bar completion
- Updated count badges

**Errors**:
- Red inline messages
- Specific error details
- Suggested fixes
- Retry options

**Loading**:
- Skeleton screens
- Progress bars with counts
- Spinning indicators
- "Loading..." text for screen readers

---

## PipeTrak-Specific Sections

### Milestone & Credit Definition

#### Component Type Mappings

| Component Type | Workflow Type | Milestone Set | Credit Rules |
|---|---|---|---|
| Spool | MILESTONE_DISCRETE | Full (7 milestones) | 5/30/30/15/5/10/5 |
| Piping (footage) | MILESTONE_QUANTITY | Full (7 milestones) | Quantity-based |
| Support | MILESTONE_DISCRETE | Reduced (5) | 10/60/10/15/5 |
| Valve | MILESTONE_DISCRETE | Reduced (5) | 10/60/10/15/5 |
| Gasket | MILESTONE_DISCRETE | Reduced (5) | 10/60/10/15/5 |
| Threaded Pipe | MILESTONE_PERCENTAGE | Threaded (6) | 25/25/30/5/10/5 |
| Field Weld | MILESTONE_DISCRETE | Reduced (5) | 10/60/10/15/5 |
| Insulation | MILESTONE_QUANTITY | Two-step (2) | 60/40 |
| Instrument | MILESTONE_DISCRETE | Reduced (5) | 10/60/10/15/5 |
| Paint | MILESTONE_QUANTITY | Two-step (2) | 40/60 |

#### Calculation Rules

**Discrete**: `completion% = Σ(completed milestone weights)`

**Percentage**: `completion% = Σ(milestone% × weight)`

**Quantity**: `completion% = (quantity ÷ total) × Σ(milestone weights)`

#### Special Rules

- Test milestone requires testPackage assignment
- Threaded pipe includes fabrication milestone
- Field welds count fit-up as "Received"
- Cannot exceed 100% regardless of calculation

---

### Import Mapping Spec

#### Required Columns
- `COMPONENT_ID` or `TAG` → componentId
- `TYPE` → type (maps to workflow)
- `ISO` or `DRAWING` → drawingId (lookup)

#### Optional Columns
- `SPOOL` → metadata.spoolNumber
- `LINE_NUMBER` → metadata.lineNumber
- `SPEC` → spec
- `SIZE` → size
- `MATERIAL` → material
- `AREA` → area
- `SYSTEM` → system
- `TEST_PACKAGE` or `TEST_PKG` → testPackage
- `TEST_PRESSURE` → metadata.testPressure
- `TEST_REQUIRED` → metadata.testRequired
- `DESCRIPTION` or `DESC` → description
- `LENGTH` or `QTY` → totalLength or totalQuantity
- `UNIT` → lengthUnit or quantityUnit

#### Validation Rules

**Row Level**:
- Component ID not empty
- Type maps to valid workflow
- ISO exists in Drawing table (warning if not)
- Numeric fields parse correctly
- No SQL injection attempts

**Duplicate Detection**:
- By componentId within project
- By componentId + instanceNumber within ISO
- Options: Skip, Update, Create with suffix

#### Partial Success Behavior
- Valid rows import immediately
- Invalid rows go to remediation queue
- Download error report with row numbers
- Fix and re-upload just failed rows

#### Template Notes
```
# Column headers (first row)
COMPONENT_ID, TYPE, ISO, SPOOL, LINE_NUMBER, SPEC, SIZE, AREA, SYSTEM, TEST_PKG

# Example data
GA-401-001, GASKET, P-35F11, SP-1234, 8-PG-1001-CS1, 150#, 8", Area 401, Cooling Water, TP-001
VLV-401-001, VALVE, P-35F11, , 8-PG-1001-CS1, 150# GATE, 8", Area 401, Cooling Water, TP-001
```

---

### Data Model Impact

#### Tables Modified

**Component**:
- All CRUD operations
- Bulk updates for area/system/testPackage
- Instance tracking for gaskets/supports

**ComponentMilestone**:
- Bulk updates for progress
- Completion tracking with user/timestamp

**Drawing**:
- Hierarchy navigation
- Component count aggregation

**ImportJob**:
- Status tracking
- Error collection

**AuditLog**:
- Every change logged
- Before/after values
- User and timestamp

#### Indexes Required
- component.drawingId (ISO filtering)
- component.area + system (dashboard)
- component.testPackage (test reports)
- component.componentId (search)
- componentMilestone.componentId (joins)

#### RPC Functions
- calculate_project_progress(projectId)
- get_area_summary(projectId, area)
- get_system_summary(projectId, system)
- get_test_package_summary(projectId, testPackage)
- process_import_validation(jobId, mappings)

---

### Table UX Contract ("Excel-like")

#### Keyboard Navigation
- Arrow keys: Move between cells
- Tab/Shift+Tab: Next/previous cell
- Enter: Edit mode toggle
- Esc: Cancel edit
- Ctrl+S: Save all
- Ctrl+Z: Undo
- Ctrl+A: Select all
- Ctrl+C/V: Copy/paste

#### Inline Edit Patterns
- Single click: Select row
- Double click: Edit cell
- F2: Edit current cell
- Type to replace
- Tab to save and next

#### Bulk Actions
- Checkbox column for selection
- Shift+click for range
- Ctrl+click for individual
- Actions menu for selected
- Confirmation for >10 rows

#### Filters
- Column header dropdowns
- Multi-select values
- Search within column
- Clear all option
- Save filter sets

#### Column Features
- Resize by dragging
- Reorder by dragging
- Pin/freeze columns
- Show/hide columns
- Sort ascending/descending

#### Virtual Scrolling
- Render visible +/- 5 rows
- Smooth scroll behavior
- Jump to row number
- Maintain selection on scroll

---

### MVP vs Later

#### MVP Scope (Phase 3)
- Core CRUD operations
- Basic milestone updates
- Simple dashboard
- Excel import (one-time)
- Desktop + mobile web
- Audit logging
- ISO-based navigation

#### Deferred to Phase 4+
- RLS/role permissions
- Manhour tracking
- P6 schedule integration
- Photo attachments
- Offline mobile app
- Push notifications
- Custom fields
- Advanced analytics
- Drawing viewer
- Barcode scanning
- Email reports
- API integrations

---

### Test Plan Seeds

#### Good Import CSV
```csv
COMPONENT_ID,TYPE,ISO,AREA,SYSTEM,TEST_PKG
SP-401-001,SPOOL,P-35F11,Area 401,Cooling Water,TP-001
VLV-401-001,VALVE,P-35F11,Area 401,Cooling Water,TP-001
GA-401-001,GASKET,P-35F11,Area 401,Cooling Water,TP-001
```

#### Bad Import CSV (errors)
```csv
COMPONENT_ID,TYPE,ISO,AREA
,SPOOL,P-35F11,Area 401  # Missing ID
SP-401-002,INVALID,P-99X99,Area 401  # Bad type and ISO
SP-401-003,SPOOL,P-35F11,Area401System  # Bad area format
```

#### Edge Cases
- 100k row file (performance)
- Unicode characters (preservation)
- Formula cells (extract values)
- Merged cells (reject)
- Multiple sheets (first only)
- Empty rows (skip)

#### E2E Test Flows
1. Import → Filter → Update → Export → Verify
2. Bulk select → Update area → Check dashboard
3. Mobile update → Desktop refresh → See change
4. Complete all milestones → Status = COMPLETED
5. Import duplicates → Update option → Merge data

---

## Critical Questions Answered

☑ **Which workaround are we replacing?**
Excel pivot tables with manual VBA macros that crash with >10k rows

☑ **Smallest valuable slice?**
Import ISO data → View components → Update milestones → See dashboard (4 screens)

☑ **Risks & Mitigations?**
- Risk: 100k component performance → Mitigation: Virtual scroll + pagination
- Risk: Offline field updates → Mitigation: Queue in localStorage with sync
- Risk: Bad Excel formats → Mitigation: Template + validation + error report

☑ **Platform Constraints?**
- Supastarter auth/org structure enforced
- Supabase 500MB storage limit → External for files
- Vercel 10s function timeout → Queue long imports

---

## Documentation Process Confirmation

1. **Understanding Confirmed**: Creating Phase 3 specifications for construction-focused pipe tracking with ISO-based navigation

2. **Assumptions**: 
   - Backend complete with 81 components loaded
   - Supastarter/Next.js/Supabase stack
   - Better-auth for users
   - Excel-like UX critical
   - Mobile-first for field

3. **Planning Complete**: Six core features specified with acceptance criteria, validation rules, and implementation details

4. **Quality Review**: 
   - ✓ Performance targets defined
   - ✓ Excel-like UX specified  
   - ✓ MVP scope bounded
   - ✓ Construction terminology used

5. **Deliverable**: Complete specifications ready for engineering implementation

---

*This document provides comprehensive specifications for PipeTrak Phase 3 implementation. Each feature includes testable criteria, specific validation rules, and clear UI/UX requirements that map directly to the completed backend infrastructure.*