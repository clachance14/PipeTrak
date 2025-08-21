# Component Specifications - Reporting Module

Detailed design specifications for all reporting components, including shadcn/ui implementations, responsive layouts, and interaction patterns.

## Design Token Integration

### Color System
```css
/* Progress Status Colors */
--progress-complete: hsl(var(--success)); /* Green */
--progress-in-progress: hsl(var(--warning)); /* Yellow */
--progress-blocked: hsl(var(--destructive)); /* Red */
--progress-not-started: hsl(var(--muted)); /* Gray */

/* ROC Weighting Colors */
--roc-primary: hsl(var(--primary));
--roc-secondary: hsl(var(--muted-foreground));
--roc-accent: hsl(var(--accent));

/* Chart Colors */
--chart-line-primary: hsl(var(--primary));
--chart-line-secondary: hsl(var(--secondary));
--chart-area-fill: hsla(var(--primary), 0.1);
--chart-grid: hsl(var(--border));
```

### Typography Scale
```css
/* Report Headers */
.report-title { @apply text-2xl font-bold tracking-tight; }
.report-subtitle { @apply text-lg font-semibold text-muted-foreground; }
.section-header { @apply text-base font-medium; }

/* Data Display */
.metric-value { @apply text-3xl font-bold tabular-nums; }
.metric-label { @apply text-sm font-medium text-muted-foreground; }
.data-cell { @apply text-sm tabular-nums; }
```

### Spacing System
```css
/* Component Spacing */
.report-container { @apply p-6 space-y-6; }
.card-spacing { @apply p-4 space-y-3; }
.dense-layout { @apply p-2 space-y-2; }
.table-spacing { @apply px-3 py-2; }
```

---

## Reports Landing Page Components

### ReportsLandingPage
**Purpose**: Entry point for all reporting functionality with quick access and recent history

```typescript
interface ReportsLandingPageProps {
  quickMetrics: DashboardMetrics | null;
  recentReports: RecentReport[];
  userRole: 'pm' | 'engineer' | 'foreman';
  organizationId: string;
}
```

**Layout Structure**:
```tsx
<div className="report-container">
  <div className="flex flex-col space-y-6">
    <ReportsHeader />
    <QuickMetricsBar metrics={quickMetrics} />
    <ReportTypeGrid userRole={userRole} />
    <RecentReportsHistory reports={recentReports} />
  </div>
</div>
```

**Responsive Breakpoints**:
- Mobile: Single column, stacked cards
- Tablet: 2-column grid for report types
- Desktop: 3-column grid with expanded metrics

### ReportTypeCards
**Purpose**: Navigation cards for each report type with preview metrics

```typescript
interface ReportTypeCardProps {
  type: 'progress' | 'components' | 'test-packages' | 'trends' | 'audit';
  title: string;
  description: string;
  previewMetric?: {
    value: string;
    label: string;
    trend?: 'up' | 'down' | 'neutral';
  };
  userRole: UserRole;
  disabled?: boolean;
}
```

**shadcn/ui Implementation**:
```tsx
<Card className={cn(
  "cursor-pointer transition-all duration-200",
  "hover:shadow-md hover:scale-[1.02]",
  "focus-within:ring-2 focus-within:ring-primary",
  disabled && "opacity-50 cursor-not-allowed"
)}>
  <CardHeader className="pb-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription className="text-xs">{description}</CardDescription>
        </div>
      </div>
      {previewMetric && (
        <div className="text-right">
          <div className="text-lg font-semibold">{previewMetric.value}</div>
          <div className="text-xs text-muted-foreground">{previewMetric.label}</div>
        </div>
      )}
    </div>
  </CardHeader>
</Card>
```

**Accessibility Features**:
- Keyboard navigation with tab/enter
- Screen reader descriptions
- Focus indicators
- Role-based visibility

### QuickMetricsBar
**Purpose**: High-level project metrics for immediate visibility

```tsx
<div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
  <MetricCard
    value="67.3%"
    label="ROC Progress"
    trend={{ direction: 'up', value: '+2.1%', period: '7d' }}
    variant="primary"
  />
  <MetricCard
    value="1,247"
    label="Components"
    sublabel="1,856 total"
    variant="secondary"
  />
  {/* Additional metrics */}
</div>
```

---

## Progress Dashboard Components

### ROCHeroBar
**Purpose**: Display ROC-weighted progress prominently with comparison metrics

```typescript
interface ROCHeroBarProps {
  rocProgress: number;
  simpleProgress: number;
  componentCounts: {
    completed: number;
    total: number;
  };
  lastUpdated: Date;
  loading?: boolean;
}
```

**Visual Design**:
```tsx
<Card className="border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
  <CardHeader>
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Overall Progress (ROC Weighted)
        </CardTitle>
        <div className="flex items-baseline space-x-4">
          <span className="metric-value text-primary">{rocProgress.toFixed(1)}%</span>
          <span className="text-lg text-muted-foreground">
            ({simpleProgress}% simple)
          </span>
        </div>
      </div>
      <div className="text-right space-y-1">
        <div className="text-sm font-medium">
          {componentCounts.completed.toLocaleString()} / {componentCounts.total.toLocaleString()}
        </div>
        <div className="text-xs text-muted-foreground">
          Updated {formatTimeAgo(lastUpdated)}
        </div>
      </div>
    </div>
  </CardHeader>
  <CardContent>
    <Progress 
      value={rocProgress} 
      className="h-3"
      // Custom ROC progress styling
    />
  </CardContent>
</Card>
```

### AreaSystemBreakdown
**Purpose**: Hierarchical view of progress by area and system with drill-down capability

```typescript
interface AreaSystemBreakdownProps {
  matrixData: AreaSystemMatrixItem[];
  onDrillDown: (area: string, system?: string) => void;
  loading?: boolean;
  viewMode: 'grid' | 'list';
}
```

**Grid View Implementation**:
```tsx
<div className="space-y-4">
  <div className="flex items-center justify-between">
    <h3 className="section-header">Area & System Breakdown</h3>
    <div className="flex items-center space-x-2">
      <Button
        variant={viewMode === 'grid' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setViewMode('grid')}
      >
        <Grid3x3 className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === 'list' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setViewMode('list')}
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  </div>
  
  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
    {matrixData.map((item) => (
      <AreaSystemCard
        key={`${item.area}-${item.system}`}
        data={item}
        onClick={() => onDrillDown(item.area, item.system)}
      />
    ))}
  </div>
</div>
```

**Area System Card**:
```tsx
<Card className={cn(
  "cursor-pointer transition-all duration-200",
  "hover:shadow-md hover:-translate-y-0.5",
  "border-l-4",
  getProgressBorderColor(item.completionPercent)
)}>
  <CardHeader className="pb-2">
    <div className="flex items-center justify-between">
      <div>
        <CardTitle className="text-sm font-medium">{item.area}</CardTitle>
        <CardDescription className="text-xs">{item.system}</CardDescription>
      </div>
      <Badge variant={getProgressVariant(item.completionPercent)}>
        {item.completionPercent}%
      </Badge>
    </div>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      <Progress value={item.completionPercent} className="h-2" />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{item.completedCount}/{item.totalCount}</span>
        {item.stalledCounts.stalled7Days > 0 && (
          <span className="text-orange-600">
            {item.stalledCounts.stalled7Days} stalled
          </span>
        )}
      </div>
    </div>
  </CardContent>
</Card>
```

### ProgressCharts
**Purpose**: Visual representation of progress trends using Recharts

```typescript
interface ProgressChartsProps {
  chartData: ChartDataPoint[];
  chartType: 'line' | 'area' | 'bar';
  showForecast?: boolean;
  timeRange: '7d' | '30d' | '90d';
  onChartClick?: (dataPoint: ChartDataPoint) => void;
}
```

**Recharts Implementation**:
```tsx
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle className="text-base">Progress Over Time</CardTitle>
      <div className="flex items-center space-x-2">
        <Select value={chartType} onValueChange={setChartType}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="line">Line</SelectItem>
            <SelectItem value="area">Area</SelectItem>
            <SelectItem value="bar">Bar</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="date" 
          tickFormatter={(value) => format(new Date(value), 'MMM dd')}
          className="text-xs"
        />
        <YAxis 
          domain={[0, 100]}
          tickFormatter={(value) => `${value}%`}
          className="text-xs"
        />
        <Tooltip 
          content={<CustomTooltip />}
          cursor={{ strokeDasharray: '3 3' }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="rocProgress"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ fill: 'hsl(var(--primary))', r: 4 }}
          activeDot={{ r: 6, stroke: 'hsl(var(--primary))' }}
        />
        {showForecast && (
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="5 5"
            strokeWidth={1}
            dot={false}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  </CardContent>
</Card>
```

---

## Component Report Interface Components

### AdvancedFilterPanel
**Purpose**: Collapsible filter interface for complex component queries

```typescript
interface AdvancedFilterPanelProps {
  filters: ComponentFilters;
  onFiltersChange: (filters: ComponentFilters) => void;
  activeFilterCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}
```

**Collapsible Design**:
```tsx
<Card>
  <CardHeader 
    className="cursor-pointer" 
    onClick={onToggleCollapse}
  >
    <div className="flex items-center justify-between">
      <CardTitle className="text-base">Filters</CardTitle>
      <div className="flex items-center space-x-2">
        {activeFilterCount > 0 && (
          <Badge variant="secondary">{activeFilterCount} active</Badge>
        )}
        <Button variant="ghost" size="sm">
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  </CardHeader>
  
  <Collapsible open={!isCollapsed}>
    <CollapsibleContent>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          <div className="space-y-2">
            <Label htmlFor="area-filter">Area</Label>
            <Select
              value={filters.area}
              onValueChange={(value) => onFiltersChange({ ...filters, area: value })}
            >
              <SelectTrigger id="area-filter">
                <SelectValue placeholder="All Areas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                {areas.map(area => (
                  <SelectItem key={area} value={area}>{area}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Additional filter controls */}
          
          <div className="flex items-end space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={clearAllFilters}
              disabled={activeFilterCount === 0}
            >
              Clear All
            </Button>
            <Button 
              size="sm"
              onClick={applyFilters}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </CollapsibleContent>
  </Collapsible>
</Card>
```

### VirtualizedDataTable
**Purpose**: High-performance data table with virtual scrolling for large datasets

```typescript
interface VirtualizedDataTableProps {
  columns: TableColumn[];
  data: ComponentWithMilestones[];
  totalRows: number;
  onRowClick?: (component: ComponentWithMilestones) => void;
  onBulkSelect?: (componentIds: string[]) => void;
  loading?: boolean;
  stickyColumns?: string[];
}
```

**Virtual Scrolling Implementation**:
```tsx
<Card className="flex flex-col h-[600px]">
  <CardHeader className="flex-shrink-0">
    <div className="flex items-center justify-between">
      <CardTitle>Components ({totalRows.toLocaleString()})</CardTitle>
      <div className="flex items-center space-x-2">
        <ColumnVisibilityDropdown 
          columns={columns}
          visibleColumns={visibleColumns}
          onToggleColumn={toggleColumnVisibility}
        />
        <Button 
          variant="outline" 
          size="sm"
          onClick={exportVisible}
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
    </div>
  </CardHeader>
  
  <CardContent className="flex-1 overflow-hidden p-0">
    <div className="relative h-full">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex">
          {columns.map((column) => (
            <div
              key={column.key}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium",
                "border-r last:border-r-0",
                stickyColumns?.includes(column.key) && "sticky left-0 bg-background z-20"
              )}
              style={{ width: column.width || 'auto' }}
            >
              <SortableHeader 
                column={column}
                sortConfig={sortConfig}
                onSort={handleSort}
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Virtual scrolling container */}
      <FixedSizeList
        height={520}
        itemCount={data.length}
        itemSize={48}
        overscanCount={10}
      >
        {({ index, style }) => (
          <VirtualTableRow
            style={style}
            index={index}
            component={data[index]}
            columns={columns}
            stickyColumns={stickyColumns}
            isSelected={selectedIds.has(data[index].id)}
            onClick={() => onRowClick?.(data[index])}
            onSelect={(selected) => handleRowSelect(data[index].id, selected)}
          />
        )}
      </FixedSizeList>
    </div>
  </CardContent>
  
  <CardFooter className="flex-shrink-0">
    <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
      <span>Showing {data.length} of {totalRows.toLocaleString()} components</span>
      <span>Last updated: {formatTimeAgo(lastUpdated)}</span>
    </div>
  </CardFooter>
</Card>
```

### ColumnCustomization
**Purpose**: Allow users to show/hide columns and resize table layout

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" size="sm">
      <Settings className="h-4 w-4 mr-2" />
      Columns
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-56">
    <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
    <DropdownMenuSeparator />
    {columns.map((column) => (
      <DropdownMenuCheckboxItem
        key={column.key}
        checked={visibleColumns.includes(column.key)}
        onCheckedChange={(checked) => 
          toggleColumnVisibility(column.key, checked)
        }
        disabled={column.required}
      >
        {column.label}
      </DropdownMenuCheckboxItem>
    ))}
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={resetToDefaults}>
      Reset to Defaults
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## Test Package Readiness Components

### StatusIndicatorGrid
**Purpose**: Visual grid showing test package status with traffic light colors

```typescript
interface StatusIndicatorGridProps {
  testPackages: TestPackageWithReadiness[];
  viewMode: 'grid' | 'list';
  onPackageClick: (packageId: string) => void;
  onStatusFilter: (status: PackageStatus[]) => void;
}
```

**Grid Layout**:
```tsx
<div className="space-y-4">
  <div className="flex items-center justify-between">
    <h2 className="section-header">Test Package Status</h2>
    <div className="flex items-center space-x-2">
      <StatusFilterChips 
        activeFilters={statusFilters}
        onFilterChange={onStatusFilter}
      />
      <ViewModeToggle mode={viewMode} onChange={setViewMode} />
    </div>
  </div>
  
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {filteredPackages.map((pkg) => (
      <TestPackageCard
        key={pkg.packageId}
        package={pkg}
        onClick={() => onPackageClick(pkg.packageId)}
      />
    ))}
  </div>
</div>
```

**Test Package Card**:
```tsx
<Card className={cn(
  "cursor-pointer transition-all duration-200",
  "hover:shadow-lg hover:scale-[1.02]",
  "border-l-4",
  getStatusBorderColor(pkg.status)
)}>
  <CardHeader className="pb-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <StatusIcon status={pkg.status} className="h-5 w-5" />
        <div>
          <CardTitle className="text-sm font-medium">
            {pkg.packageName}
          </CardTitle>
          <CardDescription className="text-xs">
            {pkg.packageId}
          </CardDescription>
        </div>
      </div>
      <Badge variant={getStatusVariant(pkg.status)}>
        {pkg.status}
      </Badge>
    </div>
  </CardHeader>
  
  <CardContent>
    <div className="space-y-2">
      <Progress 
        value={pkg.completionPercent} 
        className="h-2"
        indicatorClassName={getProgressColor(pkg.status)}
      />
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">
          {pkg.completedComponents}/{pkg.totalComponents} complete
        </span>
        {pkg.blockerCount > 0 && (
          <span className="text-destructive font-medium">
            {pkg.blockerCount} blockers
          </span>
        )}
      </div>
    </div>
  </CardContent>
</Card>
```

### BlockingComponentDrilldown
**Purpose**: Expandable section showing components blocking test package completion

```tsx
<Collapsible>
  <CollapsibleTrigger asChild>
    <Button 
      variant="outline" 
      className="w-full justify-between"
    >
      <div className="flex items-center space-x-2">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <span>View {blockerCount} Blocking Components</span>
      </div>
      <ChevronDown className="h-4 w-4" />
    </Button>
  </CollapsibleTrigger>
  
  <CollapsibleContent className="mt-3">
    <Card>
      <CardContent className="p-3">
        <div className="space-y-2">
          {blockingComponents.map((component) => (
            <div 
              key={component.id}
              className="flex items-center justify-between p-2 rounded-md bg-muted/50"
            >
              <div className="flex items-center space-x-2">
                <Badge variant="destructive" size="sm">
                  {component.currentMilestone}
                </Badge>
                <span className="text-sm font-medium">
                  {component.componentId}
                </span>
                <span className="text-xs text-muted-foreground">
                  {component.description}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span>{component.daysSinceUpdate}d stalled</span>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </CollapsibleContent>
</Collapsible>
```

---

## Trend Analysis Components

### TimeRangeSelector
**Purpose**: Date range picker with preset options for trend analysis

```tsx
<div className="flex items-center space-x-4">
  <div className="flex items-center space-x-1">
    <Button
      variant={timeRange === '7d' ? 'default' : 'outline'}
      size="sm"
      onClick={() => setTimeRange('7d')}
    >
      7 Days
    </Button>
    <Button
      variant={timeRange === '30d' ? 'default' : 'outline'}
      size="sm"
      onClick={() => setTimeRange('30d')}
    >
      30 Days
    </Button>
    <Button
      variant={timeRange === '90d' ? 'default' : 'outline'}
      size="sm"
      onClick={() => setTimeRange('90d')}
    >
      90 Days
    </Button>
  </div>
  
  <div className="flex items-center space-x-2">
    <Label htmlFor="custom-range" className="text-sm">Custom:</Label>
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id="custom-range"
          variant={timeRange === 'custom' ? 'default' : 'outline'}
          size="sm"
          className={cn(
            "w-[240px] justify-start text-left font-normal",
            !customDateRange && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {customDateRange ? (
            `${format(customDateRange.from, "MMM dd")} - ${format(customDateRange.to, "MMM dd")}`
          ) : (
            "Pick a date range"
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={customDateRange}
          onSelect={handleCustomDateRange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  </div>
</div>
```

### VelocityChart
**Purpose**: Line chart showing completion velocity with forecast projections

```tsx
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle>Completion Velocity</CardTitle>
      <div className="flex items-center space-x-2">
        <Switch
          id="show-forecast"
          checked={showForecast}
          onCheckedChange={setShowForecast}
        />
        <Label htmlFor="show-forecast" className="text-sm">
          Show Forecast
        </Label>
      </div>
    </div>
  </CardHeader>
  
  <CardContent>
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={velocityData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="date" 
          tickFormatter={(value) => format(new Date(value), 'MMM dd')}
        />
        <YAxis 
          label={{ value: 'Components/Day', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip content={<VelocityTooltip />} />
        <Legend />
        
        {/* Actual velocity */}
        <Line
          type="monotone"
          dataKey="actualVelocity"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          name="Actual Velocity"
        />
        
        {/* 7-day moving average */}
        <Line
          type="monotone"
          dataKey="movingAverage7d"
          stroke="hsl(var(--secondary))"
          strokeWidth={1}
          name="7-Day Average"
        />
        
        {/* Forecast projection */}
        {showForecast && (
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="5 5"
            strokeWidth={2}
            name="Forecast"
            dot={false}
          />
        )}
        
        {/* Target line */}
        <ReferenceLine 
          y={targetVelocity} 
          stroke="hsl(var(--success))"
          strokeDasharray="2 2"
          label="Target"
        />
      </LineChart>
    </ResponsiveContainer>
  </CardContent>
</Card>
```

### BottleneckHeatmap
**Purpose**: Heat map visualization of bottlenecks by milestone and area

```tsx
<Card>
  <CardHeader>
    <CardTitle>Bottleneck Analysis</CardTitle>
    <CardDescription>
      Identify milestones and areas with the highest stall rates
    </CardDescription>
  </CardHeader>
  
  <CardContent>
    <div className="space-y-4">
      {/* Heatmap grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Header row */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            <div className="p-2 text-xs font-medium">Area</div>
            {milestones.map(milestone => (
              <div key={milestone} className="p-2 text-xs font-medium text-center">
                {milestone}
              </div>
            ))}
          </div>
          
          {/* Data rows */}
          {areas.map(area => (
            <div key={area} className="grid grid-cols-7 gap-1 mb-1">
              <div className="p-2 text-sm font-medium bg-muted rounded-sm">
                {area}
              </div>
              {milestones.map(milestone => {
                const intensity = getBottleneckIntensity(area, milestone);
                return (
                  <Tooltip key={`${area}-${milestone}`}>
                    <TooltipTrigger asChild>
                      <div 
                        className={cn(
                          "p-2 rounded-sm text-center cursor-pointer",
                          "transition-all duration-200 hover:scale-105",
                          getHeatmapColor(intensity)
                        )}
                        onClick={() => onHeatmapClick(area, milestone)}
                      >
                        <div className="text-xs font-medium">
                          {getBottleneckCount(area, milestone)}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm">
                        <div className="font-medium">{area} - {milestone}</div>
                        <div>{getBottleneckCount(area, milestone)} stalled components</div>
                        <div>Avg stall: {getAverageStallDays(area, milestone)} days</div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center space-x-4 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
          <span>Low (0-5)</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-yellow-300 rounded-sm"></div>
          <span>Medium (6-15)</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-red-400 rounded-sm"></div>
          <span>High (16+)</span>
        </div>
      </div>
    </div>
  </CardContent>
</Card>
```

---

## Shared Export Components

### ExportDialog
**Purpose**: Modal dialog for configuring export options

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Export Report</DialogTitle>
      <DialogDescription>
        Configure your export options and generate the report file.
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4">
      {/* Format selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Format</Label>
        <RadioGroup value={exportFormat} onValueChange={setExportFormat}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="excel" id="excel" />
            <Label htmlFor="excel" className="flex items-center space-x-2">
              <FileSpreadsheet className="h-4 w-4" />
              <span>Excel (.xlsx)</span>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="pdf" id="pdf" />
            <Label htmlFor="pdf" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>PDF</span>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="csv" id="csv" />
            <Label htmlFor="csv" className="flex items-center space-x-2">
              <Table className="h-4 w-4" />
              <span>CSV</span>
            </Label>
          </div>
        </RadioGroup>
      </div>
      
      {/* Export options */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Options</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="include-charts" 
              checked={exportOptions.includeCharts}
              onCheckedChange={(checked) => 
                setExportOptions(prev => ({ ...prev, includeCharts: checked }))
              }
            />
            <Label htmlFor="include-charts" className="text-sm">
              Include charts and visualizations
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="roc-calculations" 
              checked={exportOptions.rocCalculations}
              onCheckedChange={(checked) => 
                setExportOptions(prev => ({ ...prev, rocCalculations: checked }))
              }
            />
            <Label htmlFor="roc-calculations" className="text-sm">
              Show ROC calculation details
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="email-delivery" 
              checked={exportOptions.emailDelivery}
              onCheckedChange={(checked) => 
                setExportOptions(prev => ({ ...prev, emailDelivery: checked }))
              }
            />
            <Label htmlFor="email-delivery" className="text-sm">
              Email when ready (large files)
            </Label>
          </div>
        </div>
      </div>
      
      {/* File size estimation */}
      <div className="p-3 bg-muted rounded-md">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Estimated file size:</span>
          <span className="font-medium">{estimatedFileSize}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Generation time:</span>
          <span className="font-medium">{estimatedTime}</span>
        </div>
      </div>
    </div>
    
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button 
        onClick={handleExport}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Generate Export
          </>
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## Mobile Responsive Components

### MobileBottomSheet
**Purpose**: Mobile-optimized bottom sheet for report navigation and actions

```tsx
<Sheet open={isOpen} onOpenChange={setIsOpen}>
  <SheetContent side="bottom" className="h-[80vh]">
    <SheetHeader>
      <SheetTitle>Report Actions</SheetTitle>
      <SheetDescription>
        Choose an action for the selected {selectionCount} components
      </SheetDescription>
    </SheetHeader>
    
    <div className="space-y-4 mt-6">
      <Button 
        variant="outline" 
        size="lg" 
        className="w-full justify-start"
        onClick={handleExportSelected}
      >
        <Download className="h-5 w-5 mr-3" />
        Export Selected Components
      </Button>
      
      <Button 
        variant="outline" 
        size="lg" 
        className="w-full justify-start"
        onClick={handleBulkUpdate}
      >
        <Edit className="h-5 w-5 mr-3" />
        Update Milestone Status
      </Button>
      
      <Button 
        variant="outline" 
        size="lg" 
        className="w-full justify-start"
        onClick={handleCreateWorkPackage}
      >
        <FileText className="h-5 w-5 mr-3" />
        Create Work Package
      </Button>
      
      <Button 
        variant="destructive" 
        size="lg" 
        className="w-full justify-start"
        onClick={handleDeselectAll}
      >
        <X className="h-5 w-5 mr-3" />
        Deselect All
      </Button>
    </div>
  </SheetContent>
</Sheet>
```

### OfflineIndicator
**Purpose**: Status indicator for offline mode with sync capabilities

```tsx
<div className={cn(
  "fixed top-16 right-4 z-50",
  "transition-all duration-300",
  isOffline ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
)}>
  <Card className="border-orange-200 bg-orange-50">
    <CardContent className="p-3">
      <div className="flex items-center space-x-2">
        <WifiOff className="h-4 w-4 text-orange-600" />
        <div className="text-sm">
          <div className="font-medium text-orange-800">You're offline</div>
          <div className="text-orange-600">
            {queuedUpdates > 0 ? (
              `${queuedUpdates} updates queued`
            ) : (
              "Changes will sync when connected"
            )}
          </div>
        </div>
        {isRetrying && (
          <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
        )}
      </div>
    </CardContent>
  </Card>
</div>
```

---

## Performance Optimizations

### LazyLoadWrapper
**Purpose**: Lazy load heavy components when they come into view

```tsx
const LazyProgressChart = lazy(() => import('./ProgressChart'));

function LazyLoadWrapper({ children, fallback, threshold = 0.1 }) {
  const [ref, inView] = useInView({ threshold });
  const [hasLoaded, setHasLoaded] = useState(false);
  
  useEffect(() => {
    if (inView && !hasLoaded) {
      setHasLoaded(true);
    }
  }, [inView, hasLoaded]);
  
  return (
    <div ref={ref}>
      {hasLoaded ? (
        <Suspense fallback={fallback}>
          {children}
        </Suspense>
      ) : (
        fallback
      )}
    </div>
  );
}
```

### VirtualizedList
**Purpose**: Efficiently render large lists with react-window

```tsx
import { FixedSizeList, VariableSizeList } from 'react-window';

function VirtualizedComponentList({ items, height = 400 }) {
  const getItemSize = (index) => {
    // Dynamic sizing based on content
    return items[index].isExpanded ? 120 : 60;
  };
  
  const Row = ({ index, style }) => (
    <div style={style}>
      <ComponentCard 
        component={items[index]}
        onToggleExpand={() => toggleExpanded(index)}
      />
    </div>
  );
  
  return (
    <VariableSizeList
      height={height}
      itemCount={items.length}
      itemSize={getItemSize}
      overscanCount={5}
    >
      {Row}
    </VariableSizeList>
  );
}
```

---

## Accessibility Enhancements

### KeyboardNavigationProvider
**Purpose**: Provide keyboard navigation context for complex components

```tsx
function KeyboardNavigationProvider({ children }) {
  const [focusedElement, setFocusedElement] = useState(null);
  const [navigationMode, setNavigationMode] = useState('mouse');
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Detect keyboard navigation
      if (e.key === 'Tab' || e.key.startsWith('Arrow')) {
        setNavigationMode('keyboard');
      }
    };
    
    const handleMouseDown = () => {
      setNavigationMode('mouse');
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);
  
  return (
    <KeyboardNavigationContext.Provider value={{
      focusedElement,
      setFocusedElement,
      navigationMode
    }}>
      {children}
    </KeyboardNavigationContext.Provider>
  );
}
```

### ScreenReaderText
**Purpose**: Provide screen reader only text for context

```tsx
function ScreenReaderText({ children }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
}

// Usage in components
<Button>
  <Download className="h-4 w-4" />
  <ScreenReaderText>Download component report</ScreenReaderText>
</Button>
```

---

## Integration Points

### TanStack Query Patterns
```typescript
// Report data fetching
export const useProgressReport = (projectId: string, filters?: ReportFilters) => {
  return useQuery({
    queryKey: ['progress-report', projectId, filters],
    queryFn: () => apiClient.reports.progress.$get({ 
      query: { projectId, ...filters } 
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

// Export generation mutation
export const useGenerateExport = () => {
  return useMutation({
    mutationFn: (options: ExportOptions) => 
      apiClient.reports.export.$post({ json: options }),
    onSuccess: (data) => {
      // Handle successful export
      toast.success('Export generated successfully');
    },
    onError: (error) => {
      toast.error('Failed to generate export');
    },
  });
};
```

### next-intl Message Keys
```json
{
  "reports": {
    "landing": {
      "title": "Reports Dashboard",
      "description": "Generate comprehensive project reports"
    },
    "progress": {
      "title": "Progress Summary",
      "rocWeighted": "ROC Weighted: {percent}%",
      "simpleCount": "Simple Count: {percent}%"
    },
    "export": {
      "dialog": {
        "title": "Export Report",
        "formatLabel": "Export Format",
        "optionsLabel": "Export Options"
      }
    },
    "accessibility": {
      "progressBar": "Progress: {percent} percent complete",
      "expandSection": "Expand {section} section",
      "sortColumn": "Sort by {column}"
    }
  }
}
```

This comprehensive component specification provides the foundation for implementing all reporting module interfaces with consistent design patterns, performance optimizations, and accessibility features aligned with PipeTrak's field-first requirements.
