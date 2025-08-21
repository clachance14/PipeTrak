# Mobile Interface - Reporting Module

Mobile-first responsive design for PipeTrak reporting, optimized for field use with tablets and smartphones in construction environments.

## Design Principles

### Field-First Requirements
- **Glove-friendly**: 44px minimum touch targets, high contrast
- **Outdoor visibility**: High contrast ratios, anti-glare considerations
- **One-handed operation**: Critical actions accessible with thumb reach
- **Offline capability**: Cached data with clear sync indicators
- **Battery optimization**: Efficient rendering, minimal background processing

### Device-Specific Optimizations
- **Primary: Tablet (768px-1024px)** - Main field device for detailed work
- **Secondary: Large Mobile (414px-768px)** - Quick checks and updates
- **Tertiary: Small Mobile (320px-414px)** - Emergency access only

### Progressive Enhancement
- Core functionality works on all devices
- Enhanced features for larger screens
- Graceful degradation for older devices
- Adaptive UI based on connection quality

---

## Responsive Breakpoints

### PipeTrak Mobile Breakpoint System
```css
/* Mobile-first approach */
.reports-mobile {
  /* Small mobile: 320px-413px */
  @media (max-width: 413px) {
    --cols: 1;
    --spacing: 12px;
    --text-scale: 0.9;
    --touch-target: 48px;
  }
  
  /* Large mobile: 414px-767px */
  @media (min-width: 414px) and (max-width: 767px) {
    --cols: 2;
    --spacing: 16px;
    --text-scale: 1;
    --touch-target: 44px;
  }
  
  /* Tablet: 768px-1023px */
  @media (min-width: 768px) and (max-width: 1023px) {
    --cols: 3;
    --spacing: 20px;
    --text-scale: 1.1;
    --touch-target: 40px;
  }
  
  /* Desktop: 1024px+ */
  @media (min-width: 1024px) {
    --cols: 4;
    --spacing: 24px;
    --text-scale: 1;
    --touch-target: 36px;
  }
}
```

### Responsive Grid System
```tsx
function ResponsiveGrid({ children, minWidth = 280 }) {
  return (
    <div 
      className="grid gap-4 auto-fit-grid"
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}px, 1fr))`
      }}
    >
      {children}
    </div>
  );
}
```

---

## Mobile Reports Landing Page

### Layout Adaptation
**Mobile Portrait (320px-768px)**:
```
┌──────────────────────────────────────┐
│ ☰ PipeTrak Reports           🔔 🚾       │
├──────────────────────────────────────┤
│ Quick Metrics (Horizontal Scroll)     │
│ ┌──────┐ ┌──────┐ ┌──────┐ ←→       │
│ │67.3%│ │1.2k │ │23   │           │
│ │ROC  │ │Comp │ │Ready│           │
│ └──────┘ └──────┘ └──────┘           │
├──────────────────────────────────────┤
│ Report Types (Single Column)          │
│                                      │
│ ┏━━ Progress Summary ━━━━━━━━━━━━━┓ │
│ ┃ 📊 67% complete • Tap to view    ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│                                      │
│ ┏━━ Component Details ━━━━━━━━━━━┓ │
│ ┃ 📝 1.8k items • Filter & export ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│                                      │
│ ┏━━ Test Package Status ━━━━━━━━━┓ │
│ ┃ ✓ 23 ready • ⚠ 5 blocked       ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
├──────────────────────────────────────┤
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ 🔄 Pull down to refresh data        ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
└──────────────────────────────────────┘
```

**Implementation**:
```tsx
function MobileReportsLanding() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data: metrics } = useQuickMetrics();
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries(['reports']);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  return (
    <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing}>
      <div className="space-y-4 p-4">
        {/* Mobile header */}
        <MobileHeader title="Reports" />
        
        {/* Horizontal scrolling metrics */}
        <ScrollArea className="w-full" orientation="horizontal">
          <div className="flex space-x-3 pb-2">
            {metrics?.map((metric, index) => (
              <QuickMetricCard
                key={index}
                metric={metric}
                className="min-w-[120px] flex-shrink-0"
                size="compact"
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        
        {/* Single column report types */}
        <div className="space-y-3">
          {reportTypes.map(type => (
            <MobileReportCard
              key={type.id}
              type={type}
              onClick={() => navigateToReport(type.id)}
            />
          ))}
        </div>
        
        {/* Recent activity */}
        <MobileRecentActivity limit={3} />
      </div>
    </PullToRefresh>
  );
}
```

### Mobile Header Component
```tsx
function MobileHeader({ title, onBack, actions }) {
  return (
    <div className="flex items-center justify-between h-14 -mx-4 px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b sticky top-0 z-10">
      <div className="flex items-center space-x-3">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <h1 className="font-semibold text-lg truncate">{title}</h1>
      </div>
      
      <div className="flex items-center space-x-2">
        {actions?.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || 'ghost'}
            size="sm"
            onClick={action.onClick}
            className="min-w-[44px] min-h-[44px]"
          >
            {action.icon}
            <span className="sr-only">{action.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
```

---

## Mobile Progress Dashboard

### Stacked Layout
**Mobile Progress Dashboard**:
```
┌──────────────────────────────────────┐
│ ← Progress Report              📤 ⋮    │
├──────────────────────────────────────┤
│ ROC Hero (Full Width)                │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃     67.3% ROC Weighted         ┃ │
│ ┃   █████████████░░░░░░ 67%     ┃ │
│ ┃   1,247 of 1,856 complete       ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
├──────────────────────────────────────┤
│ Area Breakdown (Swipeable Cards)       │
│ ┌──────────────────────────────────┐ │
│ │Area A   System 1      [89%] ▶│ │
│ │Area A   System 2      [76%] ▶│ │
│ │Area B   System 1      [45%] ▶│ │
│ └──────────────────────────────────┘ │
│ ◀ Swipe for more areas    1 of 3 ▶ │
├──────────────────────────────────────┤
│ Progress Chart (Tap to expand)        │
│ ┌──────────────────────────────────┐ │
│ │70%│         ┏━┓            │ │
│ │   │      ┏━━╧━╨━┓          │ │
│ │   │┏━━━━╧━━╨━━╨━━┓        │ │
│ │0%  ┼━━━━┼━━┼━━┼━━┼━━━━    │ │
│ └───┼────┼──┼──┼──┼────────┘ │
│   Aug  Sep Oct Nov Dec Jan       │
└──────────────────────────────────────┘
```

### Swipeable Area Cards
```tsx
function SwipeableAreaCards({ areaData, onAreaClick }) {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 3;
  const totalPages = Math.ceil(areaData.length / itemsPerPage);
  
  const { 
    register, 
    handleSwipe 
  } = useSwipeGestures({
    onSwipeLeft: () => setCurrentPage(Math.min(totalPages - 1, currentPage + 1)),
    onSwipeRight: () => setCurrentPage(Math.max(0, currentPage - 1)),
    threshold: 50
  });
  
  const currentItems = areaData.slice(
    currentPage * itemsPerPage, 
    (currentPage + 1) * itemsPerPage
  );
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Area Progress</CardTitle>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>{currentPage + 1} of {totalPages}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div 
          {...register}
          className="space-y-2 min-h-[180px]"
        >
          {currentItems.map(area => (
            <div 
              key={area.id}
              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer active:bg-muted/50 transition-colors"
              onClick={() => onAreaClick(area)}
            >
              <div className="flex-1">
                <div className="font-medium text-sm">{area.area}</div>
                <div className="text-xs text-muted-foreground">{area.system}</div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <div className="text-sm font-medium">{area.completionPercent}%</div>
                  <div className="text-xs text-muted-foreground">
                    {area.completedCount}/{area.totalCount}
                  </div>
                </div>
                <Progress 
                  value={area.completionPercent} 
                  className="w-12 h-2"
                />
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
        
        {/* Page indicators */}
        {totalPages > 1 && (
          <div className="flex justify-center space-x-1 mt-3">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  i === currentPage ? "bg-primary" : "bg-muted-foreground/30"
                )}
                onClick={() => setCurrentPage(i)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Mobile Component Table

### Simplified Table View
**Mobile Component List**:
```
┌──────────────────────────────────────┐
│ ← Components (1,856)    🔍 [Filter] │
├──────────────────────────────────────┤
│ Quick Filters (Chips)                 │
│ [All] [Area A] [Complete] [Stalled]   │
├──────────────────────────────────────┤
│ Component Cards                       │
│                                      │
│ ┏━━ CV-1401 Control Valve ━━━━━━━━┓ │
│ ┃ Area A • System 1 • 89% complete  ┃ │
│ ┃ █████████░░ Last: 2h ago     ┃ │
│ ┃ [Test] [Complete] [History]      ▼┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│                                      │
│ ┏━━ HX-2301 Heat Exchanger ━━━━━━┓ │
│ ┃ Area B • System 2 • 45% complete  ┃ │
│ ┃ █████░░░░░░ Last: 1d ago     ┃ │
│ ┃ [Connect] [Test] [Complete]  ▼┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│                                      │
│ ⋮ (Virtual Scrolling)                 │
├──────────────────────────────────────┤
│ Showing 50 of 1,856 • Updated 5m ago │
└──────────────────────────────────────┘
```

### Mobile Component Card
```tsx
function MobileComponentCard({ component, onMilestoneUpdate, onExpand }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const handleMilestoneClick = async (milestone) => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      await onMilestoneUpdate(component.id, milestone.id);
      // Show success feedback
      toast.success(`${milestone.name} updated`);
    } catch (error) {
      toast.error('Failed to update milestone');
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <Card className="relative">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">
              {component.componentId}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {component.description}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 ml-2"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {/* Status and progress */}
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center space-x-1 text-muted-foreground">
            <span>{component.area}</span>
            <span>•</span>
            <span>{component.system}</span>
            <span>•</span>
            <span className="font-medium text-foreground">
              {component.completionPercent}% complete
            </span>
          </div>
          <span className="text-muted-foreground">
            {formatTimeAgo(component.lastUpdated)}
          </span>
        </div>
        
        {/* Progress bar */}
        <Progress 
          value={component.completionPercent} 
          className="h-2 mb-3"
        />
        
        {/* Milestone actions */}
        <div className="flex flex-wrap gap-2">
          {component.availableMilestones.slice(0, isExpanded ? undefined : 3).map(milestone => (
            <Button
              key={milestone.id}
              variant={milestone.isComplete ? "default" : "outline"}
              size="sm"
              onClick={() => handleMilestoneClick(milestone)}
              disabled={isUpdating}
              className={cn(
                "text-xs h-8 flex-shrink-0",
                milestone.isComplete && "bg-success hover:bg-success/90"
              )}
            >
              {isUpdating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : milestone.isComplete ? (
                <Check className="h-3 w-3 mr-1" />
              ) : null}
              {milestone.name}
            </Button>
          ))}
          
          {!isExpanded && component.availableMilestones.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="text-xs h-8"
            >
              +{component.availableMilestones.length - 3} more
            </Button>
          )}
        </div>
        
        {/* Expanded details */}
        <Collapsible open={isExpanded}>
          <CollapsibleContent className="mt-3 pt-3 border-t">
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">Drawing</div>
                  <div className="font-medium">{component.drawingNumber}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Test Package</div>
                  <div className="font-medium">{component.testPackage || 'None'}</div>
                </div>
              </div>
              
              {component.notes && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Notes</div>
                  <div className="text-xs bg-muted/30 p-2 rounded">
                    {component.notes}
                  </div>
                </div>
              )}
              
              <div className="flex space-x-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <History className="h-3 w-3 mr-1" />
                  History
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Drawing
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
```

---

## Mobile Test Package Interface

### Touch-Optimized Checklist
```tsx
function MobileTestPackageChecklist({ packages, onStatusUpdate }) {
  const [selectedPackage, setSelectedPackage] = useState(null);
  
  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-success/20 bg-success/5">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-success">
              {packages.filter(p => p.status === 'ready').length}
            </div>
            <div className="text-sm text-muted-foreground">Ready</div>
          </CardContent>
        </Card>
        
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-destructive">
              {packages.filter(p => p.status === 'blocked').length}
            </div>
            <div className="text-sm text-muted-foreground">Blocked</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Package list */}
      <div className="space-y-3">
        {packages.map(pkg => (
          <MobilePackageCard
            key={pkg.id}
            package={pkg}
            isSelected={selectedPackage === pkg.id}
            onSelect={() => setSelectedPackage(
              selectedPackage === pkg.id ? null : pkg.id
            )}
            onStatusUpdate={onStatusUpdate}
          />
        ))}
      </div>
    </div>
  );
}

function MobilePackageCard({ package: pkg, isSelected, onSelect, onStatusUpdate }) {
  const getStatusIcon = () => {
    switch (pkg.status) {
      case 'ready': return <CheckCircle className="h-5 w-5 text-success" />;
      case 'blocked': return <XCircle className="h-5 w-5 text-destructive" />;
      case 'nearly-ready': return <AlertCircle className="h-5 w-5 text-warning" />;
      default: return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };
  
  const getStatusColor = () => {
    switch (pkg.status) {
      case 'ready': return 'border-l-success';
      case 'blocked': return 'border-l-destructive';
      case 'nearly-ready': return 'border-l-warning';
      default: return 'border-l-muted';
    }
  };
  
  return (
    <Card className={cn("border-l-4 transition-all duration-200", getStatusColor())}>
      <CardContent className="p-4">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={onSelect}
        >
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {getStatusIcon()}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">{pkg.packageName}</h3>
              <p className="text-xs text-muted-foreground truncate">{pkg.packageId}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <div className="text-sm font-medium">
                {pkg.completedComponents}/{pkg.totalComponents}
              </div>
              <div className="text-xs text-muted-foreground">
                {pkg.completionPercent}%
              </div>
            </div>
            <ChevronDown 
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                isSelected && "rotate-180"
              )}
            />
          </div>
        </div>
        
        <Collapsible open={isSelected}>
          <CollapsibleContent className="mt-4 pt-4 border-t">
            {pkg.status === 'blocked' && (
              <div className="space-y-3">
                <div className="text-sm font-medium text-destructive">
                  Blocking Components ({pkg.blockingComponents.length})
                </div>
                
                <div className="space-y-2">
                  {pkg.blockingComponents.slice(0, 3).map(component => (
                    <div 
                      key={component.id}
                      className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {component.componentId}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Needs: {component.nextMilestone}
                        </div>
                      </div>
                      
                      <Switch
                        checked={false}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            onStatusUpdate(component.id, component.nextMilestone);
                          }
                        }}
                        className="ml-2"
                      />
                    </div>
                  ))}
                  
                  {pkg.blockingComponents.length > 3 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                    >
                      View all {pkg.blockingComponents.length} components
                    </Button>
                  )}
                </div>
              </div>
            )}
            
            {pkg.status === 'ready' && (
              <div className="text-center py-4">
                <div className="text-sm text-success mb-2">
                  ✓ All components complete
                </div>
                <Button className="w-full bg-success hover:bg-success/90">
                  Sign Off Package
                </Button>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
```

---

## Mobile Bottom Navigation

### Persistent Actions Bar
```tsx
function MobileBottomActions({ selectedCount, onExport, onBulkUpdate, onClearSelection }) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(selectedCount > 0);
  }, [selectedCount]);
  
  return (
    <div 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300",
        "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "border-t shadow-lg",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">
            {selectedCount} component{selectedCount !== 1 ? 's' : ''} selected
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearSelection}
          >
            Clear
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            size="lg" 
            onClick={onExport}
            className="h-12"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button 
            size="lg" 
            onClick={onBulkUpdate}
            className="h-12"
          >
            <Edit className="h-4 w-4 mr-2" />
            Update
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## Offline Support

### Offline Indicator and Sync
```tsx
function MobileOfflineSupport({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingUpdates, setPendingUpdates] = useState([]);
  const [lastSync, setLastSync] = useState(null);
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingUpdates();
    };
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const syncPendingUpdates = async () => {
    if (pendingUpdates.length === 0) return;
    
    try {
      // Batch sync pending updates
      await Promise.all(
        pendingUpdates.map(update => apiClient.sync.$post({ json: update }))
      );
      
      setPendingUpdates([]);
      setLastSync(new Date());
      toast.success(`Synced ${pendingUpdates.length} updates`);
    } catch (error) {
      toast.error('Failed to sync updates');
    }
  };
  
  return (
    <>
      {/* Offline indicator */}
      <div 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          "bg-orange-500 text-white text-sm py-2 px-4 text-center",
          !isOnline ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className="flex items-center justify-center space-x-2">
          <WifiOff className="h-4 w-4" />
          <span>
            You're offline. Changes will sync when connected.
            {pendingUpdates.length > 0 && (
              <span className="ml-2 font-medium">
                ({pendingUpdates.length} pending)
              </span>
            )}
          </span>
        </div>
      </div>
      
      {/* Main content with offline padding */}
      <div className={cn(
        "transition-all duration-300",
        !isOnline && "pt-10"
      )}>
        {children}
      </div>
      
      {/* Sync status */}
      {isOnline && lastSync && (
        <div className="fixed bottom-4 right-4 z-40">
          <Card className="bg-success/10 border-success/20">
            <CardContent className="p-2 flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="text-xs text-success">
                Synced {formatTimeAgo(lastSync)}
              </span>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
```

---

## Performance Optimizations

### Mobile Virtual Scrolling
```tsx
function MobileVirtualList({ items, renderItem, itemHeight = 100 }) {
  const [containerHeight, setContainerHeight] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);
  
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );
  
  const visibleItems = items.slice(visibleStart, visibleEnd);
  
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };
    
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);
  
  return (
    <div 
      ref={containerRef}
      className="h-full overflow-auto"
      onScroll={(e) => setScrollTop(e.target.scrollTop)}
    >
      <div 
        className="relative"
        style={{ height: items.length * itemHeight }}
      >
        <div 
          className="absolute top-0 left-0 right-0"
          style={{ 
            transform: `translateY(${visibleStart * itemHeight}px)` 
          }}
        >
          {visibleItems.map((item, index) => (
            <div 
              key={item.id || visibleStart + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, visibleStart + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Image Optimization
```tsx
function OptimizedImage({ src, alt, className, ...props }) {
  const [imageSrc, setImageSrc] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Use different image sizes based on screen size
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const isMobile = mediaQuery.matches;
    
    // Generate responsive image URL
    const responsiveSrc = isMobile 
      ? `${src}?w=400&h=300&q=80` 
      : `${src}?w=800&h=600&q=90`;
    
    setImageSrc(responsiveSrc);
  }, [src]);
  
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      
      <img
        src={imageSrc}
        alt={alt}
        onLoad={() => setIsLoading(false)}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        loading="lazy"
        {...props}
      />
    </div>
  );
}
```

---

## Accessibility Features

### Mobile Screen Reader Support
```tsx
function MobileAccessibleTable({ data, onItemSelect }) {
  const [announceText, setAnnounceText] = useState('');
  
  const announceToScreenReader = (text) => {
    setAnnounceText(text);
    setTimeout(() => setAnnounceText(''), 100);
  };
  
  const handleItemSelect = (item, isSelected) => {
    onItemSelect(item.id, isSelected);
    announceToScreenReader(
      `${item.componentId} ${isSelected ? 'selected' : 'deselected'}`
    );
  };
  
  return (
    <>
      {/* Screen reader announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        {announceText}
      </div>
      
      {/* Mobile accessible list */}
      <div 
        role="list" 
        aria-label="Components list"
        className="space-y-2"
      >
        {data.map((item, index) => (
          <div
            key={item.id}
            role="listitem"
            aria-posinset={index + 1}
            aria-setsize={data.length}
            className="focus-within:ring-2 focus-within:ring-primary rounded-lg"
          >
            <MobileComponentCard
              component={item}
              onSelect={(isSelected) => handleItemSelect(item, isSelected)}
              aria-describedby={`component-${item.id}-description`}
            />
          </div>
        ))}
      </div>
    </>
  );
}
```

### High Contrast Mobile Support
```tsx
function useHighContrastMobile() {
  const [isHighContrast, setIsHighContrast] = useState(false);
  
  useEffect(() => {
    // Check for high contrast preference
    const mediaQuery = window.matchMedia(
      '(prefers-contrast: high), (-ms-high-contrast: active)'
    );
    
    setIsHighContrast(mediaQuery.matches);
    
    const handleChange = (e) => {
      setIsHighContrast(e.matches);
      
      // Apply mobile-specific high contrast styles
      if (e.matches) {
        document.body.classList.add('mobile-high-contrast');
      } else {
        document.body.classList.remove('mobile-high-contrast');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return isHighContrast;
}
```

This comprehensive mobile interface specification ensures PipeTrak's reporting module delivers excellent user experiences on tablets and smartphones used in construction field environments, with proper consideration for touch interaction, offline capability, and accessibility requirements.
