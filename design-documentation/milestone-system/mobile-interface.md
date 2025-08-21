# Mobile Interface Design - Milestone Update System

## Design Principles for Industrial Field Use

### Core Requirements
- **Glove-friendly targets**: Minimum 52px touch targets
- **High contrast**: WCAG AA compliance with enhanced contrast for outdoor use
- **Dust resistance**: Clear visual hierarchies that work with reduced screen clarity
- **One-handed operation**: Critical functions accessible via thumb reach
- **Network resilience**: Offline-first with clear sync indicators

### Environmental Considerations
- **Bright sunlight**: High contrast colors and bold text
- **Vibration/movement**: Large targets and forgiving touch areas
- **Wet conditions**: Capacitive touch through water droplets
- **Temperature extremes**: Responsive design that works in cold weather gloves

---

## Bottom Sheet Pattern

### Core Implementation
```typescript
const MobileMilestoneSheet = () => (
  <Sheet open={isOpen} onOpenChange={setIsOpen}>
    <SheetContent 
      side="bottom" 
      className="h-[85vh] rounded-t-2xl"
      // Reduced height allows background context
    >
      <div className="flex flex-col h-full">
        {/* Drag handle for visual affordance */}
        <div className="flex justify-center py-2">
          <div className="w-12 h-1 bg-muted-foreground/20 rounded-full" />
        </div>
        
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl font-bold tracking-tight">
                {component.componentId}
              </SheetTitle>
              <SheetDescription className="text-base text-muted-foreground mt-1">
                {component.description || component.type}
              </SheetDescription>
              {component.area && (
                <Badge variant="outline" className="mt-2 text-sm">
                  Area {component.area}
                </Badge>
              )}
            </div>
            
            <div className="text-right ml-4">
              <div className="text-2xl font-bold text-success">
                {Math.round(component.completionPercent)}%
              </div>
              <div className="text-sm text-muted-foreground">
                Complete
              </div>
            </div>
          </div>
        </SheetHeader>
        
        <ScrollArea className="flex-1 px-6">
          <div className="py-4 space-y-6">
            {milestones.map(milestone => (
              <MobileMilestoneCard 
                key={milestone.id} 
                milestone={milestone}
                component={component}
                onUpdate={handleUpdate}
              />
            ))}
          </div>
        </ScrollArea>
        
        {hasChanges && (
          <div className="px-6 py-4 border-t bg-muted/20">
            <Button 
              className="w-full h-14 text-lg font-semibold"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Save {changesCount} Change{changesCount !== 1 ? 's' : ''}
                  <CheckCircle className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </SheetContent>
  </Sheet>
);
```

### Interaction Design
- **Pull-to-dismiss**: Natural gesture closes sheet
- **Backdrop tap**: Tapping outside closes sheet (with unsaved changes warning)
- **Drag handle**: Visual cue that sheet can be dismissed
- **Keyboard safe area**: Content adjusts when virtual keyboard appears

---

## Mobile Milestone Cards

### Discrete Milestone Card (Mobile)
```typescript
const MobileDiscreteCard = ({ milestone, onUpdate }) => (
  <Card className="border-2 border-border hover:border-primary/20 transition-colors">
    <div 
      className="p-6 cursor-pointer select-none"
      onClick={() => onUpdate(milestone.id, { isCompleted: !milestone.isCompleted })}
    >
      <div className="flex items-center gap-4">
        {/* Large checkbox with extended touch area */}
        <div className="relative">
          <Checkbox 
            checked={milestone.isCompleted}
            className="h-8 w-8 border-2"
            // Visual checkbox - actual interaction handled by card
          />
          {/* Invisible extended touch area */}
          <div className="absolute inset-[-12px]" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold leading-tight">
            {milestone.milestoneName}
          </h3>
          {milestone.completedAt && (
            <div className="flex items-center gap-2 mt-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-sm text-success">
                Completed {formatDate(milestone.completedAt)}
              </span>
            </div>
          )}
          {milestone.completedBy && (
            <div className="text-sm text-muted-foreground mt-1">
              by {milestone.completedBy}
            </div>
          )}
        </div>
        
        {/* Visual status indicator */}
        <div className="shrink-0">
          {milestone.isCompleted ? (
            <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
          ) : (
            <div className="w-12 h-12 bg-muted/20 rounded-full flex items-center justify-center">
              <Circle className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>
    </div>
  </Card>
);
```

### Percentage Milestone Card (Mobile)
```typescript
const MobilePercentageCard = ({ milestone, onUpdate }) => {
  const [localValue, setLocalValue] = useState(milestone.percentageComplete || 0);
  
  return (
    <Card className="border-2 border-border">
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {milestone.milestoneName}
          </h3>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={localValue}
              onChange={(e) => setLocalValue(parseInt(e.target.value) || 0)}
              onBlur={() => onUpdate(milestone.id, { percentageComplete: localValue })}
              className="w-16 h-10 text-center text-lg font-bold"
              min={0}
              max={100}
            />
            <span className="text-lg font-semibold">%</span>
          </div>
        </div>
        
        {/* Large touch-friendly slider */}
        <div className="px-2 py-4">
          <Slider
            value={[localValue]}
            onValueChange={(value) => setLocalValue(value[0])}
            onValueCommit={(value) => onUpdate(milestone.id, { percentageComplete: value[0] })}
            max={100}
            step={5}
            className="touch-slider-mobile"
          />
        </div>
        
        {/* Progress bar with completion states */}
        <div className="space-y-2">
          <Progress 
            value={localValue} 
            className="h-3 rounded-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>0%</span>
            <span className="font-medium text-foreground">
              {localValue}% Complete
            </span>
            <span>100%</span>
          </div>
        </div>
        
        {/* Quick preset buttons */}
        <div className="grid grid-cols-4 gap-2 pt-2">
          {[25, 50, 75, 100].map(preset => (
            <Button
              key={preset}
              variant={localValue === preset ? "default" : "outline"}
              size="lg"
              className="h-12 text-base font-semibold"
              onClick={() => {
                setLocalValue(preset);
                onUpdate(milestone.id, { percentageComplete: preset });
              }}
            >
              {preset}%
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
};
```

### Quantity Milestone Card (Mobile)
```typescript
const MobileQuantityCard = ({ milestone, component, onUpdate }) => {
  const [localValue, setLocalValue] = useState(milestone.quantityComplete || 0);
  const maxQuantity = milestone.quantityTotal || component.totalQuantity || 100;
  const percentage = Math.round((localValue / maxQuantity) * 100);
  
  return (
    <Card className="border-2 border-border">
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {milestone.milestoneName}
          </h3>
          <Badge variant="secondary" className="text-base px-3 py-1">
            {localValue} of {maxQuantity} {milestone.unit || 'items'}
          </Badge>
        </div>
        
        {/* Large stepper interface */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 shrink-0"
            disabled={localValue <= 0}
            onClick={() => {
              const newValue = Math.max(0, localValue - 1);
              setLocalValue(newValue);
              onUpdate(milestone.id, { quantityComplete: newValue });
            }}
          >
            <Minus className="h-6 w-6" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              type="number"
              value={localValue}
              onChange={(e) => {
                const value = Math.max(0, Math.min(maxQuantity, parseInt(e.target.value) || 0));
                setLocalValue(value);
              }}
              onBlur={() => onUpdate(milestone.id, { quantityComplete: localValue })}
              className="text-center text-2xl font-bold h-14 pr-16"
              min={0}
              max={maxQuantity}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">
              {milestone.unit || 'items'}
            </div>
            <Progress 
              value={percentage} 
              className="absolute -bottom-px left-0 right-0 h-1 rounded-none" 
            />
          </div>
          
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 shrink-0"
            disabled={localValue >= maxQuantity}
            onClick={() => {
              const newValue = Math.min(maxQuantity, localValue + 1);
              setLocalValue(newValue);
              onUpdate(milestone.id, { quantityComplete: newValue });
            }}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
        
        {/* Progress indicator */}
        <div className="text-center">
          <div className="text-3xl font-bold text-success mb-1">
            {percentage}%
          </div>
          <div className="text-sm text-muted-foreground">
            Progress Complete
          </div>
        </div>
        
        {/* Quick increment buttons */}
        <div className="grid grid-cols-3 gap-2">
          {[1, 5, 10].map(increment => (
            <Button
              key={increment}
              variant="ghost"
              size="lg"
              className="h-10 text-base"
              disabled={localValue + increment > maxQuantity}
              onClick={() => {
                const newValue = Math.min(maxQuantity, localValue + increment);
                setLocalValue(newValue);
                onUpdate(milestone.id, { quantityComplete: newValue });
              }}
            >
              +{increment}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
};
```

---

## Mobile-Specific CSS Customizations

### Enhanced Touch Targets
```css
/* Mobile slider enhancements */
.touch-slider-mobile .slider-thumb {
  width: 28px;
  height: 28px;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.touch-slider-mobile .slider-thumb:before {
  content: '';
  position: absolute;
  inset: -16px;
  border-radius: 50%;
  /* Invisible expanded touch area */
}

.touch-slider-mobile .slider-track {
  height: 8px;
  border-radius: 4px;
}

.touch-slider-mobile .slider-range {
  border-radius: 4px;
}
```

### High Contrast Enhancements
```css
/* Enhanced contrast for outdoor visibility */
.mobile-milestone-card {
  --shadow-outdoor: 0 4px 12px rgba(0, 0, 0, 0.15);
  --border-outdoor: 2px;
  --text-outdoor-contrast: 0.95;
}

.mobile-milestone-card .card-title {
  font-weight: 600;
  letter-spacing: -0.025em;
  /* Slightly tighter tracking for mobile clarity */
}

.mobile-milestone-card .progress-text {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  /* Subtle text shadow for outdoor readability */
}
```

---

## Swipe Gesture Implementation

### Swipe Actions on Milestone Cards
```typescript
const SwipeableMilestoneCard = ({ milestone, onUpdate, children }) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  
  const swipeActions = [
    {
      id: 'complete',
      label: milestone.isCompleted ? 'Mark Incomplete' : 'Mark Complete',
      color: milestone.isCompleted ? 'bg-muted' : 'bg-success',
      icon: milestone.isCompleted ? X : Check,
      action: () => onUpdate(milestone.id, { 
        isCompleted: !milestone.isCompleted 
      })
    },
    {
      id: 'quick-75',
      label: '75%',
      color: 'bg-warning',
      icon: Zap,
      action: () => onUpdate(milestone.id, { 
        percentageComplete: 75 
      }),
      show: milestone.workflowType === 'MILESTONE_PERCENTAGE'
    }
  ];
  
  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Background action buttons */}
      <div className="absolute inset-y-0 right-0 flex">
        {swipeActions.filter(action => action.show !== false).map(action => (
          <button
            key={action.id}
            onClick={action.action}
            className={`${action.color} text-white px-6 flex items-center justify-center min-w-[80px] font-semibold`}
          >
            <action.icon className="h-6 w-6" />
          </button>
        ))}
      </div>
      
      {/* Main card content */}
      <div 
        className="relative bg-card transition-transform duration-200 ease-out"
        style={{ transform: `translateX(${swipeOffset}px)` }}
        {...swipeHandlers}
      >
        {children}
      </div>
    </div>
  );
};
```

### Gesture Configuration
- **Swipe threshold**: 40px to trigger action preview
- **Action threshold**: 120px to execute action
- **Spring animation**: Smooth return to neutral position
- **Haptic feedback**: Vibration when action threshold reached

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

## Voice Input Integration

### Voice Input Button
```typescript
const VoiceInputButton = ({ onResult, placeholder = "Say a value..." }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isListening ? "default" : "outline"}
        size="icon"
        className="h-12 w-12"
        onClick={toggleListening}
      >
        {isListening ? (
          <MicOff className="h-5 w-5" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
      </Button>
      
      {(isListening || transcript) && (
        <div className="flex-1 px-3 py-2 bg-muted rounded-lg text-sm">
          {isListening ? (
            <span className="text-muted-foreground animate-pulse">
              {placeholder}
            </span>
          ) : (
            <span className="font-medium">{transcript}</span>
          )}
        </div>
      )}
    </div>
  );
};
```

### Voice Recognition Patterns
- **Percentage commands**: "Seventy-five percent", "Set to 50%"
- **Quantity commands**: "Eight bolts", "Add five more"
- **Complete commands**: "Mark complete", "Done", "Finished"
- **Error handling**: "I didn't understand, please try again"

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

This comprehensive mobile interface design ensures that PipeTrak's milestone system works exceptionally well in real industrial field conditions while maintaining the efficiency construction professionals expect.