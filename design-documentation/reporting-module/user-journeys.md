# User Journeys - Reporting Module

Complete user flows for each reporting scenario, mapped to PipeTrak's field-first workflows.

## Primary Users

### Project Manager (Desktop/Laptop)
- **Context**: Office environment, multiple monitors
- **Goals**: Weekly progress reports, stakeholder communication, schedule management
- **Tools**: Keyboard + mouse, dual monitors, printer access

### Field Engineer (Tablet/Laptop)
- **Context**: Site office trailer, construction environment
- **Goals**: Daily progress tracking, work package creation, bottleneck identification
- **Tools**: Tablet with keyboard, occasional gloves, variable connectivity

### Foreman (Mobile/Tablet)
- **Context**: Active construction areas, harsh conditions
- **Goals**: Quick status checks, field verification, crew coordination
- **Tools**: Mobile device, heavy gloves, limited screen time

---

## Journey 1: Weekly Progress Report Generation

**Actor**: Project Manager
**Trigger**: Monday morning stakeholder meeting preparation
**Goal**: Generate comprehensive progress report in under 30 minutes

### Current State (Manual Excel)
1. **Gather Data** (90 minutes)
   - Download latest component exports from multiple sources
   - Manual copy/paste between 5-8 Excel workbooks
   - Calculate ROC-weighted percentages manually
   - Cross-reference with test package lists

2. **Create Report** (120 minutes)
   - Build pivot tables for area/system breakdown
   - Generate charts and formatting
   - Add narrative sections and highlights
   - Quality check calculations

3. **Distribute** (30 minutes)
   - Export to PDF
   - Email to stakeholder list
   - Upload to project SharePoint

**Total Time**: 4 hours
**Pain Points**: Data staleness (2-3 days old), manual errors, formatting inconsistencies

### Future State (PipeTrak Reporting)

#### Phase 1: Report Access
1. **Navigate to Reports** (10 seconds)
   - Click "Reports" in main navigation
   - Reports landing page loads with recent reports visible
   - See "Weekly Progress" saved template

2. **Initiate Report Generation** (5 seconds)
   - Click "Generate" on Weekly Progress template
   - System begins processing with progress indicator
   - Real-time data pulled from current component states

#### Phase 2: Review and Customize
3. **Review Generated Report** (2 minutes)
   - Progress Summary loads showing:
     - Overall ROC-weighted completion: 67.3%
     - Area breakdown with red/yellow/green indicators
     - Test package readiness: 12 ready, 8 blocked, 15 in progress
     - Top 5 critical path blockers

4. **Drill Down on Issues** (3 minutes)
   - Click "8 blocked" test packages
   - See detailed blocking component list
   - Note bottlenecks in Area C piping connections
   - Add narrative notes in report builder

#### Phase 3: Export and Distribute
5. **Generate Stakeholder Formats** (2 minutes)
   - Click "Export" dropdown
   - Select "Executive PDF + Detailed Excel"
   - Choose "Include ROC calculations" and "Add forecast"
   - System generates files with progress bar

6. **Distribute Report** (1 minute)
   - PDF automatically opens in new tab for review
   - Click "Email Distribution List"
   - Add custom message: "Note delays in Area C connections"
   - Send with one-click to predefined stakeholder list

**Total Time**: 8 minutes
**Benefits**: Real-time data, automated calculations, consistent formatting, built-in distribution

---

## Journey 2: Bottleneck Investigation

**Actor**: Field Engineer
**Trigger**: PM reports Area C falling behind schedule
**Goal**: Identify root cause and create targeted work packages

### User Flow

#### Phase 1: Problem Identification
1. **Access Trend Analysis** (15 seconds)
   - Open PipeTrak on tablet in site office
   - Navigate to Reports > Trend Analysis
   - Set filter to "Area C" and "Last 30 days"

2. **Analyze Velocity Trends** (1 minute)
   - View line chart showing declining completion rate
   - Notice drop from 45 components/day to 28 components/day
   - Heat map shows "Connect" milestone as primary bottleneck
   - 67% of stalled components are at "Connect" stage

#### Phase 2: Root Cause Analysis
3. **Drill Down to Components** (30 seconds)
   - Click "Connect bottleneck" in heat map
   - Filter switches to Component Report view
   - Shows 234 components stalled at Connect milestone
   - Sort by "Days stalled" - some components 14+ days

4. **Identify Patterns** (1 minute)
   - Group by "System" - Cooling Water system shows 78% of stalls
   - Check "Responsible Crew" - Crew 3 handling majority of stalled items
   - Note common component types: Large bore pipe connections

#### Phase 3: Action Planning
5. **Create Work Package** (2 minutes)
   - Select stalled cooling water components
   - Click "Export Selected" > "Field Work Package"
   - Generate PDF with:
     - Component locations on drawing references
     - Required materials/tools checklist
     - Estimated manhours based on similar completions

6. **Coordinate Response** (30 seconds)
   - Print work packages on site office printer
   - Send copy to Crew 3 foreman via email
   - Create follow-up reminder in calendar

**Total Time**: 5 minutes
**Outcome**: Specific actionable work packages with clear priorities

---

## Journey 3: Field Verification (Mobile)

**Actor**: Foreman
**Trigger**: Daily crew assignment and progress verification
**Goal**: Verify test package readiness and update component status

### User Flow

#### Phase 1: Quick Status Check
1. **Access Test Package Status** (20 seconds)
   - Open PipeTrak mobile app on phone
   - Tap "Reports" tab in bottom navigation
   - Tap "Test Packages" card showing "3 Ready, 2 Near Ready"

2. **Review Ready Packages** (1 minute)
   - See green checkmarks for packages TP-001, TP-003, TP-007
   - Yellow warning on TP-002 shows "2 components remaining"
   - Red X on TP-005 shows "12 components blocking"
   - Tap yellow TP-002 to see details

#### Phase 2: Component Verification
3. **Verify Near-Ready Package** (2 minutes)
   - TP-002 detail view shows 2 remaining components:
     - CV-1401 needs "Test" milestone completion
     - FV-1205 needs "Connect" milestone completion
   - Both assigned to current crew
   - Tap CV-1401 to view component details

4. **Update Component Status** (30 seconds)
   - CV-1401 shows current status: "Connect complete, Test pending"
   - Crew member confirms test completed yesterday
   - Tap "Test" milestone > "Mark Complete"
   - Add note: "Pressure test passed 150 PSI"
   - Save with current timestamp and crew signature

#### Phase 3: Progress Tracking
5. **Check Progress Impact** (15 seconds)
   - Return to test package view
   - TP-002 now shows "1 component remaining"
   - Overall package count updates to "3 Ready, 1 Near Ready"
   - Push notification sent to PM about progress

6. **Plan Next Actions** (1 minute)
   - FV-1205 requires connection completion
   - Check component location on integrated drawing view
   - Assign to crew member with location noted
   - Set reminder for end-of-shift verification

**Total Time**: 5 minutes
**Benefits**: Real-time updates, clear action items, automatic PM notification

---

## Journey 4: Audit Trail Investigation

**Actor**: QA Manager
**Trigger**: Client inquiry about specific component completion dates
**Goal**: Generate compliance documentation within 10 minutes

### User Flow

#### Phase 1: Access Audit Data
1. **Navigate to Audit Reports** (10 seconds)
   - Open PipeTrak web interface
   - Click "Reports" > "Audit Trail"
   - Advanced filter panel loads with multiple criteria

2. **Set Investigation Parameters** (30 seconds)
   - Component ID filter: "HX-2301" (heat exchanger in question)
   - Date range: "Last 90 days"
   - Change type: "All milestone updates"
   - User filter: "All users"

#### Phase 2: Review Change History
3. **Analyze Timeline** (2 minutes)
   - Chronological list shows 8 updates over 45 days
   - Each entry shows: timestamp, user, field changed, before/after values
   - Digital signatures visible for critical milestones
   - Notice "Test" milestone completed by J. Smith on 2023-10-15 14:30

4. **Verify Compliance** (1 minute)
   - "Test" completion includes required signature
   - Pressure test data attached: 165 PSI recorded
   - Quality inspection sign-off from certified inspector
   - No unauthorized changes or corrections detected

#### Phase 3: Documentation Generation
5. **Generate Compliance Report** (1 minute)
   - Click "Export Audit Trail"
   - Select "Compliance Format with Digital Signatures"
   - Include "Component photos and test data"
   - Generate digitally signed PDF

6. **Deliver Documentation** (30 seconds)
   - PDF includes complete audit trail with timestamps
   - Digital signatures and certificates embedded
   - Email directly to client with read receipt
   - Archive copy in project compliance folder

**Total Time**: 5 minutes
**Outcome**: Compliance-ready documentation with full audit trail

---

## Success Metrics

### Time Savings
- **Weekly reporting**: 4 hours → 8 minutes (96% reduction)
- **Bottleneck investigation**: 45 minutes → 5 minutes (89% reduction)
- **Field verification**: 15 minutes → 5 minutes (67% reduction)
- **Audit documentation**: 30 minutes → 5 minutes (83% reduction)

### Quality Improvements
- **Data freshness**: 2-3 days old → Real-time
- **Calculation accuracy**: Manual errors → Automated validation
- **Report consistency**: Variable formatting → Standardized templates
- **Audit completeness**: Partial tracking → Complete digital trail

### User Satisfaction
- **PM adoption target**: 95% within 2 weeks
- **Field user engagement**: Daily active usage
- **Error reduction**: <1% discrepancy vs manual methods
- **Stakeholder confidence**: Improved schedule predictability

---

## Edge Case Scenarios

### Connectivity Issues
- **Offline mode**: Cached data with sync indicators
- **Slow connections**: Progressive loading with skeleton states
- **Failed uploads**: Retry mechanisms with queue management

### Data Quality Issues
- **Missing components**: Clear indicators with "Add Missing" actions
- **Conflicting updates**: Merge conflict resolution interface
- **Stale calculations**: Auto-refresh with change notifications

### Scale Challenges
- **Large exports**: Background processing with email delivery
- **Complex filters**: Server-side processing with progress indicators
- **High concurrency**: Optimistic UI with eventual consistency

### Permission Scenarios
- **Limited access**: Filtered views based on user roles
- **Audit requirements**: Immutable logs with retention policies
- **Client visibility**: Sanitized reports with appropriate data masking
