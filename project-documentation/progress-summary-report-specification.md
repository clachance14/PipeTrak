# Progress Summary Report - Complete Specification Document

## Executive Summary

The Progress Summary Report is a critical weekly reporting tool for PipeTrak that provides project managers with ROC-weighted progress analysis for P6 schedule updates. This document captures the complete requirements, design decisions, and implementation specifications developed through collaborative brainstorming.

## Business Context

### Problem Statement
Project Managers currently spend 4-6 hours weekly manually compiling progress reports from multiple Excel sheets, with data that's already 2-3 days stale. Field updates don't reach reports until the weekly compilation, creating blind spots that risk schedule slippage.

### Solution
A automated weekly progress report that:
- Generates every Tuesday morning with data through Sunday
- Shows both cumulative progress and weekly deltas
- Exports to PDF for distribution and Excel for P6 updates
- Handles backdated entries through Tuesday 9 AM cutoff

## Report Overview

### Purpose
Weekly progress reporting for P6 schedule updates, replacing manual Excel compilation.

### Key Features
- **Fixed milestone columns**: Receive, Install, Punch, Test, Restore
- **Dual progress display**: Cumulative percentage with weekly delta in parentheses
- **Flexible grouping**: By Area (default), System, Test Package, or IWP
- **Week ending Sunday**: Industry standard reporting period
- **Tuesday 9 AM cutoff**: Grace period for weekend work entry

### Target Users
- **Primary**: Project Managers (desktop/laptop, office environment)
- **Secondary**: Field Engineers (tablet/laptop, site office)
- **Tertiary**: Foremen (data entry via mobile/tablet)

## Visual Design

### Report Layout
```
PipeTrak Progress Report
Project: S1604-070908 Acrolein 2
Week Ending: Sunday, November 24, 2024
Report Status: FINAL (Locked Nov 26, 9:00 AM)
Generated: Tuesday, Nov 26, 10:00 AM

Progress by Area:
┌─────────┬────────┬───────────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ Area    │ Budget │ Received  │ Installed │ Punched  │ Tested   │ Restored │ Total    │
├─────────┼────────┼───────────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ BL-01   │   297  │    96%    │    82%    │   74%   │   57%   │   34%    │   68%   │
│         │        │   (+5%)   │   (+8%)   │  (+2%)  |   (0%)   │   (0%)   │  (+3%)  │
├─────────┼────────┼───────────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ BL-02   │   165  │   100%   │   100%    │   92%   │   78%   │   45%    │   83%   │
│         │        │   (0%)    │  (+12%)   │  (+5%)  │  (+3%)  │   (0%)   │  (+4%)  │
├─────────┼────────┼───────────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ TOTAL   │   462  │    97%    │    88%    │   81%   │   65%   │   38%    │   74%   │
│         │        │   (+3%)   │   (+9%)   │  (+3%)  │  (+1%)  │   (0%)   │  (+3%)  │
└─────────┴────────┴───────────┴───────────┴──────────┴──────────┴──────────┴──────────┘
```

### Cell Format
- **Primary value**: Cumulative percentage (large, bold)
- **Secondary value**: Weekly delta in parentheses
- **Color coding**: Green for positive progress, gray for zero, red for negative

## Weekly Workflow

### Timeline
```
Sunday (Day 0)
├── 11:59 PM - Week ends
└── Midnight - Preliminary snapshot captured

Monday (Day 1)
├── All Day - Field crews enter weekend progress
└── 11:59 PM - Continue data entry

Tuesday (Day 2)
├── 9:00 AM - Data entry cutoff
├── 9:15 AM - Final snapshot generated
├── 10:00 AM - Reports available for review
├── 12:00 PM - Reports distributed to PMs
└── Afternoon - P6 schedule updates

Wednesday/Thursday
└── Progress meetings with accurate data
```

## Technical Specifications

### Database Schema Changes

#### ComponentMilestone Table Enhancement
```sql
-- Add effective date for backdating support
ALTER TABLE "ComponentMilestone" 
ADD COLUMN "effectiveDate" DATE DEFAULT CURRENT_DATE;

-- Index for efficient querying
CREATE INDEX idx_milestone_effective_date 
ON "ComponentMilestone"("effectiveDate", "projectId");
```

#### Enhanced ProgressSnapshots Structure
```typescript
interface EnhancedAreaBreakdown {
  area: string;
  componentCount: number;
  milestones: {
    received: number;    // Percentage
    installed: number;   // Percentage
    punched: number;     // Percentage
    tested: number;      // Percentage
    restored: number;    // Percentage
  };
  overallPercent: number;  // Simple average for MVP
}
```

### Progress Calculation Logic

#### MVP Calculation (Simple Average)
```typescript
// For MVP, use simple average of milestone percentages
function calculateOverallProgress(milestones: MilestonePercentages): number {
  const { received, installed, punched, tested, restored } = milestones;
  return (received + installed + punched + tested + restored) / 5;
}
```

#### Future ROC-Weighted Calculation
```typescript
// Future enhancement with ROC weights
function calculateROCWeightedProgress(milestones: MilestoneData[]): number {
  return milestones.reduce((total, m) => {
    return total + (m.completionPercent * m.rocWeight);
  }, 0);
}
```

### Data Entry Validation

```typescript
function validateMilestoneUpdate(effectiveDate: Date): boolean {
  const now = new Date();
  const lastSunday = getLastSunday();
  const cutoff = getTuesday9AM();
  
  // Rule 1: Cannot future date
  if (effectiveDate > now) {
    throw new Error("Cannot set completion date in the future");
  }
  
  // Rule 2: Cannot backdate beyond grace period
  if (now > cutoff && effectiveDate < lastSunday) {
    throw new Error("Cannot modify last week's data after Tuesday 9 AM");
  }
  
  // Rule 3: Cannot modify data older than 1 week
  const oneWeekAgo = new Date(lastSunday);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  if (effectiveDate < oneWeekAgo) {
    throw new Error("Cannot modify data older than 1 week");
  }
  
  return true;
}
```

## Report Generation Process

### Step-by-Step Flow

1. **Data Collection**
   - Query ComponentMilestone with effectiveDate <= weekEnding
   - Group by selected criteria (Area, System, etc.)
   - Calculate completion percentages per milestone

2. **Delta Calculation**
   - Retrieve previous week's snapshot
   - Calculate differences for each metric
   - Format as (+X%) or (-X%)

3. **Snapshot Storage**
   - Store calculated values in ProgressSnapshots
   - Mark as FINAL after Tuesday cutoff
   - Retain for historical trending

4. **Export Generation**
   - PDF: Primary output for distribution
   - Excel: Multiple sheets for P6 import
   - CSV: Raw data export option

### Query Example
```sql
-- Get current week progress by area
SELECT 
  c.area,
  COUNT(DISTINCT c.id) as component_count,
  AVG(CASE 
    WHEN cm.milestoneName = 'Receive' AND cm.isCompleted THEN 100
    WHEN cm.milestoneName = 'Receive' THEN COALESCE(cm.percentageValue, 0)
    ELSE 0 
  END) as received_pct,
  -- Repeat for other milestones...
FROM "Component" c
JOIN "ComponentMilestone" cm ON cm."componentId" = c.id
WHERE c."projectId" = $1 
  AND cm."effectiveDate" <= $2  -- Week ending date
GROUP BY c.area
ORDER BY c.area;
```

## Export Specifications

### File Naming Convention
```
PDF:   PipeTrak_Progress_[ProjectID]_WE_[YYYY-MM-DD]_FINAL.pdf
Excel: PipeTrak_Progress_[ProjectID]_WE_[YYYY-MM-DD]_FINAL.xlsx
CSV:   PipeTrak_Progress_[ProjectID]_WE_[YYYY-MM-DD]_FINAL.csv
```

### PDF Export
- **Orientation**: Landscape
- **Font**: Sans-serif, 10pt main text, 8pt for deltas
- **Colors**: Black for main values, green/red for deltas
- **Headers/Footers**: Project info, page numbers, generation timestamp

### Excel Export Structure
- **Sheet 1**: Formatted summary (matches PDF layout)
- **Sheet 2**: Raw percentages (for P6 import)
- **Sheet 3**: Component-level detail
- **Sheet 4**: Metadata and parameters

## User Interface Requirements

### Report Configuration Screen
```
Report Configuration:
┌─────────────────────────────────────┐
│ Week Ending: [11/24/2024 ▼]        │
│                                     │
│ Group By:                           │
│ ● Area/Sub-Area                    │
│ ○ System                            │
│ ○ Test Package                      │
│ ○ IWP                               │
│                                     │
│ Options:                            │
│ ☑ Show week-over-week delta        │
│ ☑ Include zero progress items      │
│ ☑ Show subtotals                   │
│ ☑ Show grand total                 │
│                                     │
│ [Generate Report] [Export ▼]       │
└─────────────────────────────────────┘
```

### Milestone Update Form
```
┌─────────────────────────────────────────┐
│ Update Component: GSWAZ1DZZASG5331      │
│                                          │
│ [✓] Mark as Installed                   │
│                                          │
│ Work Completed: [Nov 24, 2024 ▼]        │
│                                          │
│ ⚠️ Note: Nov 17-23 locked after         │
│    Tuesday 9:00 AM                       │
│                                          │
│ [Save] [Cancel]                          │
└─────────────────────────────────────────┘
```

## Business Rules

### Data Entry Rules
1. **Current Week**: Real-time entry for current reporting period
2. **Backdating Window**: Can backdate until Tuesday 9:00 AM for previous week
3. **Hard Lock**: Previous week locked after Tuesday 9:00 AM
4. **Historical Lock**: Cannot modify data older than 1 week

### Display Rules
1. **Zero Progress**: Always show 0% items (not blank)
2. **Partial Credit**: Display all percentage values including partials
3. **Grouping**: Default to Area grouping
4. **Sorting**: Alphabetical by group name

### Calculation Rules
1. **MVP**: Simple average of five milestone percentages
2. **Future**: ROC-weighted based on component type
3. **Rounding**: Display whole percentages only
4. **Aggregation**: Weight by component count when rolling up

## Performance Requirements

- Report generation: < 5 seconds for 100k components
- Export generation: < 10 seconds for PDF/Excel
- Query performance: < 3 seconds for progress calculation
- UI responsiveness: < 500ms for filter changes

## Future Enhancements

1. **ROC-Weighted Calculations**: Replace simple average with proper credit weights
2. **Custom Milestone Names**: Allow project-specific terminology
3. **Multi-level Grouping**: Area → System → Component hierarchies
4. **Trend Analysis**: Built-in velocity and forecasting
5. **Email Distribution**: Automated report delivery
6. **Comparison Views**: Side-by-side with previous periods
7. **Mobile App**: Native mobile for field report viewing
8. **Real-time Updates**: Live progress without regeneration

## Implementation Checklist

- [ ] Add effectiveDate column to ComponentMilestone table
- [ ] Create progress calculation SQL functions
- [ ] Build report generation API endpoint
- [ ] Implement UI components for report display
- [ ] Create PDF export functionality
- [ ] Add Excel export with multiple sheets
- [ ] Implement Tuesday 9 AM cutoff logic
- [ ] Create automated snapshot job
- [ ] Add validation for backdating rules
- [ ] Build report configuration interface
- [ ] Test complete weekly workflow
- [ ] Document API endpoints
- [ ] Create user training materials

## Success Metrics

- **Timing**: Reports available by 10 AM Tuesday
- **Accuracy**: Zero discrepancies between field work and reports
- **Efficiency**: < 30 minutes from request to P6 update
- **Adoption**: 95% PM usage within 2 weeks
- **Quality**: No manual Excel manipulation required

## Appendix: Key Decisions from Brainstorming

### Decisions Made
1. **Fixed Milestones**: Start with 5 standard milestones, no auto-detection
2. **Week Ending**: Sunday (industry standard)
3. **Grace Period**: Tuesday 9:00 AM cutoff for backdating
4. **Report Timing**: Final report by Tuesday noon
5. **Primary Export**: PDF for weekly distribution
6. **Default Grouping**: By Area (most common use case)
7. **Progress Display**: Single cell with cumulative and delta
8. **MVP Calculation**: Simple average (ROC weights later)

### Deferred Features
1. Multi-project rollups
2. Threshold alerts for behind schedule
3. Milestone renaming/customization
4. Historical editing beyond 1 week
5. Approval workflows for backdated entries

---

*Document Generated: [Current Date]*
*Brainstorming Session Participants: User & Mary (Business Analyst)*
*Next Steps: Implementation phase with technical team*