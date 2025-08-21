# Component Specifications - Milestone Update System

## Architecture Overview

All components follow shadcn/ui patterns with Tailwind CSS and integrate seamlessly with the existing PipeTrak component structure. Each specification includes exact shadcn/ui component references and implementation details.

---

## 1. MilestoneWorkflowRenderer

**Purpose**: Central component that renders the appropriate milestone interface based on workflow type

### Props Interface
```typescript
interface MilestoneWorkflowRendererProps {
  milestone: ComponentMilestone;
  workflowType: WorkflowType;
  component: Component;
  onUpdate: (milestoneId: string, update: MilestoneUpdate) => Promise<void>;
  disabled?: boolean;
  size?: 'compact' | 'default' | 'large';
  showProgress?: boolean;
}
```

### shadcn/ui Components Used
- `Card` - Container wrapper
- `Progress` - Visual progress indication
- Conditional rendering of workflow-specific components

### Layout Specifications
- **Card padding**: `p-4` (16px)
- **Minimum height**: 80px for compact, 120px for default, 160px for large
- **Border radius**: `rounded-lg` (12px)
- **Border color**: `border-border` with hover state `hover:border-primary/20`

### Visual States
1. **Default**: `bg-card` with `border-border`
2. **Modified**: `bg-blue-50 dark:bg-blue-950` with `border-blue-200 dark:border-blue-800`
3. **Loading**: Disabled state with loading spinner
4. **Error**: `bg-destructive/10` with `border-destructive/20`

### Accessibility
- ARIA label includes milestone name and current status
- Keyboard navigation support for all interactive elements
- Screen reader announcements for status changes

---

## 2. DiscreteCheckboxCard

**Purpose**: Checkbox interface for MILESTONE_DISCRETE workflow type

### shadcn/ui Components Used
- `Checkbox` - Primary interaction element
- `Label` - Accessible milestone name
- `Badge` - Completion status indicator
- `CheckCircle2` icon - Visual completion feedback

### Layout Specifications
```css
.discrete-milestone-card {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 52px; /* Touch target requirement */
  padding: 12px 16px;
}
```

### Touch Target Optimization
- **Checkbox size**: 24px (visual) with 52px touch target
- **Invisible touch area**: `before:absolute before:inset-[-14px]`
- **Spacing between elements**: 12px minimum
- **Label click area**: Extends full checkbox touch target

### Visual Design
- **Unchecked state**: `border-2 border-input` with neutral colors
- **Checked state**: `bg-success text-success-foreground` 
- **Completion icon**: `CheckCircle2` in success color, 16px size
- **Completion animation**: Smooth scale and fade-in transition

### Micro-interactions
```css
.checkbox-transition {
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.completion-animation {
  animation: completion-bounce 0.6s ease-out;
}

@keyframes completion-bounce {
  0% { transform: scale(0.8) rotate(-10deg); opacity: 0; }
  50% { transform: scale(1.1) rotate(5deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
```

### Completed State Design
- **Text styling**: `line-through text-muted-foreground`
- **Completion timestamp**: `text-xs text-muted-foreground mt-1`
- **Completed by indicator**: User avatar (24px) + name

---

## 3. PercentageSliderCard

**Purpose**: Slider + input interface for MILESTONE_PERCENTAGE workflow type

### shadcn/ui Components Used
- `Slider` - Primary percentage control  
- `Input` - Numeric input alternative
- `Progress` - Visual progress bar
- `Button` - Quick percentage presets

### Layout Specifications
```typescript
const PercentageSliderCard = () => (
  <Card className="p-4 space-y-4">
    <div className="flex items-center justify-between">
      <Label className="font-medium">{milestone.name}</Label>
      <div className="flex items-center gap-2">
        <Input 
          type="number" 
          value={percentage} 
          className="w-16 h-8 text-center" 
        />
        <span className="text-sm font-medium">%</span>
      </div>
    </div>
    
    <Slider 
      value={[percentage]} 
      max={100} 
      step={5}
      className="touch-slider"
    />
    
    <Progress value={percentage} className="h-2" />
    
    <div className="flex gap-2">
      {[25, 50, 75, 100].map(preset => (
        <Button 
          key={preset}
          variant="outline" 
          size="sm"
          className="flex-1 min-h-[44px]"
        >
          {preset}%
        </Button>
      ))}
    </div>
  </Card>
);
```

### Slider Customization
```css
.touch-slider .slider-thumb {
  width: 24px;
  height: 24px;
  /* Larger touch target */
  &::before {
    content: '';
    position: absolute;
    inset: -14px;
    border-radius: 50%;
  }
}

.touch-slider .slider-track {
  height: 8px;
  border-radius: 4px;
}
```

### Quick Preset Buttons
- **Layout**: 4 buttons in flex row, equal width
- **Sizing**: `min-h-[44px]` for accessibility
- **Spacing**: `gap-2` (8px between buttons)
- **States**: 
  - Default: `variant="outline"`
  - Active: `variant="default"` when percentage matches preset
  - Hover: Subtle background shift

### Input Validation
- **Range**: 0-100 with visual feedback for invalid values
- **Step control**: 5% increments via slider, 1% via input
- **Real-time validation**: Red border for invalid, debounced save
- **Auto-correction**: Clamp values to valid range on blur

---

## 4. QuantityInputCard  

**Purpose**: Numeric input with steppers for MILESTONE_QUANTITY workflow type

### shadcn/ui Components Used
- `Input` - Numeric quantity input
- `Button` - Increment/decrement steppers
- `Progress` - Visual progress indication
- `Badge` - Unit and fraction display

### Layout Specifications
```typescript
const QuantityInputCard = () => (
  <Card className="p-4 space-y-3">
    <div className="flex items-center justify-between">
      <Label className="font-medium">{milestone.name}</Label>
      <Badge variant="secondary">
        {quantityComplete} of {quantityTotal} {unit}
      </Badge>
    </div>
    
    <div className="flex items-center gap-3">
      <Button 
        variant="outline" 
        size="icon"
        className="h-12 w-12 shrink-0"
        disabled={quantityComplete <= 0}
      >
        <Minus className="h-4 w-4" />
      </Button>
      
      <div className="flex-1 relative">
        <Input 
          type="number"
          value={quantityComplete}
          className="text-center text-lg font-semibold h-12"
        />
        <Progress 
          value={(quantityComplete / quantityTotal) * 100} 
          className="absolute -bottom-1 left-0 right-0 h-1" 
        />
      </div>
      
      <Button 
        variant="outline" 
        size="icon"
        className="h-12 w-12 shrink-0"
        disabled={quantityComplete >= quantityTotal}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
    
    <div className="flex gap-2">
      {quickIncrements.map(inc => (
        <Button 
          key={inc}
          variant="ghost" 
          size="sm"
          className="flex-1 min-h-[36px]"
        >
          +{inc}
        </Button>
      ))}
    </div>
  </Card>
);
```

### Stepper Button Design
- **Size**: 48px × 48px for excellent touch targets
- **Icons**: `Plus` and `Minus` from lucide-react, 16px size
- **Disabled states**: Reduced opacity, no interaction
- **Auto-repeat**: Long press triggers continuous increment/decrement

### Quick Increment Buttons
- **Dynamic values**: Based on total quantity (e.g., +1, +5, +10 for large quantities)
- **Smart suggestions**: +1 always available, larger increments for efficiency
- **Validation**: Cannot exceed `quantityTotal` or go below 0

### Progress Integration
- **Visual progress bar**: Thin bar below input showing completion percentage
- **Color coding**: 
  - 0-33%: `bg-field-pending` 
  - 34-66%: `bg-field-warning`
  - 67-100%: `bg-field-complete`

---

## 5. BulkUpdateModal (Enhanced)

**Purpose**: Comprehensive bulk milestone update interface with preview and progress

### shadcn/ui Components Used
- `Dialog`, `DialogContent`, `DialogHeader` - Modal structure
- `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger` - Multi-step workflow
- `Table`, `TableHeader`, `TableRow`, `TableCell` - Preview table
- `Progress` - Operation progress tracking
- `ScrollArea` - Large dataset handling

### Modal Specifications
- **Size**: `max-w-4xl` (896px) to accommodate preview table
- **Height**: `max-h-[90vh]` with scroll handling
- **Responsive**: Stacks vertically on mobile, full-width tabs

### Tab Structure
1. **Selection Tab**: Choose components and milestone
2. **Preview Tab**: Show what will be changed
3. **Progress Tab**: Real-time update status
4. **Results Tab**: Success/failure summary

### Preview Table Layout
```typescript
const PreviewTable = () => (
  <ScrollArea className="h-[400px] w-full border rounded-md">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[200px]">Component ID</TableHead>
          <TableHead>Current Value</TableHead>
          <TableHead>New Value</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {previewData.map(item => (
          <TableRow key={item.componentId}>
            <TableCell className="font-mono text-sm">
              {item.componentId}
            </TableCell>
            <TableCell>
              <Badge variant="outline">{item.currentValue}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant="default">{item.newValue}</Badge>
            </TableCell>
            <TableCell>
              <StatusIcon status={item.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </ScrollArea>
);
```

### Progress Tracking Design
- **Real-time progress bar**: Shows completion percentage
- **Item count**: "Processing 23 of 150 components"
- **Speed indicator**: "~15 seconds remaining"
- **Cancel option**: Graceful cancellation with rollback

### Error Handling Interface
- **Partial success handling**: Clear distinction between success/failure
- **Retry mechanisms**: Individual and bulk retry options
- **Error details**: Expandable error messages with solutions
- **Rollback option**: "Undo all changes" within 30-second window

---

## 6. MobileMilestoneSheet

**Purpose**: Mobile-optimized bottom sheet for milestone updates

### shadcn/ui Components Used
- `Sheet`, `SheetContent`, `SheetHeader` - Bottom drawer
- `ScrollArea` - Content scrolling
- `Button` - Large touch-friendly actions

### Sheet Specifications
```typescript
const MobileMilestoneSheet = () => (
  <Sheet open={isOpen} onOpenChange={setIsOpen}>
    <SheetContent 
      side="bottom" 
      className="h-[85vh] p-0"
    >
      <div className="flex flex-col h-full">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-lg font-semibold">
                {component.componentId}
              </SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground">
                {component.description}
              </SheetDescription>
            </div>
            <Badge variant="outline">
              {Math.round(component.completionPercent)}% Complete
            </Badge>
          </div>
        </SheetHeader>
        
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {milestones.map(milestone => (
              <MobileWorkflowCard key={milestone.id} {...milestone} />
            ))}
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t bg-muted/20">
          <Button 
            className="w-full h-12 text-base font-semibold"
            disabled={!hasChanges}
          >
            Save Changes ({changesCount})
          </Button>
        </div>
      </div>
    </SheetContent>
  </Sheet>
);
```

### Mobile-Specific Adaptations
- **Sheet height**: 85vh to allow background visibility
- **Large touch targets**: All interactive elements ≥52px
- **Swipe dismissal**: Natural gesture to close sheet
- **Auto-save**: Debounced saving as user makes changes
- **Offline support**: Visual indicators and queue management

### Gesture Support
- **Pull to refresh**: Refresh milestone data
- **Swipe actions**: Quick complete/incomplete toggles
- **Long press**: Access advanced options menu
- **Haptic feedback**: Confirmation vibrations for actions

---

## 7. InlineTableEditor

**Purpose**: Direct editing of milestones within the component data table

### Integration with TanStack Table
```typescript
const milestoneColumn: ColumnDef<ComponentWithMilestones> = {
  id: 'milestones',
  header: 'Progress',
  cell: ({ row, getValue }) => {
    const milestones = getValue() as ComponentMilestone[];
    return (
      <InlineTableEditor
        milestones={milestones}
        component={row.original}
        onUpdate={handleMilestoneUpdate}
      />
    );
  },
  size: 200
};
```

### Inline Editor Specifications
- **Compact display**: Shows overview when not editing
- **Click to edit**: Single click activates appropriate editor
- **Auto-save**: Saves on blur or Enter key
- **Visual feedback**: Loading states and success indicators
- **Keyboard navigation**: Tab through milestones, Arrow keys for values

### Compact Display Mode
```typescript
const CompactDisplay = ({ milestones, completionPercent }) => (
  <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded">
    <Progress value={completionPercent} className="flex-1 h-2" />
    <span className="text-sm font-medium min-w-[3rem]">
      {Math.round(completionPercent)}%
    </span>
    <ChevronRight className="h-3 w-3 text-muted-foreground" />
  </div>
);
```

### Edit Mode Interface  
- **Workflow type detection**: Renders appropriate editor automatically
- **Escape handling**: Cancels edit and reverts changes
- **Validation**: Real-time validation with error states
- **Multi-milestone**: Tabbed interface for components with multiple milestones

---

## 8. OptimisticUpdateManager

**Purpose**: Client-side state management for seamless user experience

### State Structure
```typescript
interface OptimisticState {
  pendingUpdates: Map<string, MilestoneUpdate>;
  optimisticValues: Map<string, any>;
  serverValues: Map<string, any>;
  operationStatus: Map<string, 'pending' | 'success' | 'error'>;
  rollbackQueue: MilestoneUpdate[];
}
```

### Visual Feedback System
- **Pending state**: Subtle loading spinner, slightly muted colors
- **Success state**: Green accent, checkmark animation
- **Error state**: Red accent, error icon, retry option
- **Rollback state**: Yellow warning, "Changes reverted" message

### Conflict Resolution UI
```typescript
const ConflictDialog = ({ localValue, remoteValue, onResolve }) => (
  <Dialog open={hasConflict}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Update Conflict</DialogTitle>
        <DialogDescription>
          This milestone was updated by another user while you were editing.
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 p-3 border rounded-lg">
            <p className="text-sm font-medium">Your Version</p>
            <p className="text-lg">{localValue}</p>
            <Button 
              onClick={() => onResolve('local')}
              className="w-full mt-2"
            >
              Use My Version
            </Button>
          </div>
          
          <div className="flex-1 p-3 border rounded-lg">
            <p className="text-sm font-medium">Their Version</p>
            <p className="text-lg">{remoteValue}</p>
            <Button 
              onClick={() => onResolve('remote')}
              variant="outline"
              className="w-full mt-2"
            >
              Use Their Version
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);
```

---

## Performance Specifications

### Rendering Performance
- **Initial render**: <100ms for milestone interfaces
- **Update response**: <50ms for optimistic updates
- **Bulk operations**: <200ms to show progress interface
- **Table integration**: Virtualized rendering for 10k+ components

### Memory Management
- **State cleanup**: Automatic cleanup of old optimistic states
- **Event listeners**: Proper cleanup on component unmount
- **Cache management**: LRU cache for milestone templates

### Network Optimization
- **Debounced updates**: 1000ms debounce for continuous changes
- **Batch API calls**: Group rapid updates into single request
- **Compression**: Gzip compression for bulk update payloads
- **Retry logic**: Exponential backoff for failed requests

This comprehensive specification provides developers with exact implementation details while maintaining the field-first design philosophy throughout all components.