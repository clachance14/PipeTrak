# Screen States - Reporting Module

Comprehensive definition of all UI states across the reporting module, ensuring consistent user experience during loading, error, empty, and success conditions.

## Universal State Patterns

All reporting screens follow consistent state management patterns aligned with Supastarter conventions:

### Loading States
- **Skeleton UI**: Preserve layout structure during data fetch
- **Progressive disclosure**: Load critical data first, details second
- **Cancellable operations**: Allow users to abort long-running exports
- **Progress indicators**: Show percentage complete for operations >3 seconds

### Error States
- **Graceful degradation**: Partial data display when possible
- **Actionable error messages**: Clear next steps for resolution
- **Retry mechanisms**: One-click retry for transient failures
- **Fallback content**: Cached data with staleness indicators

### Empty States
- **Contextual guidance**: Explain why no data exists
- **Primary actions**: Clear path to populate data
- **Educational content**: Help users understand expected workflows
- **Visual consistency**: Maintain design hierarchy even when empty

### Success States
- **Immediate feedback**: Confirm user actions instantly
- **Data freshness**: Timestamps and update indicators
- **Progressive enhancement**: Additional features load after core content
- **Responsive adaptation**: Optimal layout for current viewport

---

## Reports Landing Page States

### Default State
**Condition**: User has access to reporting module with existing project data

```typescript
interface ReportsLandingState {
  reportTypes: ReportTypeCard[];
  recentReports: RecentReport[];
  quickMetrics: DashboardMetrics | null;
  loading: false;
  error: null;
}
```

**Layout Structure**:
```
┌──────────────────────────────────────┐
│ Reports Dashboard                        │
├──────────────────────────────────────┤
│ Quick Metrics Bar                       │
│ [67%] [1.2k/1.8k] [23 ready] [5 stall] │
├──────────────────────────────────────┤
│ Report Type Cards (2x3 grid)            │
│ ┌────────┐ ┌────────┐ ┌────────┐ │
│ │Progress │ │Component│ │Test Pkgs│ │
│ │Summary  │ │Details  │ │Readiness│ │
│ └────────┘ └────────┘ └────────┘ │
│ ┌────────┐ ┌────────┐              │
│ │Trends   │ │Audit    │              │
│ │Analysis │ │Trail    │              │
│ └────────┘ └────────┘              │
├──────────────────────────────────────┤
│ Recent Reports (5 most recent)          │
│ • Weekly Progress - Oct 15, 2023       │
│ • Area C Components - Oct 12, 2023     │
│ • Test Package Status - Oct 10, 2023   │
└──────────────────────────────────────┘
```

**shadcn/ui Components**:
- `Card` for report type cards
- `Badge` for quick metrics
- `Button` with variants for primary actions
- `Skeleton` for loading states

### Loading State
**Condition**: Initial page load or data refresh

**Visual Elements**:
- Skeleton placeholders maintain card layout structure
- Pulsing animation indicates active loading
- Quick metrics show loading spinners
- Navigation remains interactive

**Implementation**:
```tsx
<div className="grid gap-6">
  <div className="flex gap-4">
    {[1, 2, 3, 4].map((i) => (
      <Skeleton key={i} className="h-20 w-32" />
    ))}
  </div>
  <div className="grid gap-4 md:grid-cols-3">
    {[1, 2, 3, 4, 5].map((i) => (
      <Card key={i} className="animate-pulse">
        <CardHeader>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-16" />
        </CardHeader>
      </Card>
    ))}
  </div>
</div>
```

### Empty State (No Data)
**Condition**: New project with no components imported

**Visual Elements**:
- Centered empty state illustration
- Clear explanation of why no reports exist
- Primary action button to import data
- Secondary actions for getting started

**Content**:
- **Heading**: "No project data available"
- **Description**: "Import your component data to start generating reports"
- **Primary Action**: "Import Components"
- **Secondary Actions**: "View Sample Data", "Contact Support"

### Error State
**Condition**: API failure or insufficient permissions

**Types of Errors**:

1. **Network Error**
   - Message: "Unable to load reports. Check your connection."
   - Action: "Retry" button with exponential backoff
   - Fallback: Show cached data with staleness indicator

2. **Permission Error**
   - Message: "You don't have access to view reports for this project"
   - Action: "Request Access" or "Contact Administrator"
   - Fallback: Show available report types only

3. **Data Error**
   - Message: "Some report data is incomplete or corrupted"
   - Action: "View Available Reports" or "Refresh Data"
   - Fallback: Disable affected report types

---

## Progress Dashboard States

### Default State (Data Loaded)
**Condition**: ROC calculations complete, area/system data available

```typescript
interface ProgressDashboardState {
  rocMetrics: {
    overallPercent: number;
    rocWeightedPercent: number;
    componentBreakdown: ComponentBreakdown[];
  };
  areaSystemBreakdown: AreaSystemMatrix;
  progressCharts: ChartData[];
  exportOptions: ExportConfig;
  loading: false;
  error: null;
}
```

**Layout Structure**:
```
┌──────────────────────────────────────┐
│ Progress Summary Report                  │
├──────────────────────────────────────┤
│ ROC Hero Bar                            │
│ [67.3%] [Simple: 65%] [1.2k/1.8k]     │
├──────────────────────────────────────┤
│ Area/System Breakdown (Left 60%)        │
│ ┌────────────────────────┐       │
│ │Area A  System 1  [89%]│       │
│ │Area A  System 2  [76%]│       │
│ │Area B  System 1  [45%]│       │
│ │Area C  System 2  [23%]│       │
│ └────────────────────────┘       │
│                                     │
│ Progress Chart (Right 40%)              │
│       ┌──────────────┐          │
│       │  ┌─┐   ┏━┑ │          │
│       │┌─┤ │ ┌─┨━┩ │          │
│       ││ │ │┌┴─╚━╧─┐│          │
│       └┴─┴─┴┴─────┴┘          │
├──────────────────────────────────────┤
│ Export Controls                         │
│ [Export PDF] [Export Excel] [Email]     │
└──────────────────────────────────────┘
```

### Loading State (Calculating ROC)
**Condition**: Heavy ROC calculations in progress for large dataset

**Visual Elements**:
- ROC Hero Bar shows skeleton with pulsing animation
- Area/System grid displays loading spinners
- Progress indicator for calculation status
- Charts show loading placeholder

**User Feedback**:
- Progress bar: "Calculating ROC weights... 67%"
- Estimated time remaining: "About 15 seconds remaining"
- Cancel option: "Cancel" button to abort calculation

### Partial Data State
**Condition**: Some areas/systems have data, others are missing

**Visual Treatment**:
- Complete areas show normal styling
- Incomplete areas show dashed borders with warning icons
- Missing data indicators: "Data not available"
- Tooltip explanations: "No components found for this area"

### Export Generation State
**Condition**: Large export file generation in progress

**Modal Overlay**:
```
┌────────────────────────────────┐
│ Generating Excel Export            │
├────────────────────────────────┤
│ Processing 142,000 components...   │
│                                │
│ ████████████░░░░ 76%         │
│                                │
│ Estimated time: 18 seconds      │
│                                │
│           [Cancel]             │
└────────────────────────────────┘
```

---

## Component Report Interface States

### Default State (Data Table Loaded)
**Condition**: Virtual table with filtered component data

**Layout Structure**:
```
┌──────────────────────────────────────────────────────────────────────┐
│ Component Report - 142,337 components                                   │
├──────────────────────────────────────────────────────────────────────┤
│ Advanced Filters                    │ Bulk Actions                        │
│ [Area ▼] [System ▼] [Status ▼]    │ ☐ Select All  [Export] [Update]     │
├─────────────────────────────────────┴────────────────────────────────┤
│ Virtual Data Table                                                       │
│ ┏━━━━━━━━━━━━╋━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━╋━━━━━━━━━━━━╋━━━━━━━┓ │
│ ┃ Component# ┃ Description ┃ Area/System ┃ Progress   ┃ Actions ┃ │
│ ┣━━━━━━━━━━━━╋━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━╋━━━━━━━━━━━━╋━━━━━━━┫ │
│ │ CV-1401    │ Control Vlv │ A / System1 │ [====> 89%]│ [...]   │ │
│ │ HX-2301    │ Heat Exchgr │ B / System2 │ [==>   45%]│ [...]   │ │
│ │ ⋮          │ ⋮           │ ⋮          │ ⋮          │ ⋮       │ │
│ └────────────┴───────────────┴─────────────┴────────────┴───────┘ │
├──────────────────────────────────────────────────────────────────────┤
│ Status: Showing 50 of 142,337 • Last updated: 2 minutes ago         │
└──────────────────────────────────────────────────────────────────────┘
```

### Virtual Scrolling State
**Condition**: User scrolling through large dataset

**Visual Elements**:
- Smooth scroll with inertia
- Row virtualization (only visible rows rendered)
- Scroll position indicator
- "Jump to top" button after scrolling >1000 rows

**Performance Characteristics**:
- Render only 50-100 visible rows
- 60fps scrolling performance
- Lazy load row details on demand
- Maintain scroll position during data updates

### Filter Application State
**Condition**: Applying complex filters to large dataset

**Visual Feedback**:
- Filter inputs remain responsive
- Results counter updates in real-time: "Filtering... found 1,247 matches"
- Loading spinner in table header
- Clear filter badges for active filters

### Empty Filter Results
**Condition**: No components match current filter criteria

**Layout**:
```
┌──────────────────────────────────────┐
│ No components match your filters      │
├──────────────────────────────────────┤
│               🔍                     │
│                                      │
│ Try adjusting your filter criteria:  │
│ • Expand area selection              │
│ • Include more milestone states     │
│ • Check date range settings        │
│                                      │
│ Active filters:                      │
│ [Area: C] [Status: Complete] [Clear] │
│                                      │
│           [Clear All Filters]        │
└──────────────────────────────────────┘
```

### Bulk Selection State
**Condition**: User has selected multiple components for bulk operations

**Visual Treatment**:
- Selected rows highlighted with blue background
- Selection count in toolbar: "234 components selected"
- Bulk action buttons become enabled
- "Select All" changes to "Deselect All"
- Floating action bar appears at bottom of screen

---

## Test Package Readiness States

### Default State (Mixed Status)
**Condition**: Test packages in various completion states

**Layout Structure**:
```
┌──────────────────────────────────────────────────────────────────────┐
│ Test Package Readiness - 47 packages                                   │
├──────────────────────────────────────────────────────────────────────┤
│ Summary Cards                                                           │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│ │    Ready     │ │ Nearly Ready │ │   Blocked    │ │ Not Started │ │
│ │  ✓ 12 pkgs   │ │  ⚠ 8 pkgs   │ │  ✗ 15 pkgs   │ │  ○ 12 pkgs   │ │
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ │
├──────────────────────────────────────────────────────────────────────┤
│ Package Details (Expandable Cards)                                      │
│                                                                      │
│ ┏━━ TP-001 Cooling Water System ━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ ✓ Ready for Testing                        [Expand ▼]          ┃ │
│ ┃ 147/147 components complete • Signed off: J.Smith             ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│                                                                      │
│ ┏━━ TP-005 Fire Water System ━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ ✗ Blocked - 12 components remaining     [Expand ▼]          ┃ │
│ ┃ Critical: 3 pumps need electrical connections                   ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
└──────────────────────────────────────────────────────────────────────┘
```

### Expanded Package Details State
**Condition**: User expands a test package to see blocking components

**Additional Information Shown**:
- Complete component list with status indicators
- Responsible crews for incomplete items
- Estimated completion dates based on velocity
- Critical path dependencies
- Sign-off requirements and current signatures

### Field Verification Mode (Mobile)
**Condition**: Foreman using touch interface for field verification

**Touch-Optimized Layout**:
- Large tap targets (minimum 44px)
- Swipe gestures for package navigation
- Quick toggle switches for component completion
- Voice notes capability
- Offline mode with sync indicators

---

## Trend Analysis Dashboard States

### Default State (Chart Loaded)
**Condition**: Historical data available with calculated trends

**Layout Structure**:
```
┌──────────────────────────────────────────────────────────────────────┐
│ Trend Analysis - 90 Day History                                         │
├──────────────────────────────────────────────────────────────────────┤
│ Time Range Controls                                                     │
│ [7D] [30D] [90D] [Custom...] • Forecast: [Linear] [Weighted] [None]     │
├──────────────────────────────────────────────────────────────────────┤
│ Velocity Chart (Top 60%)                                               │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃70%│                                              ┏━━┓        ┃ │
│ ┃   │                                     ┏━━━━╧━━╨━━━┓    ┃ │
│ ┃   │                          ┏━━━━━╧━━━━╨━━━━╨━━━━┓┃ │
│ ┃   │               ┏━━━━━╧━━━━╨━━━━╨━━━━╨━━━━╨━━━━┃ │
│ ┃   │        ┏━━━━╧━━━━╨━━━━╨━━━━╨━━━━╨━━━━╨━━━━┃ │
│ ┃0%  │━━━━━━━━┼━━━━┼━━━━┼━━━━┼━━━━┼━━━━┼━━━━┼━━━━┃ │
│ ┗━━━━┼━━━━┼━━━━┼━━━━┼━━━━┼━━━━┼━━━━┼━━━━┼━━━━┛ │
│      Aug    Sep    Oct    Nov    Dec   Jan   Feb   Mar   Apr       │
├──────────────────────────────────────────────────────────────────────┤
│ Bottleneck Heat Map (Bottom 40%)                                        │
│ ┏━━━━━━━━━╋━━━━━━━━━╋━━━━━━━━━╋━━━━━━━━━╋━━━━━━━━━╋━━━━━━━━━┓ │
│ ┃ Receive ┃ Erect   ┃ Connect ┃ Support ┃ Test    ┃ Complete┃ │
│ ┣━━━━━━━━━╋━━━━━━━━━╋━━━━━━━━━╋━━━━━━━━━╋━━━━━━━━━╋━━━━━━━━━┫ │
│ ┃Area A  │   ██   │   ███   │   ███   │    █    │    █    ┃ │
│ ┃Area B  │   ██   │ ███████ │   ███   │  ████   │   ██    ┃ │
│ ┃Area C  │  ███   │█████████│ ███████ │ ███████ │  ████   ┃ │
│ ┗━━━━━━━━━┻━━━━━━━━━┻━━━━━━━━━┻━━━━━━━━━┻━━━━━━━━━┻━━━━━━━━━┛ │
│ Legend: ███ High bottleneck  ██ Medium  █ Low                       │
└──────────────────────────────────────────────────────────────────────┘
```

### Insufficient Historical Data State
**Condition**: Less than 14 days of snapshot data available

**Visual Elements**:
- Partial chart with data available
- Warning message about trend reliability
- Suggestion to collect more data
- Forecast disabled with explanation

### Interactive Chart State
**Condition**: User hovering or interacting with chart elements

**Interactive Features**:
- Tooltip showing exact values on hover
- Click to drill down to component level
- Zoom functionality for detailed time periods
- Cross-filter between velocity chart and heat map

---

## Mobile Responsive States

### Mobile Portrait (320px - 768px)
**Layout Adaptations**:
- Single column layout
- Collapsible filter panels
- Bottom sheet navigation
- Swipeable chart sections
- Touch-optimized controls

### Mobile Landscape (568px - 1024px)
**Layout Adaptations**:
- Two-column grid where appropriate
- Horizontal scrolling for tables
- Split-screen chart views
- Gesture navigation for data exploration

### Tablet (768px - 1024px)
**Layout Adaptations**:
- Three-column layouts
- Side panel navigation
- Multi-touch gesture support
- Optimal for field use with gloves

---

## Performance States

### Optimal Performance
**Characteristics**:
- Initial page load <2 seconds
- Chart rendering <500ms
- Filter application <250ms
- Smooth 60fps scrolling

### Degraded Performance
**Fallback Behaviors**:
- Reduce animation complexity
- Limit concurrent chart updates
- Paginate large datasets
- Show performance warnings

### Offline State
**Capabilities**:
- Cached report data available
- Read-only mode with sync indicators
- Queued updates for connectivity resume
- Clear offline status messaging

---

## Accessibility States

### Screen Reader Support
**Features**:
- Semantic HTML structure
- ARIA labels and descriptions
- Live regions for dynamic updates
- Keyboard navigation support

### High Contrast Mode
**Adaptations**:
- Enhanced color contrast ratios
- Bold text rendering
- Simplified visual elements
- Clear focus indicators

### Reduced Motion
**Adaptations**:
- Disabled animations
- Static chart transitions
- Instant state changes
- Respect user preferences

---

## Error Recovery States

### Transient Errors
**Recovery Behaviors**:
- Automatic retry with exponential backoff
- Preserve user input during retry
- Show progress during recovery
- Fallback to cached data

### Persistent Errors
**User Actions**:
- Clear error explanations
- Manual retry options
- Contact support pathways
- Alternative workflow suggestions

### Data Corruption Errors
**Safety Measures**:
- Isolate corrupted sections
- Preserve valid data display
- Prevent data loss during recovery
- Audit trail of error occurrences
