# PipeTrak Reporting Module - Product Requirements Specification

## Executive Summary

### Elevator Pitch
Excel-quality reporting with real-time field data, giving PMs instant visibility into project progress without the spreadsheet juggling.

### Problem Statement
Project Managers currently spend 4-6 hours weekly manually compiling progress reports from multiple Excel sheets, with data that's already 2-3 days stale. Field updates don't reach reports until the weekly compilation, creating blind spots that risk schedule slippage and test package delays.

### Target Audience
- **Primary**: Project Managers (desktop/laptop, office environment)
- **Secondary**: Field Engineers (tablet/laptop, site office)
- **Tertiary**: Foremen (mobile/tablet, quick field reference)

### Unique Selling Proposition
Drawing-first progress tracking with ROC-weighted milestone credits, delivering Excel-familiar reports that auto-update with every field entry, eliminating the Friday report scramble.

### Success Metrics
- ≤5 seconds report generation for 100k components
- ≤30 seconds Excel export for 1M rows
- ≥95% PM adoption within 2 weeks (replacing manual Excel reports)
- ≤1% discrepancy between field updates and report visibility
- ≥90% reduction in weekly reporting effort (from 6 hours to 30 minutes)

---

## Feature Specifications

### Feature 1: Progress Summary Report with ROC Calculations

#### User Stories
- **As a PM**, I want to see overall project completion weighted by ROC credits, so that I can report accurate progress to stakeholders without manual calculations
- **As a Field Engineer**, I want to drill down from summary to component details, so that I can identify bottlenecks without switching screens
- **As a Foreman**, I want to see my area's progress compared to others, so that I know if we're ahead or behind schedule

#### Acceptance Criteria

**Report Generation**
- Given a project with 100k components, when requesting progress summary, then report displays within 5 seconds
- Given mixed milestone states, when calculating progress, then ROC weights are correctly applied per component type
- Given incomplete data, when generating report, then "unknown" components are excluded from percentage but shown in count

**Data Display**
- Given progress data, when viewing summary, then display shows:
  - Overall completion % (ROC-weighted and simple count)
  - Components complete/total with visual progress bar
  - Area breakdown with completion % per area
  - System breakdown with completion % per system
  - Test Package readiness summary (ready/blocked/pending)
  - Top 5 critical path items blocking completion

**Drill-Down Capability**
- Given summary view, when clicking on an area, then display filtered component list for that area
- Given system summary, when clicking percentage, then show milestone distribution chart
- Given test package status, when clicking "blocked", then list specific blocking components

**Export Functionality**
- Given report view, when exporting to PDF, then maintain formatting, charts, and company branding
- Given report view, when exporting to Excel, then create sheets for summary, areas, systems, and details
- Given large dataset, when exporting, then show progress indicator with cancel option

**Edge Cases**
- Components with no area assigned show in "Unassigned" category
- Missing ROC configurations default to standard weights with warning indicator
- Circular milestone dependencies trigger validation error
- Export files >50MB trigger download link instead of direct download

#### Priority
**P0** - Core functionality required for MVP launch

#### Dependencies
- ROCConfigurations table populated with org defaults
- ComponentMilestones table with current state data
- Dashboard functions (get_project_metrics, get_area_system_metrics) operational
- Supabase storage configured for large exports

#### Technical Constraints
- Use existing dashboard RPC functions for data retrieval
- Cache calculated values for 5 minutes using ReportingCache table
- Implement virtual scrolling for component lists >1000 rows
- Stream Excel generation for exports >100k rows

#### UX Considerations
- Sticky headers for area/system tables during scroll
- Color-coded progress bars (red <25%, yellow 25-75%, green >75%)
- Expandable/collapsible sections for mobile viewing
- Print-optimized CSS for PDF generation
- Keyboard shortcuts (Ctrl+E for export, Space to expand section)

---

### Feature 2: Detailed Component Report

#### User Stories
- **As a PM**, I want to export all component data with current status, so that I can perform custom analysis in Excel
- **As a Field Engineer**, I want to filter components by multiple criteria, so that I can create targeted work packages
- **As a Foreman**, I want to see components grouped by location, so that I can plan efficient work sequences

#### Acceptance Criteria

**Data Completeness**
- Given component query, when generating report, then include ALL fields:
  - Component ID, Drawing, Line Number, Area, System, Test Package
  - All milestone states with completion dates
  - Current % complete (ROC-weighted)
  - Last update timestamp and user
  - Notes/comments if present
  - Installation sequence/priority

**Filtering Capabilities**
- Given filter panel, when setting criteria, then support:
  - Multi-select for areas, systems, test packages
  - Date range for milestone completions
  - Completion percentage ranges
  - Component type selection
  - Text search across ID/line number/description
  - Stalled components (no updates in X days)

**Sorting & Grouping**
- Given component list, when sorting, then maintain sub-sorts (e.g., Area → System → Component)
- Given grouping option, when selected, then show collapsible groups with subtotals
- Given custom sort, when applied, then persist preference for session

**Export Formats**
- Given filtered data, when exporting to Excel, then:
  - Create separate sheets per component type if >10k rows
  - Include filter criteria in header rows
  - Apply conditional formatting for completion status
  - Add data validation for re-import capability
- Given export request >1M rows, when processing, then queue as background job with email notification

**Performance Requirements**
- Initial load ≤2 seconds for 10k virtualized rows
- Filter application ≤500ms for 100k components
- Export generation ≤30 seconds for 1M rows
- Sort operation ≤250ms client-side

**Edge Cases**
- Duplicate component IDs highlighted with warning badge
- Missing required fields shown with "MISSING" indicator
- Orphaned milestones (no parent component) listed separately
- Export interruption creates resumable download

#### Priority
**P0** - Required for PM workflow migration from Excel

#### Dependencies
- Component table with all field relationships
- Advanced filter UI components
- Background job queue for large exports
- Email service for export notifications

#### Technical Constraints
- Use server-side filtering for datasets >10k
- Implement cursor-based pagination for infinite scroll
- Stream Excel generation to prevent memory overflow
- Limit concurrent exports to 3 per user

#### UX Considerations
- Column picker for customizable views
- Freeze panes for ID/Drawing columns
- Right-click context menu for quick actions
- Inline edit for authorized users (future)
- Auto-save filter presets per user

---

### Feature 3: Test Package Readiness Report

#### User Stories
- **As a PM**, I want to see which test packages are ready for testing, so that I can coordinate with commissioning team
- **As a Field Engineer**, I want to identify components blocking test packages, so that I can prioritize completion
- **As a Foreman**, I want a mobile-friendly checklist view, so that I can verify readiness in the field

#### Acceptance Criteria

**Readiness Calculation**
- Given test package components, when calculating status, then:
  - "Ready" = 100% of components at Test milestone or beyond
  - "Nearly Ready" = ≥95% complete with list of remaining items
  - "Blocked" = <95% with critical path analysis
  - "Not Started" = <10% complete

**Blocking Component Analysis**
- Given blocked package, when viewing details, then show:
  - List of incomplete components with current milestone
  - Estimated days to completion based on velocity
  - Responsible foreman/area for each blocker
  - Priority score based on downstream dependencies

**Visual Indicators**
- Given readiness status, when displaying, then use:
  - Green checkmark for Ready packages
  - Yellow warning for Nearly Ready with count badge
  - Red X for Blocked with blocker count
  - Gray dash for Not Started

**Field-Optimized View**
- Given mobile device, when viewing report, then:
  - Single-column layout with expandable packages
  - Swipe actions for status updates
  - Offline capability with sync indicators
  - Large touch targets for gloved hands

**Export Options**
- Given report view, when exporting to PDF, then create field-ready checklist format
- Given email export, when selected, then send to distribution list with status summary
- Given Excel export, when generated, then include pivot table for management rollup

**Edge Cases**
- Components in multiple test packages counted in each
- Partial test packages (subset testing) handled separately
- Missing test package assignments shown in "Unassigned" section
- Conflicting milestone data triggers data quality alert

#### Priority
**P0** - Critical for commissioning coordination

#### Dependencies
- Test package assignment data complete
- Milestone velocity calculations available
- Mobile-responsive UI framework
- Offline storage capability

#### Technical Constraints
- Cache readiness calculations for 15 minutes
- Limit blocking analysis to 3 levels deep
- Mobile view supports devices ≥375px width
- PDF generation ≤10 seconds for 50 packages

#### UX Considerations
- Traffic light colors for instant recognition
- Expandable details without navigation
- Pin important packages to top
- Quick filter pills for status types
- Pull-to-refresh on mobile

---

### Feature 4: Trend Analysis Report

#### User Stories
- **As a PM**, I want to see progress trends over time, so that I can identify if we're accelerating or slowing down
- **As a Field Engineer**, I want to predict completion dates, so that I can communicate realistic timelines
- **As a Foreman**, I want to see my crew's productivity trend, so that I can identify training needs

#### Acceptance Criteria

**Trend Calculations**
- Given historical snapshots, when calculating trends, then show:
  - Daily/weekly/monthly completion rates
  - 7-day, 14-day, 30-day moving averages
  - Velocity by milestone type
  - Area/system-specific trends
  - Crew productivity metrics

**Forecasting**
- Given current velocity, when projecting completion, then:
  - Calculate linear projection from last 30 days
  - Show best/worst/likely scenarios
  - Include confidence intervals
  - Flag if projection exceeds target date

**Bottleneck Identification**
- Given trend data, when analyzing, then identify:
  - Milestones with declining velocity
  - Areas falling behind average
  - Stalled components (no progress in X days)
  - Resource constraints (crew bottlenecks)

**Visualization Requirements**
- Given trend data, when displaying, then show:
  - Line charts for progress over time
  - Burndown charts for remaining work
  - Stacked area charts for milestone distribution
  - Heat maps for area/day productivity
  - Gantt view for critical path

**Comparative Analysis**
- Given multiple areas/systems, when comparing, then:
  - Show side-by-side trend lines
  - Calculate relative performance indices
  - Identify top/bottom performers
  - Show variance from plan

**Export Capabilities**
- Given charts, when exporting to PDF, then maintain full resolution
- Given data, when exporting to Excel, then include raw data + pivot tables
- Given PowerPoint export, when selected, then create executive presentation format

**Edge Cases**
- Missing snapshot dates interpolated with warning
- Negative velocity (rework) shown in red
- Seasonal adjustments for weather delays
- Data quality issues flagged in footnotes

#### Priority
**P1** - High value for schedule management

#### Dependencies
- ProgressSnapshots table with 30+ days of history
- Chart.js or similar visualization library
- Statistical analysis functions
- PowerPoint generation library

#### Technical Constraints
- Calculate trends from max 90 days of data
- Limit chart points to 500 for performance
- Cache forecast calculations for 1 hour
- Support maximum 10 concurrent trend lines

#### UX Considerations
- Interactive charts with hover details
- Date range picker with presets
- Toggle between absolute/percentage views
- Export chart as image option
- Responsive design for tablet viewing

---

### Feature 5: Audit Trail Report

#### User Stories
- **As a PM**, I want to see all changes made to components, so that I can verify accurate data entry
- **As a QA Manager**, I want to track who updated what and when, so that I can ensure compliance
- **As a Foreman**, I want to see my crew's daily updates, so that I can verify work was recorded

#### Acceptance Criteria

**Change Tracking**
- Given component changes, when displaying audit trail, then show:
  - Timestamp of change (timezone-aware)
  - User who made change (name and role)
  - Field changed with before/after values
  - Change source (mobile app, web, import)
  - Related drawing/area/system context

**Filtering Options**
- Given audit data, when filtering, then support:
  - Date/time range with minute precision
  - User selection (individual or crew)
  - Component type filtering
  - Change type (milestone, status, data correction)
  - Area/system/test package filters

**Compliance Features**
- Given regulatory requirements, when generating report, then:
  - Include digital signatures/timestamps
  - Show data integrity checksums
  - Flag unauthorized changes
  - Track failed update attempts
  - Include system version info

**Summary Statistics**
- Given date range, when generating summary, then show:
  - Total changes by user
  - Changes by hour/day distribution
  - Most active components
  - Average updates per component
  - Data quality metrics (corrections vs. progress)

**Export Formats**
- Given audit data, when exporting, then provide:
  - CSV with all fields for analysis
  - PDF with pagination and headers
  - Digitally signed export for compliance
  - JSON format for system integration

**Performance Optimization**
- Given large audit dataset, when querying, then:
  - Use server-side pagination
  - Index on timestamp and user
  - Compress old audit data
  - Archive after 90 days

**Edge Cases**
- Bulk updates shown as grouped entries
- System-generated changes marked clearly
- Failed updates included with error reason
- Time zone differences handled correctly
- Deleted components retain audit history

#### Priority
**P1** - Required for compliance and QA

#### Dependencies
- Audit logging middleware in place
- User session tracking
- Timezone handling utilities
- Digital signature capability

#### Technical Constraints
- Retain audit data for minimum 7 years
- Query performance ≤3 seconds for 1M records
- Export size limit 100MB per request
- Real-time audit streaming for active monitoring

#### UX Considerations
- Timeline view for visual scanning
- Diff view for before/after comparison
- User avatars for quick recognition
- Collapsible detail rows
- Search highlighting in results

---

## PipeTrak-Specific Sections

### Milestone & Credit Definition

All reports must respect the following ROC credit rules:

#### Standard Credit Distributions
- **Full Milestones** (Spools/Piping): Receive(5%), Erect(30%), Connect(30%), Support(15%), Punch(5%), Test(10%), Restore(5%)
- **Reduced Milestones** (Valves/Supports): Receive(10%), Install(60%), Punch(10%), Test(15%), Restore(5%)
- **Threaded Pipe**: Fabricate(25%), Erect(25%), Connect(30%), Punch(5%), Test(10%), Restore(5%)
- **Insulation**: Insulate(60%), Metal Out(40%)
- **Paint**: Primer(40%), Finish Coat(60%)

#### Calculation Rules
- Progress % = Σ(Milestone % × ROC Weight) for completed milestones
- Partial milestones multiply entered % by weight
- Quantity milestones convert (completed/total) × weight
- Organization overrides take precedence over defaults

### Import Mapping Spec

Reports must handle imported data with these validations:

#### Required Columns for Report Generation
- componentId (unique identifier)
- drawingNumber (for grouping)
- projectId (for filtering)
- milestone_* columns (current state)

#### Optional Enhancement Columns
- area (for breakdown reports)
- system (for system analysis)
- testPackage (for readiness reports)
- priority (for sequencing)
- notes (for audit context)

#### Data Quality Handling
- Missing areas default to "UNASSIGNED"
- Invalid milestones logged but excluded from calculations
- Duplicate IDs flagged in data quality section
- Null values in calculations treated as zero

### Data Model Impact

#### Tables Touched by Reporting Module

**Read Operations**
- Project (context and metadata)
- Component (base data)
- ComponentMilestones (current state)
- MilestoneTemplates (ROC weights)
- Drawing (grouping and context)
- Area, System, TestPackage (categorization)

**Write Operations**
- ReportingCache (performance optimization)
- ProgressSnapshots (trend data)
- ReportGenerations (export tracking)
- AuditLog (compliance tracking)

**New Indexes Required**
```sql
CREATE INDEX idx_component_milestone_date ON "ComponentMilestones"("updatedAt", "componentId");
CREATE INDEX idx_component_area_system ON "Component"("area", "system", "projectId");
CREATE INDEX idx_audit_user_date ON "AuditLog"("userId", "timestamp", "projectId");
CREATE INDEX idx_snapshot_project_date ON "ProgressSnapshots"("projectId", "snapshotDate");
```

### Table UX Contract ("Excel-like")

All report tables must support:

#### Keyboard Navigation
- Arrow keys for cell navigation
- Tab/Shift+Tab for column movement
- Enter to expand row details
- Space to toggle selections
- Ctrl+A to select all visible
- Ctrl+C to copy selection
- Ctrl+Shift+E to export

#### Inline Interactions
- Click column header to sort
- Drag column borders to resize
- Right-click for context menu
- Double-click to auto-fit column
- Shift+click for range selection

#### Bulk Operations
- Select multiple rows with checkboxes
- Apply filters to selection
- Export selected rows only
- Bulk update capabilities (future)

#### Visual Cues
- Sticky headers during scroll
- Zebra striping for readability
- Hover highlights for rows
- Sort indicators in headers
- Filter badges showing active filters

### MVP vs Later

#### MVP Scope (Launch Required)
- All 5 report types with basic functionality
- Excel/PDF export for all reports
- ROC calculations with org defaults
- 5-minute caching strategy
- Mobile-responsive layouts
- Basic audit trail (last 90 days)

#### Post-MVP Enhancements
- Custom report builder
- Scheduled report delivery
- Advanced forecasting algorithms
- Real-time collaborative viewing
- API access for external systems
- Manhour tracking integration
- Role-based report access
- Custom ROC configurations per project
- Report templates and presets
- Automated anomaly detection

### Test Plan Seeds

#### Sample Data Requirements

**Progress Summary Test**
```csv
projectId,componentCount,completionRange,expectedROC
PROJ001,10000,0-100,67.5
PROJ002,50000,25-75,45.2
PROJ003,100000,90-100,95.8
```

**Edge Case Test Data**
- Components with circular dependencies
- Missing milestone definitions
- Duplicate component IDs
- Null area/system values
- Future-dated completions
- Negative progress scenarios

**Performance Test Data**
- 1M components across 1000 drawings
- 10k test packages with complex dependencies
- 90 days of snapshot history
- 100k audit log entries

**Export Test Scenarios**
- Single-page PDF (≤50 components)
- Multi-page PDF (10k components)
- Small Excel (1k rows)
- Large Excel (1M rows)
- Interrupted download recovery

---

## Critical Questions Checklist

☐ **Existing Workaround**: Currently using manual Excel pivots taking 6 hours weekly - we beat this with 30-minute automated reports
☐ **Immediate Value**: Progress Summary Report delivers value Day 1 by eliminating Friday report compilation
☐ **Smallest Slice**: Start with Progress Summary + Component Details only, add trending after first month of snapshots
☐ **Risks Identified**: 
  - Large dataset performance (mitigated by caching and pagination)
  - Complex ROC calculations (mitigated by database functions)
  - Excel export memory limits (mitigated by streaming)
☐ **Platform Constraints**: 
  - Supabase 25MB RPC limit (use pagination)
  - Vercel 60-second timeout (use background jobs)
  - React table virtualization for large datasets

---

## Output Standards Validation

- ✅ **Unambiguous**: Each requirement has specific metrics and thresholds
- ✅ **Testable**: All acceptance criteria include given/when/then scenarios
- ✅ **Traceable**: Requirements linked to user stories and technical architecture
- ✅ **Complete**: Covers all five report types with full specifications
- ✅ **Feasible**: Based on existing dashboard functions and Supabase capabilities

## Documentation Process Confirmation

1. **Understanding Confirmed**: Based on PipeTrak reporting module technical architecture, creating product specifications for 5 report types
2. **Assumptions**: 
   - Leveraging existing dashboard RPC functions
   - ROCConfigurations table manages credit weights
   - ReportingCache provides 5-minute TTL optimization
   - Supabase storage handles large exports
3. **Structured Planning**: Delivered complete specifications following PipeTrak format
4. **Quality Review**: Verified performance targets, Excel-like UX, and MVP scoping
5. **Final Deliverable**: Complete product specifications for reporting module implementation