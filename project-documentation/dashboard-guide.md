# PipeTrak Dashboard User Guide

## Overview

The PipeTrak Dashboard is the primary interface for monitoring project progress, tracking component completion, and managing industrial construction workflows. It provides both high-level analytics for project managers and quick update capabilities for field foremen.

## Dashboard Views

### Desktop View (≥1024px)
The desktop dashboard provides a comprehensive analytical command center with:

#### KPI Hero Bar
- **Overall Completion %**: Project-wide progress at a glance
- **Components Count**: Shows completed/total components
- **Active Drawings**: Number of drawings with active components
- **Test Packages Ready**: Packages at 100% completion with checkmark
- **Stalled Components** (Secondary): Smaller, muted display showing 7d/14d/21d+ breakdowns

#### Area × System Grid
- **Heatmap Visualization**: Color-coded cells (red→yellow→green) based on completion percentage
- **Cell Format**: Each cell shows "73% (12/16)" format
- **Stalled Indicators**: Small triangle (△) markers for cells with stalled components
- **Interactive**: Hover for tooltips, click to drill down into details
- **Legend**: Color scale reference at bottom of grid

#### Drawing Hierarchy
- **Tree Structure**: Expandable/collapsible drawing hierarchy
- **Progress Bars**: Inline progress visualization for each drawing
- **Component Counts**: Shows component totals per drawing
- **Stalled Counts**: Tiny gray text indicating stalled components
- **Virtual Scrolling**: Optimized for large drawing lists

#### Test Package Readiness
- **Sortable Table**: Click column headers to sort
- **Ready Badges**: Green "Ready ✓" badge for 100% complete packages
- **Progress Display**: Percentage completion for each package
- **Filter Toggle**: "Only Ready" checkbox to show completed packages
- **Export Button**: Export package data (placeholder for future implementation)

#### Activity Feed
- **Recent Updates**: Shows latest component and milestone updates
- **User Attribution**: Displays who made each update
- **Sparkline Chart**: 7-day activity trend visualization
- **Filtering**: Filter by user (area/system filters pending)
- **Timestamps**: Relative time display (e.g., "2 hours ago")

### Tablet View (768-1024px)
The tablet dashboard focuses on update operations with simplified analytics:

#### Quick Stats Chips
- Horizontal scrollable row of key metrics
- Overall %, Components, Stalled (muted)
- Touch-optimized for field use

#### Component List
- **Virtualized List**: Efficient scrolling for large datasets
- **Inline Progress**: Progress bars and percentages
- **Quick Toggles**: Milestone checkboxes for rapid updates
- **Search**: Filter components by ID or description
- **Area Filter**: Focus on specific work areas

#### Bottom Action Bar
- Add Milestone button
- Mark Complete button
- More actions dropdown

### Mobile View (<768px)
The mobile dashboard provides ultra-simplified touch-first interface:

#### Compact Stats
- Minimal chip display with essential metrics
- Stalled shown as tiny muted indicator

#### Component Cards
- Large touch targets (≥44px)
- Tap to open bottom sheet with details
- Progress bars and completion status
- Swipe gestures supported

#### Bottom Sheet Details
- All milestones with large touch targets
- Last update timestamp
- Swipe down to close
- Optimized for one-handed operation

## Features & Interactions

### Manual Refresh
- Click the refresh button (⟳) in the top bar
- Dashboard auto-refreshes every 60 seconds
- Shows "Last updated" timestamp in footer

### Drill-Down Navigation
1. Click any cell in the Area × System grid
2. Opens detailed sheet with:
   - Component list for that area/system
   - Individual progress details
   - Stalled component breakdown

### Keyboard Shortcuts (Desktop)
- **Tab**: Navigate between sections
- **Enter**: Open selected item
- **Escape**: Close dialogs/sheets
- **Arrow Keys**: Navigate grid cells
- **Space**: Toggle checkboxes

### Search & Filtering
- **Global Search**: Top bar search (placeholder)
- **Component Search**: Within component lists
- **User Filter**: Activity feed filtering
- **Area/System Filters**: Component list filtering
- **Test Package Filter**: "Only Ready" toggle

## Performance Characteristics

### Load Times
- Initial load: <2s on 4G connection
- Interaction response: <300ms
- Virtual scrolling: 60fps smooth scrolling

### Data Capacity
- Supports 10,000+ components
- Efficient aggregation for large projects
- Progressive loading for drill-downs

### Optimization Features
- Server-side rendering for analytics
- Selective client hydration
- Virtual scrolling for long lists
- Debounced search inputs
- Cached aggregations

## Stalled Components

### Definition
Components are considered "stalled" based on time since last progress:
- **7d**: 7-13 days since last update (yellow indicator)
- **14d**: 14-21 days since last update (orange indicator)
- **21d+**: More than 21 days since last update (red indicator)

### Visual Indicators
- **Desktop**: Smaller, muted card at end of KPI row
- **Grid Cells**: Small triangle (△) markers
- **Component Lists**: Tiny triangle indicators
- **Tooltips**: Detailed breakdown on hover

## Data Updates

### Real-Time Features
- Activity feed shows recent updates
- Manual refresh available anytime
- 60-second auto-refresh interval

### Offline Support
- Cached data available when offline
- Offline indicator in footer
- Updates sync when connection restored

## Export Capabilities

### Available Formats (Planned)
- Excel (.xlsx) - Full data export
- CSV - Simple tabular export
- PDF - Formatted reports

### Export Options
- Component lists by area/system
- Test package readiness reports
- Progress summaries
- Activity logs

## Accessibility

### Keyboard Navigation
- Full keyboard support for all interactions
- Tab order follows logical flow
- Focus indicators clearly visible

### Screen Reader Support
- Semantic HTML structure
- ARIA labels for interactive elements
- Status announcements for updates

### Visual Accessibility
- High contrast mode available
- Color not sole indicator (includes text/icons)
- Minimum WCAG AA compliance
- Large touch targets on mobile (≥44px)

## Troubleshooting

### Common Issues

#### Dashboard Not Loading
- Check internet connection
- Verify project access permissions
- Clear browser cache
- Try manual refresh

#### Slow Performance
- Check network speed
- Reduce concurrent browser tabs
- Update to latest browser version
- Contact support for large projects

#### Missing Data
- Verify component assignments
- Check area/system values
- Ensure milestones are configured
- Review project permissions

## Tips for Effective Use

### For Project Managers
1. Start with KPI overview each morning
2. Focus on red zones in Area × System grid
3. Check test package readiness for turnover planning
4. Monitor activity feed for team productivity
5. Use drill-downs for problem investigation

### For Field Foremen
1. Filter to your assigned area immediately
2. Use component list for quick updates
3. Leverage inline milestone toggles
4. Update progress frequently to avoid stalled status
5. Use mobile view for on-site updates

## Technical Details

### Browser Requirements
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- JavaScript enabled
- Cookies enabled for authentication
- Minimum 768px width for tablet view

### Network Requirements
- Broadband for desktop use
- 4G LTE minimum for mobile use
- ~500KB initial bundle size
- ~50KB per data refresh

### Data Refresh Strategy
- Server-side aggregation for performance
- Client-side caching for responsiveness
- Incremental updates when possible
- Full refresh on manual trigger

---

For additional support or feature requests, contact the PipeTrak support team.