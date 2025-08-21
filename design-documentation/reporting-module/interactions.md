# Interactions - Reporting Module

Comprehensive interaction patterns for the PipeTrak reporting module, including keyboard shortcuts, gesture controls, and Excel-like navigation behaviors.

## Design Philosophy

### Excel-Like Familiarity
PipeTrak reporting interfaces mirror Excel behaviors that users know and expect:
- Arrow keys for cell navigation
- Tab/Shift+Tab for column movement
- Enter to confirm actions or expand details
- Space to toggle selections
- Ctrl+key combinations for advanced actions

### Field-First Optimization
- **Desktop**: Fast keyboard workflows for PMs
- **Tablet**: Touch-optimized with precision controls
- **Mobile**: Gesture-based navigation with large targets

### Progressive Disclosure
- Start with essential actions visible
- Reveal advanced features through progressive interaction
- Context-sensitive menus and shortcuts
- Adaptive UI based on user behavior patterns

---

## Universal Keyboard Shortcuts

### Global Navigation
```
Ctrl + 1-5     → Navigate to report types (1=Progress, 2=Components, etc.)
Ctrl + R       → Refresh current report data
Ctrl + E       → Open export dialog
Ctrl + F       → Focus search/filter input
Ctrl + H       → Show/hide help overlay
Escape         → Close modals, cancel operations, clear selections
F5             → Full page refresh
Ctrl + Z       → Undo last action (where applicable)
```

### Report-Specific Shortcuts
```
Space          → Toggle row selection (in tables)
Ctrl + A       → Select all visible items
Ctrl + Shift + A → Deselect all items
Enter          → Expand/collapse details or confirm action
Ctrl + C       → Copy selected data to clipboard
Ctrl + Shift + E → Export selected items only
Ctrl + D       → Duplicate current filter/view
Ctrl + S       → Save current view as template
```

### Table Navigation (Excel-like)
```
←→↑↓           → Navigate between cells/rows
Home/End       → Jump to first/last column
Ctrl + Home    → Jump to first cell
Ctrl + End     → Jump to last cell
Page Up/Down   → Jump by visible page
Ctrl + Page Up/Down → Jump to first/last row
Tab/Shift+Tab  → Move between columns
```

---

## Reports Landing Page Interactions

### Card Navigation
**Mouse/Touch Interactions**:
- **Click/Tap**: Navigate to report type
- **Right-click**: Context menu with quick actions
- **Double-click**: Open report in new tab
- **Hover**: Show preview metrics

**Keyboard Navigation**:
```
Tab            → Move between report type cards
Enter/Space    → Activate selected card
Arrow Keys     → Navigate card grid (2D navigation)
Ctrl + Enter   → Open in new tab
```

**Implementation**:
```tsx
function ReportTypeCard({ type, onActivate, onPreview }) {
  const [isFocused, setIsFocused] = useState(false);
  const cardRef = useRef(null);
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isFocused) return;
      
      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          onActivate(type);
          break;
        case 'ArrowRight':
          focusNextCard('right');
          break;
        case 'ArrowLeft':
          focusNextCard('left');
          break;
        case 'ArrowDown':
          focusNextCard('down');
          break;
        case 'ArrowUp':
          focusNextCard('up');
          break;
      }
    };
    
    cardRef.current?.addEventListener('keydown', handleKeyDown);
    return () => cardRef.current?.removeEventListener('keydown', handleKeyDown);
  }, [isFocused, onActivate]);
  
  return (
    <Card
      ref={cardRef}
      tabIndex={0}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onMouseEnter={() => onPreview(type)}
      className={cn(
        "cursor-pointer transition-all duration-200",
        "hover:shadow-lg hover:scale-[1.02]",
        "focus:ring-2 focus:ring-primary focus:outline-none",
        isFocused && "ring-2 ring-primary"
      )}
    >
      {/* Card content */}
    </Card>
  );
}
```

### Quick Actions Menu
**Trigger**: Right-click on report cards or Shift+F10
**Options**:
- Generate Now
- View Last Report
- Schedule Delivery
- Configure Template
- Share with Team

---

## Progress Dashboard Interactions

### ROC Hero Bar
**Interactive Elements**:
- **Click ROC percentage**: Show calculation breakdown
- **Click component counts**: Filter to completed/incomplete
- **Hover metrics**: Show trend arrows and change indicators

**Calculation Breakdown Modal**:
```tsx
function ROCBreakdownModal({ isOpen, onClose, rocData }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>ROC Calculation Breakdown</DialogTitle>
          <DialogDescription>
            Detailed view of milestone weights and completion progress
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Milestone Weights</CardTitle>
              </CardHeader>
              <CardContent>
                {rocData.weights.map(weight => (
                  <div key={weight.milestone} className="flex justify-between py-1">
                    <span className="text-sm">{weight.milestone}</span>
                    <span className="text-sm font-medium">{weight.percent}%</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Completion Status</CardTitle>
              </CardHeader>
              <CardContent>
                {rocData.completion.map(status => (
                  <div key={status.milestone} className="flex justify-between py-1">
                    <span className="text-sm">{status.milestone}</span>
                    <span className="text-sm font-medium">
                      {status.completed}/{status.total}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          
          <Alert>
            <Calculator className="h-4 w-4" />
            <AlertTitle>Calculation Formula</AlertTitle>
            <AlertDescription>
              ROC % = Σ(Milestone Weight × Completion Rate) for all milestones
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Area System Breakdown
**Grid Interactions**:
- **Click area card**: Drill down to component list
- **Double-click**: Open in detailed view
- **Right-click**: Context menu with export/filter options
- **Shift+click**: Multi-select for comparison

**Drill-down Navigation**:
```tsx
function AreaSystemGrid({ data, onDrillDown }) {
  const [selectedItems, setSelectedItems] = useState(new Set());
  
  const handleItemClick = (item, event) => {
    if (event.shiftKey) {
      // Multi-select mode
      const newSelected = new Set(selectedItems);
      if (newSelected.has(item.id)) {
        newSelected.delete(item.id);
      } else {
        newSelected.add(item.id);
      }
      setSelectedItems(newSelected);
    } else if (event.ctrlKey || event.metaKey) {
      // Open in new tab
      window.open(`/reports/components?area=${item.area}&system=${item.system}`, '_blank');
    } else {
      // Single selection and drill-down
      setSelectedItems(new Set([item.id]));
      onDrillDown(item.area, item.system);
    }
  };
  
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {data.map(item => (
        <AreaSystemCard
          key={item.id}
          data={item}
          isSelected={selectedItems.has(item.id)}
          onClick={(e) => handleItemClick(item, e)}
        />
      ))}
    </div>
  );
}
```

### Progress Charts
**Chart Interactions**:
- **Hover**: Show detailed tooltips with exact values
- **Click data point**: Drill down to that time period's components
- **Drag**: Zoom into time range
- **Double-click**: Reset zoom
- **Right-click**: Export chart as image

**Custom Chart Tooltip**:
```tsx
function CustomChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  
  return (
    <Card className="p-3 shadow-lg border-primary/20">
      <div className="space-y-2">
        <div className="font-medium text-sm">
          {format(new Date(label), 'MMM dd, yyyy')}
        </div>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center space-x-2 text-xs">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">
              {typeof entry.value === 'number' 
                ? `${entry.value.toFixed(1)}%` 
                : entry.value}
            </span>
          </div>
        ))}
        <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
          Click to view components from this date
        </div>
      </div>
    </Card>
  );
}
```

---

## Component Report Interface Interactions

### Advanced Filter Panel
**Collapsible Behavior**:
```tsx
function AdvancedFilterPanel({ isCollapsed, onToggle }) {
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  
  // Auto-expand when filters are applied
  useEffect(() => {
    if (hasActiveFilters && isCollapsed) {
      onToggle();
    }
  }, [hasActiveFilters]);
  
  return (
    <Card>
      <CardHeader 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-base">Advanced Filters</CardTitle>
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs">
                {activeFilterCount} active
              </Badge>
            )}
          </div>
          <ChevronDown 
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              !isCollapsed && "rotate-180"
            )}
          />
        </div>
      </CardHeader>
      
      <Collapsible open={!isCollapsed}>
        <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out">
          <CardContent>
            {/* Filter controls */}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
```

### Virtualized Data Table
**Excel-like Navigation**:
```tsx
function VirtualizedTable({ data, columns }) {
  const [focusedCell, setFocusedCell] = useState({ row: 0, col: 0 });
  const [selectedRows, setSelectedRows] = useState(new Set());
  const tableRef = useRef(null);
  
  const handleKeyDown = useCallback((e) => {
    const { row, col } = focusedCell;
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        setFocusedCell({ row: Math.max(0, row - 1), col });
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedCell({ row: Math.min(data.length - 1, row + 1), col });
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setFocusedCell({ row, col: Math.max(0, col - 1) });
        break;
      case 'ArrowRight':
        e.preventDefault();
        setFocusedCell({ row, col: Math.min(columns.length - 1, col + 1) });
        break;
      case 'Home':
        e.preventDefault();
        if (e.ctrlKey) {
          setFocusedCell({ row: 0, col: 0 });
        } else {
          setFocusedCell({ row, col: 0 });
        }
        break;
      case 'End':
        e.preventDefault();
        if (e.ctrlKey) {
          setFocusedCell({ row: data.length - 1, col: columns.length - 1 });
        } else {
          setFocusedCell({ row, col: columns.length - 1 });
        }
        break;
      case ' ':
        e.preventDefault();
        toggleRowSelection(row);
        break;
      case 'Enter':
        e.preventDefault();
        onRowActivate?.(data[row]);
        break;
      case 'Escape':
        setSelectedRows(new Set());
        break;
    }
  }, [focusedCell, data, columns]);
  
  useEffect(() => {
    tableRef.current?.addEventListener('keydown', handleKeyDown);
    return () => tableRef.current?.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  return (
    <div 
      ref={tableRef}
      tabIndex={0}
      className="focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <FixedSizeList
        height={600}
        itemCount={data.length}
        itemSize={48}
      >
        {({ index, style }) => (
          <TableRow
            style={style}
            data={data[index]}
            isSelected={selectedRows.has(index)}
            isFocused={focusedCell.row === index}
            focusedCol={focusedCell.row === index ? focusedCell.col : -1}
          />
        )}
      </FixedSizeList>
    </div>
  );
}
```

### Column Management
**Resize Interactions**:
```tsx
function ResizableColumn({ column, width, onResize }) {
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(width);
  
  const handleMouseDown = (e) => {
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(width);
    document.body.style.cursor = 'col-resize';
  };
  
  const handleMouseMove = useCallback((e) => {
    if (!isResizing) return;
    
    const diff = e.clientX - startX;
    const newWidth = Math.max(50, startWidth + diff); // Minimum width 50px
    onResize(column.key, newWidth);
  }, [isResizing, startX, startWidth, onResize]);
  
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = 'default';
  }, []);
  
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);
  
  return (
    <div 
      className="relative flex items-center px-3 py-2 border-r"
      style={{ width }}
    >
      <span className="text-sm font-medium truncate">{column.label}</span>
      <div
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/20 transition-colors"
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}
```

### Bulk Selection
**Selection Patterns**:
```typescript
// Selection state management
interface SelectionState {
  selectedIds: Set<string>;
  lastSelectedIndex: number;
  isSelectAllMode: boolean;
}

function useBulkSelection(items: any[]) {
  const [selection, setSelection] = useState<SelectionState>({
    selectedIds: new Set(),
    lastSelectedIndex: -1,
    isSelectAllMode: false,
  });
  
  const toggleItem = (id: string, index: number, event?: React.MouseEvent) => {
    setSelection(prev => {
      const newSelectedIds = new Set(prev.selectedIds);
      
      if (event?.shiftKey && prev.lastSelectedIndex !== -1) {
        // Range selection
        const start = Math.min(prev.lastSelectedIndex, index);
        const end = Math.max(prev.lastSelectedIndex, index);
        
        for (let i = start; i <= end; i++) {
          if (items[i]) {
            newSelectedIds.add(items[i].id);
          }
        }
      } else if (event?.ctrlKey || event?.metaKey) {
        // Multi-selection
        if (newSelectedIds.has(id)) {
          newSelectedIds.delete(id);
        } else {
          newSelectedIds.add(id);
        }
      } else {
        // Single selection
        newSelectedIds.clear();
        newSelectedIds.add(id);
      }
      
      return {
        selectedIds: newSelectedIds,
        lastSelectedIndex: index,
        isSelectAllMode: newSelectedIds.size === items.length,
      };
    });
  };
  
  const selectAll = () => {
    setSelection({
      selectedIds: new Set(items.map(item => item.id)),
      lastSelectedIndex: -1,
      isSelectAllMode: true,
    });
  };
  
  const clearSelection = () => {
    setSelection({
      selectedIds: new Set(),
      lastSelectedIndex: -1,
      isSelectAllMode: false,
    });
  };
  
  return {
    ...selection,
    toggleItem,
    selectAll,
    clearSelection,
    selectedCount: selection.selectedIds.size,
  };
}
```

---

## Test Package Readiness Interactions

### Status Card Navigation
**Card Interactions**:
- **Click**: Expand to show component details
- **Double-click**: Open in dedicated view
- **Right-click**: Quick actions menu
- **Swipe left/right** (mobile): Navigate between packages

**Mobile Swipe Gestures**:
```tsx
function SwipeablePackageCard({ package: pkg, onSwipe }) {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  
  const minSwipeDistance = 50;
  
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      onSwipe('left', pkg.packageId);
    } else if (isRightSwipe) {
      onSwipe('right', pkg.packageId);
    }
  };
  
  return (
    <Card
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="cursor-pointer select-none"
    >
      {/* Card content */}
    </Card>
  );
}
```

### Field Verification Checklist
**Touch-Optimized Controls**:
```tsx
function FieldVerificationChecklist({ components, onUpdate }) {
  return (
    <div className="space-y-2">
      {components.map(component => (
        <div 
          key={component.id}
          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <Switch
              id={`component-${component.id}`}
              checked={component.isComplete}
              onCheckedChange={(checked) => 
                onUpdate(component.id, { isComplete: checked })
              }
              className="data-[state=checked]:bg-success"
            />
            <div>
              <Label 
                htmlFor={`component-${component.id}`}
                className="text-sm font-medium cursor-pointer"
              >
                {component.componentId}
              </Label>
              <div className="text-xs text-muted-foreground">
                {component.description}
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openComponentDetails(component.id)}
          >
            <ExternalLink className="h-4 w-4" />
            <span className="sr-only">View component details</span>
          </Button>
        </div>
      ))}
    </div>
  );
}
```

---

## Trend Analysis Interactions

### Interactive Charts
**Zoom and Pan**:
```tsx
function InteractiveVelocityChart({ data }) {
  const [zoomDomain, setZoomDomain] = useState(null);
  const [isPanning, setIsPanning] = useState(false);
  
  const handleZoom = (domain) => {
    setZoomDomain(domain);
  };
  
  const resetZoom = () => {
    setZoomDomain(null);
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Completion Velocity</CardTitle>
          <div className="flex items-center space-x-2">
            {zoomDomain && (
              <Button variant="outline" size="sm" onClick={resetZoom}>
                <ZoomOut className="h-4 w-4 mr-1" />
                Reset Zoom
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => exportChartAsImage('png')}>
                  Export as PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportChartAsImage('svg')}>
                  Export as SVG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportChartData()}>
                  Export Data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart 
            data={data}
            onMouseDown={() => setIsPanning(true)}
            onMouseUp={() => setIsPanning(false)}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date"
              domain={zoomDomain ? [zoomDomain.left, zoomDomain.right] : ['dataMin', 'dataMax']}
              type="number"
              scale="time"
            />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="velocity" 
              stroke="#8884d8" 
            />
            {/* Brush for zooming */}
            <Brush 
              dataKey="date" 
              height={30}
              onChange={handleZoom}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

### Heat Map Interactions
**Cell Selection and Drill-down**:
```tsx
function InteractiveHeatMap({ data, onCellClick }) {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [selectedCells, setSelectedCells] = useState(new Set());
  
  const handleCellClick = (area, milestone, event) => {
    const cellId = `${area}-${milestone}`;
    
    if (event.ctrlKey || event.metaKey) {
      // Multi-select
      const newSelected = new Set(selectedCells);
      if (newSelected.has(cellId)) {
        newSelected.delete(cellId);
      } else {
        newSelected.add(cellId);
      }
      setSelectedCells(newSelected);
    } else {
      // Single select and drill down
      setSelectedCells(new Set([cellId]));
      onCellClick(area, milestone);
    }
  };
  
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px] space-y-1">
        {data.areas.map(area => (
          <div key={area} className="grid grid-cols-7 gap-1">
            <div className="p-2 text-sm font-medium bg-muted rounded">
              {area}
            </div>
            {data.milestones.map(milestone => {
              const cellId = `${area}-${milestone}`;
              const intensity = getIntensity(area, milestone);
              const isHovered = hoveredCell === cellId;
              const isSelected = selectedCells.has(cellId);
              
              return (
                <div
                  key={milestone}
                  className={cn(
                    "p-2 rounded cursor-pointer text-center transition-all duration-200",
                    "hover:scale-105 hover:shadow-md",
                    getIntensityColor(intensity),
                    isSelected && "ring-2 ring-primary",
                    isHovered && "brightness-110"
                  )}
                  onMouseEnter={() => setHoveredCell(cellId)}
                  onMouseLeave={() => setHoveredCell(null)}
                  onClick={(e) => handleCellClick(area, milestone, e)}
                >
                  <div className="text-xs font-medium">
                    {getBottleneckCount(area, milestone)}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Export Dialog Interactions

### Progressive Options
**Format-dependent Options**:
```tsx
function ExportDialog({ isOpen, onClose, onExport }) {
  const [exportFormat, setExportFormat] = useState('excel');
  const [options, setOptions] = useState({
    includeCharts: true,
    rocCalculations: true,
    emailDelivery: false,
  });
  
  const formatOptions = {
    excel: {
      available: ['includeCharts', 'rocCalculations', 'emailDelivery'],
      recommended: ['includeCharts', 'rocCalculations'],
    },
    pdf: {
      available: ['includeCharts', 'emailDelivery'],
      recommended: ['includeCharts'],
    },
    csv: {
      available: ['emailDelivery'],
      recommended: [],
    },
  };
  
  const currentOptions = formatOptions[exportFormat];
  
  // Auto-adjust options when format changes
  useEffect(() => {
    setOptions(prev => {
      const newOptions = { ...prev };
      
      // Disable unavailable options
      Object.keys(newOptions).forEach(key => {
        if (!currentOptions.available.includes(key)) {
          newOptions[key] = false;
        }
      });
      
      // Enable recommended options
      currentOptions.recommended.forEach(key => {
        newOptions[key] = true;
      });
      
      return newOptions;
    });
  }, [exportFormat]);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Report</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Format selection with preview */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <RadioGroup 
              value={exportFormat} 
              onValueChange={setExportFormat}
              className="grid grid-cols-3 gap-4"
            >
              {Object.entries(formatOptions).map(([format, config]) => (
                <div key={format}>
                  <RadioGroupItem 
                    value={format} 
                    id={format}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={format}
                    className={cn(
                      "flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 cursor-pointer",
                      "hover:bg-accent hover:text-accent-foreground",
                      "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    )}
                  >
                    <FormatIcon format={format} className="h-6 w-6 mb-2" />
                    <span className="text-sm font-medium capitalize">{format}</span>
                    <span className="text-xs text-muted-foreground text-center">
                      {getFormatDescription(format)}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          {/* Dynamic options based on format */}
          <div className="space-y-3">
            <Label>Export Options</Label>
            {Object.entries(options).map(([key, value]) => {
              const isAvailable = currentOptions.available.includes(key);
              const isRecommended = currentOptions.recommended.includes(key);
              
              if (!isAvailable) return null;
              
              return (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={value}
                    onCheckedChange={(checked) =>
                      setOptions(prev => ({ ...prev, [key]: checked }))
                    }
                  />
                  <Label htmlFor={key} className="flex items-center space-x-1">
                    <span>{getOptionLabel(key)}</span>
                    {isRecommended && (
                      <Badge variant="secondary" className="text-xs">
                        Recommended
                      </Badge>
                    )}
                  </Label>
                </div>
              );
            })}
          </div>
          
          {/* File size estimation with progress */}
          <EstimatedFileSize 
            format={exportFormat} 
            options={options}
            itemCount={itemCount}
          />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onExport(exportFormat, options)}>
            Generate Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Mobile Responsive Interactions

### Touch Gestures
**Gesture Recognition**:
```tsx
function useGestures(onSwipe, onPinch) {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isPinching, setIsPinching] = useState(false);
  
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setTouchStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      });
    } else if (e.touches.length === 2) {
      setIsPinching(true);
      const distance = getDistance(e.touches[0], e.touches[1]);
      onPinch?.('start', { distance });
    }
  };
  
  const handleTouchMove = (e) => {
    if (isPinching && e.touches.length === 2) {
      const distance = getDistance(e.touches[0], e.touches[1]);
      onPinch?.('move', { distance });
    } else if (e.touches.length === 1) {
      setTouchEnd({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      });
    }
  };
  
  const handleTouchEnd = (e) => {
    if (isPinching) {
      setIsPinching(false);
      onPinch?.('end', {});
      return;
    }
    
    if (!touchStart || !touchEnd) return;
    
    const deltaX = touchStart.x - touchEnd.x;
    const deltaY = touchStart.y - touchEnd.y;
    const deltaTime = touchEnd.time - touchStart.time;
    const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
    const velocity = distance / deltaTime;
    
    // Detect swipe gestures
    if (distance > 50 && velocity > 0.3) {
      const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
      
      let direction;
      if (Math.abs(angle) <= 45) direction = 'right';
      else if (Math.abs(angle) >= 135) direction = 'left';
      else if (angle > 0) direction = 'down';
      else direction = 'up';
      
      onSwipe?.(direction, { distance, velocity, deltaTime });
    }
  };
  
  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
}

function getDistance(touch1, touch2) {
  const deltaX = touch1.clientX - touch2.clientX;
  const deltaY = touch1.clientY - touch2.clientY;
  return Math.sqrt(deltaX ** 2 + deltaY ** 2);
}
```

### Pull-to-Refresh
```tsx
function PullToRefreshWrapper({ children, onRefresh }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  
  const threshold = 80;
  
  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
    }
  };
  
  const handleTouchMove = (e) => {
    if (startY === 0 || window.scrollY > 0) return;
    
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, (currentY - startY) * 0.5); // Damping
    setPullDistance(distance);
  };
  
  const handleTouchEnd = async () => {
    if (pullDistance > threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
    setStartY(0);
  };
  
  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Pull indicator */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 flex items-center justify-center transition-opacity duration-200",
          "bg-primary/5 text-primary text-sm font-medium",
          pullDistance > 0 ? "opacity-100" : "opacity-0"
        )}
        style={{
          height: Math.min(pullDistance, threshold),
          transform: `translateY(-${threshold - Math.min(pullDistance, threshold)}px)`,
        }}
      >
        {isRefreshing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Refreshing...
          </>
        ) : pullDistance > threshold ? (
          <>Release to refresh</>
        ) : pullDistance > 20 ? (
          <>Pull to refresh</>
        ) : null}
      </div>
      
      {/* Content */}
      <div
        style={{
          transform: `translateY(${Math.min(pullDistance, threshold)}px)`,
          transition: pullDistance === 0 ? 'transform 0.3s ease' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}
```

---

## Accessibility Interactions

### Screen Reader Navigation
```tsx
function AccessibleTable({ data, columns }) {
  const [announcementText, setAnnouncementText] = useState('');
  
  const announceToScreenReader = (text) => {
    setAnnouncementText(text);
    setTimeout(() => setAnnouncementText(''), 100);
  };
  
  const handleSortChange = (column, direction) => {
    announceToScreenReader(
      `Table sorted by ${column.label} ${direction === 'asc' ? 'ascending' : 'descending'}`
    );
  };
  
  const handleFilterChange = (activeFilters) => {
    const count = data.length;
    const filterText = activeFilters.length > 0 
      ? `${activeFilters.length} filters applied` 
      : 'no filters';
    
    announceToScreenReader(
      `Table updated. Showing ${count} components with ${filterText}`
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
        {announcementText}
      </div>
      
      {/* Table with proper ARIA attributes */}
      <div role="table" aria-label="Component data table">
        <div role="rowgroup" aria-label="Column headers">
          <div role="row">
            {columns.map((column, index) => (
              <div
                key={column.key}
                role="columnheader"
                aria-sort={getSortDirection(column.key)}
                aria-colindex={index + 1}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSort(column.key);
                  }
                }}
              >
                {column.label}
              </div>
            ))}
          </div>
        </div>
        
        <div role="rowgroup" aria-label="Table data">
          {data.map((item, rowIndex) => (
            <div 
              key={item.id}
              role="row"
              aria-rowindex={rowIndex + 2} // +2 for 1-based and header
              aria-selected={isSelected(item.id)}
            >
              {columns.map((column, colIndex) => (
                <div
                  key={column.key}
                  role="cell"
                  aria-colindex={colIndex + 1}
                  aria-describedby={getAriaDescribedBy(item, column)}
                >
                  {getCellContent(item, column)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
```

### High Contrast Mode Support
```tsx
function useHighContrastMode() {
  const [isHighContrast, setIsHighContrast] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(mediaQuery.matches);
    
    const handleChange = (e) => setIsHighContrast(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return isHighContrast;
}

function HighContrastChart({ data, isHighContrast }) {
  const colors = isHighContrast 
    ? {
        primary: '#000000',
        secondary: '#FFFFFF', 
        success: '#008000',
        warning: '#FFFF00',
        error: '#FF0000',
      }
    : {
        primary: 'hsl(var(--primary))',
        secondary: 'hsl(var(--secondary))',
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
        error: 'hsl(var(--destructive))',
      };
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <Line 
          stroke={colors.primary}
          strokeWidth={isHighContrast ? 3 : 2}
          dataKey="value"
        />
        {/* Additional chart elements with contrast adjustments */}
      </LineChart>
    </ResponsiveContainer>
  );
}
```

---

## Performance Optimizations

### Interaction Debouncing
```tsx
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
}

function FilterInput({ onFilterChange, placeholder }) {
  const [value, setValue] = useState('');
  const debouncedValue = useDebounce(value, 300);
  
  useEffect(() => {
    onFilterChange(debouncedValue);
  }, [debouncedValue, onFilterChange]);
  
  return (
    <Input
      type="search"
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className="max-w-xs"
    />
  );
}
```

### Virtual Scrolling Interactions
```tsx
function VirtualScrollInteractions({ items, onItemClick }) {
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  
  const handleScroll = useCallback(
    throttle((scrollTop) => {
      setScrollOffset(scrollTop);
      setIsScrolling(true);
      
      // Clear scrolling state after scrolling stops
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => setIsScrolling(false), 150);
    }, 16), // ~60fps
    []
  );
  
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={48}
      onScroll={handleScroll}
      className={cn(
        "transition-all duration-200",
        isScrolling && "scroll-smooth"
      )}
    >
      {({ index, style }) => (
        <VirtualItem
          style={style}
          item={items[index]}
          onClick={() => onItemClick(items[index])}
          isScrolling={isScrolling}
        />
      )}
    </FixedSizeList>
  );
}
```

This comprehensive interaction specification ensures that PipeTrak's reporting module provides intuitive, efficient, and accessible user experiences across all devices and interaction modalities, with particular emphasis on the Excel-like behaviors that field users expect.
