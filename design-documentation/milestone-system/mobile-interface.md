# Mobile Interface Design - Direct-Tap Milestone System

## Design Principles for Industrial Field Use

### Core Requirements
- **Glove-friendly targets**: Minimum 56px touch targets (upgraded from 52px)
- **Direct interaction**: No swipes or hidden gestures - everything visible and tappable
- **High contrast**: WCAG AA+ compliance with enhanced contrast for outdoor use
- **One-handed operation**: Critical functions accessible via thumb reach
- **Network resilience**: Offline-first with optimistic updates and clear sync indicators
- **Immediate feedback**: <50ms touch response with visual confirmation

### Environmental Considerations
- **Bright sunlight**: High contrast colors and bold text
- **Vibration/movement**: Large targets and forgiving touch areas
- **Wet conditions**: Capacitive touch through water droplets
- **Temperature extremes**: Responsive design that works in cold weather gloves

---

## Direct-Tap Component Card Pattern

### Core Component Card (112px Total Height)
```typescript
const MobileComponentCard = ({ component, onMilestoneUpdate, isSelected, onSelectionChange }) => (
  <div className="bg-card border border-border rounded-lg overflow-hidden" style={{ height: '112px' }}>
    {/* Header Section (32px) */}
    <div className="flex items-center justify-between px-4 py-2 border-b bg-card" style={{ height: '32px' }}>
      <div className="flex items-center gap-2">
        <Checkbox 
          checked={isSelected}
          onCheckedChange={(checked) => onSelectionChange(component.id, checked)}
          className="h-5 w-5"
        />
        <span className="font-semibold text-sm truncate max-w-[200px]">
          {component.componentId}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          Drawing {component.drawingNumber}
        </span>
        <div className="text-sm font-bold text-success">
          {Math.round(component.completionPercent)}%
        </div>
      </div>
    </div>
    
    {/* Meta Section (24px) */}
    <div className="px-4 py-1 text-xs text-muted-foreground border-b" style={{ height: '24px' }}>
      <div className="flex items-center gap-2">
        <span>{component.type}</span>
        {component.size && <span>• {component.size}</span>}
        {component.area && <span>• Area {component.area}</span>}
        {component.testPackage && <span>• TP-{component.testPackage}</span>}
      </div>
    </div>
    
    {/* Milestone Buttons Section (56px) */}
    <div className="flex h-14" style={{ height: '56px' }}>
      <MilestoneButtonRow 
        milestones={component.milestones}
        onMilestoneUpdate={onMilestoneUpdate}
        workflowType={component.workflowType}
      />
    </div>
  </div>
);
```

### Interaction Design
- **Direct manipulation**: Tap milestone button to toggle completion
- **Visual feedback**: Immediate color change and icon update
- **No hidden gestures**: All actions visible and discoverable
- **Auto-save**: Changes saved immediately with offline queue
- **Selection mode**: Checkbox for bulk operations

---

## Direct-Tap Milestone Button System

### Milestone Button Row (7 Equal-Width Buttons)
```typescript
const MilestoneButtonRow = ({ milestones, onMilestoneUpdate, workflowType }) => {
  const buttonWidth = `${100 / milestones.length}%`; // Equal distribution
  
  return (
    <div className="flex w-full h-full">
      {milestones.map((milestone, index) => {
        const state = getMilestoneState(milestone, milestones);
        const abbreviation = MILESTONE_ABBREVIATIONS[milestone.type];
        
        return (
          <MilestoneButton
            key={milestone.id}
            milestone={milestone}
            state={state}
            abbreviation={abbreviation}
            onPress={() => handleMilestonePress(milestone)}
            style={{ width: buttonWidth }}
            className={index < milestones.length - 1 ? 'border-r border-border' : ''}
          />
        );
      })}
    </div>
  );
};
```

### Individual Milestone Button (51px × 56px)
```typescript
const MilestoneButton = ({ milestone, state, abbreviation, onPress, className, style }) => {
  const config = MILESTONE_STATES[state];
  
  return (
    <button
      onClick={onPress}
      disabled={state === 'blocked' || state === 'loading'}
      className={cn(
        "flex flex-col items-center justify-center h-full min-w-[51px] transition-all duration-150",
        "focus:ring-2 focus:ring-blue-500 focus:z-10",
        config.background,
        config.border,
        config.textColor,
        className
      )}
      style={style}
      aria-label={`${milestone.type} milestone ${state}`}
      aria-pressed={state === 'complete'}
    >
      {/* Icon */}
      <div className="text-lg leading-none mb-1">
        {state === 'loading' ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          config.icon
        )}
      </div>
      
      {/* Abbreviation */}
      <div className="text-xs font-semibold leading-none">
        {abbreviation}
      </div>
    </button>
  );
};
```

### Touch Interaction Logic
```typescript
const handleMilestonePress = async (milestone: ComponentMilestone) => {
  const currentState = getMilestoneState(milestone, allMilestones);
  
  switch (currentState) {
    case 'available':
      // Complete the milestone with optimistic update
      await onMilestoneUpdate(milestone.id, true);
      break;
      
    case 'complete':
      // Uncomplete if no dependents
      await onMilestoneUpdate(milestone.id, false);
      break;
      
    case 'blocked':
      // Show tooltip with prerequisites
      showTooltip(`Complete ${getRequiredMilestones(milestone).join(', ')} first`);
      break;
      
    case 'dependent':
      // Show tooltip with dependents
      showTooltip(`Uncomplete ${getDependentMilestones(milestone).join(', ')} first`);
      break;
      
    case 'error':
      // Retry the failed operation
      await retryMilestoneUpdate(milestone);
      break;
      
    case 'loading':
      // Do nothing, operation in progress
      break;
  }
};
```

### Milestone Dependency Logic
```typescript
function getMilestoneState(
  milestone: ComponentMilestone,
  allMilestones: ComponentMilestone[]
): MilestoneButtonState {
  if (milestone.isLoading) return 'loading';
  if (milestone.hasError) return 'error';
  
  if (milestone.isCompleted) {
    // Check if other milestones depend on this one
    const canUncomplete = canUncompleteMilestone(milestone, allMilestones);
    return canUncomplete ? 'complete' : 'dependent';
  } else {
    // Check if prerequisites are met
    const canComplete = canCompleteMilestone(milestone, allMilestones);
    return canComplete ? 'available' : 'blocked';
  }
}

function canCompleteMilestone(
  milestone: ComponentMilestone, 
  allMilestones: ComponentMilestone[]
): boolean {
  const rules = MILESTONE_DEPENDENCY_RULES[milestone.type];
  
  // Check all required prerequisites
  for (const requiredType of rules.requires) {
    const requiredMilestone = allMilestones.find(m => m.type === requiredType);
    if (requiredMilestone && !requiredMilestone.isCompleted) {
      return false; // Prerequisite not met
    }
  }
  
  return true; // All prerequisites satisfied
}

function canUncompleteMilestone(
  milestone: ComponentMilestone,
  allMilestones: ComponentMilestone[]
): boolean {
  // Find milestones that depend on this one
  const dependentMilestones = allMilestones.filter(m => {
    const rules = MILESTONE_DEPENDENCY_RULES[m.type];
    return rules.requires.includes(milestone.type) && m.isCompleted;
  });
  
  // Cannot uncomplete if other milestones depend on it
  return dependentMilestones.length === 0;
}
```

---

## Performance Optimizations

### Virtual Scrolling Implementation
```typescript
const VirtualizedComponentList = memo(({ components }: Props) => {
  const CARD_HEIGHT = 112; // Fixed 112px per card
  const VISIBLE_ITEMS = Math.ceil(viewport.height / CARD_HEIGHT) + 2;
  const OVERSCAN = 5;
  
  const virtualization = useVirtualization({
    itemCount: components.length,
    itemHeight: CARD_HEIGHT,
    overscan: OVERSCAN,
    scrollElement: scrollContainerRef.current
  });
  
  return (
    <div style={{ height: components.length * CARD_HEIGHT }}>
      {virtualization.visibleItems.map(({ index, style }) => (
        <div key={components[index].id} style={style}>
          <MobileComponentCard component={components[index]} />
        </div>
      ))}
    </div>
  );
});
```

### Optimistic Updates with Rollback
```typescript
const useOptimisticMilestoneUpdate = () => {
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, boolean>>(new Map());
  
  const updateMilestone = async (milestoneId: string, completed: boolean) => {
    // 1. Update UI immediately
    setPendingUpdates(prev => new Map(prev).set(milestoneId, completed));
    
    try {
      // 2. Sync to server
      await syncMilestoneUpdate(milestoneId, completed);
      
      // 3. Remove from pending on success
      setPendingUpdates(prev => {
        const next = new Map(prev);
        next.delete(milestoneId);
        return next;
      });
    } catch (error) {
      // 4. Rollback on failure
      setPendingUpdates(prev => {
        const next = new Map(prev);
        next.delete(milestoneId);
        return next;
      });
      
      // Show error state
      setMilestoneError(milestoneId, error.message);
    }
  };
  
  return { updateMilestone, pendingUpdates };
};
```

---

## Milestone State Management

### Visual State Definitions
```typescript
type MilestoneButtonState = 
  | 'available'   // White background, green border, empty circle
  | 'complete'    // Green background, solid border, filled circle
  | 'blocked'     // Gray background, lock icon
  | 'dependent'   // Green background, yellow border, filled circle with lock
  | 'loading'     // Pulsing animation, spinner
  | 'error';      // Red border, warning triangle

const MILESTONE_STATES: Record<MilestoneButtonState, StateConfig> = {
  available: {
    background: 'bg-white',
    border: 'border-2 border-green-500',
    icon: '○',
    textColor: 'text-green-600'
  },
  complete: {
    background: 'bg-green-500',
    border: 'border-2 border-green-600',
    icon: '●',
    textColor: 'text-white'
  },
  blocked: {
    background: 'bg-gray-300',
    border: 'border-2 border-gray-400',
    icon: '🔒',
    textColor: 'text-gray-600'
  },
  dependent: {
    background: 'bg-green-500',
    border: 'border-2 border-yellow-400',
    icon: '●🔒',
    textColor: 'text-white'
  },
  loading: {
    background: 'bg-blue-100',
    border: 'border-2 border-blue-300',
    icon: 'spinner',
    textColor: 'text-blue-600'
  },
  error: {
    background: 'bg-white',
    border: 'border-2 border-red-500',
    icon: '⚠️',
    textColor: 'text-red-600'
  }
};
```

### Milestone Abbreviations
```typescript
const MILESTONE_ABBREVIATIONS: Record<string, string> = {
  RECEIVE: 'REC',
  ERECT: 'ERC', 
  CONNECT: 'CON',
  SUPPORT: 'SUP',
  INSTALL: 'INS',
  PUNCH: 'PCH',
  TEST: 'TST',
  RESTORE: 'RST',
  // Field Weld Milestones
  FIT: 'FIT',
  WELD: 'WLD',
  VT: 'VT',
  RT: 'RT',
  UT: 'UT'
};
```

---

## Offline Mode Interface

### Offline Indicator
```typescript
const OfflineIndicator = ({ isOffline, pendingCount }) => {
  if (!isOffline && pendingCount === 0) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className={`px-4 py-3 text-center text-sm font-medium ${
        isOffline 
          ? 'bg-destructive text-destructive-foreground' 
          : 'bg-warning text-warning-foreground'
      }`}>
        <div className="flex items-center justify-center gap-2">
          {isOffline ? (
            <>
              <WifiOff className="h-4 w-4" />
              Working Offline
            </>
          ) : (
            <>
              <Cloud className="h-4 w-4" />
              Syncing {pendingCount} changes...
            </>
          )}
        </div>
      </div>
    </div>
  );
};
```

### Offline Status in Cards
```typescript
const OfflineStatusBadge = ({ isPending, hasError, lastSync }) => (
  <div className="flex items-center gap-2 text-xs">
    {isPending && (
      <Badge variant="outline" className="gap-1">
        <Clock className="h-3 w-3" />
        Sync Pending
      </Badge>
    )}
    {hasError && (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="h-3 w-3" />
        Sync Failed
      </Badge>
    )}
    {!isPending && !hasError && lastSync && (
      <span className="text-muted-foreground">
        Synced {formatRelativeTime(lastSync)}
      </span>
    )}
  </div>
);
```

---

## Field Usability Features

### Accessibility Implementation
```typescript
const MilestoneButton = ({ milestone, state, abbreviation, onPress }) => {
  const ariaLabel = useMemo(() => {
    const statusText = {
      available: 'available to complete',
      complete: 'completed',
      blocked: 'blocked - prerequisites required',
      dependent: 'completed but has dependents',
      loading: 'updating',
      error: 'failed - tap to retry'
    }[state];
    
    return `${milestone.type} milestone ${statusText}`;
  }, [milestone.type, state]);

  return (
    <button
      role="button"
      aria-label={ariaLabel}
      aria-pressed={state === 'complete'}
      aria-disabled={state === 'blocked' || state === 'loading'}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPress();
        }
      }}
      className={cn(
        "min-w-[56px] min-h-[56px]", // WCAG touch target requirement
        "focus:ring-2 focus:ring-blue-500", // Keyboard focus
        MILESTONE_STATES[state].background,
        MILESTONE_STATES[state].border
      )}
      onClick={onPress}
    >
      <span className="sr-only">{ariaLabel}</span>
      <span aria-hidden="true">{abbreviation}</span>
    </button>
  );
};
```

### High Contrast & Outdoor Visibility
- **WCAG AA+ compliance**: 7:1+ contrast ratios for bright sunlight
- **Bold typography**: Font weights 600+ for clarity at distance
- **Large touch targets**: 56px minimum for work gloves
- **Clear visual hierarchy**: Strong borders and distinct states

---

## QR Code Integration

### QR Code Scanner Sheet
```typescript
const QRScannerSheet = ({ isOpen, onClose, onComponentFound }) => (
  <Sheet open={isOpen} onOpenChange={onClose}>
    <SheetContent side="bottom" className="h-[95vh]">
      <div className="flex flex-col h-full">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="text-xl font-bold">
            Scan Component Tag
          </SheetTitle>
          <SheetDescription>
            Point camera at QR code on component tag
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 relative">
          <QRCodeScanner 
            onScan={handleScan}
            className="w-full h-full"
          />
          
          {/* Scan overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 border-2 border-primary rounded-lg relative">
              <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl"></div>
              <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr"></div>
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl"></div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br"></div>
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t">
          <Button 
            variant="outline" 
            className="w-full h-12"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    </SheetContent>
  </Sheet>
);
```

This direct-tap mobile interface design eliminates swipe gestures and hidden interactions, providing construction professionals with immediate, discoverable milestone controls optimized for field conditions with work gloves, bright sunlight, and challenging network environments.