# Interactions & Micro-animations - Milestone Update System

## Design Philosophy

PipeTrak's interactions prioritize **field efficiency** over visual flair. Every animation and transition serves a functional purpose:
- **Immediate feedback** confirms user actions
- **State clarity** reduces cognitive load in complex workflows  
- **Error prevention** through clear affordances and constraints
- **Accessibility** with respect for `prefers-reduced-motion`

---

## Core Interaction Patterns

### Optimistic Updates

#### Visual Implementation
```typescript
const OptimisticUpdateAnimation = {
  // Immediate visual feedback
  immediate: {
    duration: 0,
    transform: 'scale(1.02)',
    backgroundColor: 'hsl(var(--primary) / 0.1)',
    borderColor: 'hsl(var(--primary) / 0.3)'
  },
  
  // Pending state
  pending: {
    duration: 300,
    transform: 'scale(1)',
    opacity: 0.8,
    backgroundColor: 'hsl(var(--muted))',
    '&::after': {
      content: '',
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
      animation: 'shimmer 1.5s ease-in-out infinite'
    }
  },
  
  // Success confirmation
  success: {
    duration: 400,
    transform: 'scale(1)',
    backgroundColor: 'hsl(var(--success) / 0.1)',
    borderColor: 'hsl(var(--success) / 0.3)',
    transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)'
  },
  
  // Error state
  error: {
    duration: 300,
    transform: 'translateX(0)',
    backgroundColor: 'hsl(var(--destructive) / 0.1)',
    borderColor: 'hsl(var(--destructive) / 0.3)',
    animation: 'shake 0.6s ease-in-out'
  }
};

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
  20%, 40%, 60%, 80% { transform: translateX(2px); }
}
```

#### Interaction Flow
1. **User Action** → Immediate visual feedback (0ms)
2. **API Call Initiated** → Pending shimmer animation (300ms)
3. **Response Received** → Success/error state transition (400ms)
4. **Auto-reset** → Return to neutral state (2s delay)

---

### Checkbox Interactions (Discrete Milestones)

#### Animation Keyframes
```css
@keyframes checkbox-check {
  0% {
    transform: scale(0.8) rotate(-10deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.1) rotate(5deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

@keyframes checkbox-completion-burst {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 hsl(var(--success) / 0.4);
  }
  70% {
    transform: scale(1.05);
    box-shadow: 0 0 0 8px hsl(var(--success) / 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 hsl(var(--success) / 0);
  }
}

.milestone-checkbox {
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.milestone-checkbox[data-state="checked"] {
  animation: checkbox-completion-burst 0.6s ease-out;
}

.milestone-checkbox[data-state="checked"] .checkmark {
  animation: checkbox-check 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

#### Touch Feedback
- **Press**: Subtle scale down (0.98)
- **Release**: Quick scale up (1.02) then settle (1.0)
- **Haptic feedback**: Light impact on completion
- **Sound**: Subtle click confirmation (respects system settings)

---

### Slider Interactions (Percentage Milestones)

#### Enhanced Thumb Design
```css
.percentage-slider {
  --thumb-size: 24px;
  --touch-area: 52px;
  --track-height: 8px;
}

.percentage-slider .slider-thumb {
  width: var(--thumb-size);
  height: var(--thumb-size);
  border: 3px solid white;
  background: hsl(var(--primary));
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 200ms ease;
}

.percentage-slider .slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.percentage-slider .slider-thumb:active {
  transform: scale(1.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.percentage-slider .slider-thumb::before {
  content: '';
  position: absolute;
  width: var(--touch-area);
  height: var(--touch-area);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  /* Invisible expanded touch area */
}

.percentage-slider .slider-track {
  height: var(--track-height);
  border-radius: calc(var(--track-height) / 2);
  background: hsl(var(--muted));
}

.percentage-slider .slider-range {
  background: linear-gradient(90deg, 
    hsl(var(--field-pending)) 0%,
    hsl(var(--field-warning)) 50%,
    hsl(var(--field-complete)) 100%
  );
  border-radius: calc(var(--track-height) / 2);
}
```

#### Real-time Value Updates
```typescript
const PercentageSliderWithFeedback = ({ value, onChange, onCommit }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);
  
  return (
    <div className="relative">
      <Slider
        value={[displayValue]}
        onValueChange={(newValue) => {
          setDisplayValue(newValue[0]);
          onChange?.(newValue[0]);
        }}
        onValueCommit={(finalValue) => {
          onCommit?.(finalValue[0]);
          setIsDragging(false);
        }}
        onPointerDown={() => setIsDragging(true)}
        className="percentage-slider"
      />
      
      {/* Real-time value display */}
      <div className={`absolute -top-12 left-0 right-0 flex justify-center transition-all duration-200 ${
        isDragging ? 'opacity-100 transform-none' : 'opacity-0 translate-y-2'
      }`}>
        <div className="bg-foreground text-background px-3 py-1 rounded-full text-sm font-semibold">
          {displayValue}%
        </div>
      </div>
    </div>
  );
};
```

#### Step Validation Animation
- **Valid step**: Smooth transition to new position
- **Invalid step**: Brief shake and return to valid position
- **Completion milestone**: Celebration burst at 100%

---

### Stepper Interactions (Quantity Milestones)

#### Button States & Animations
```css
.quantity-stepper-button {
  --button-size: 48px;
  width: var(--button-size);
  height: var(--button-size);
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.quantity-stepper-button:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.quantity-stepper-button:active:not(:disabled) {
  transform: scale(0.95);
}

.quantity-stepper-button:disabled {
  opacity: 0.4;
  transform: none;
  cursor: not-allowed;
}

/* Press and hold auto-repeat */
.quantity-stepper-button.auto-repeating {
  animation: pulse-repeat 0.3s ease-in-out infinite alternate;
}

@keyframes pulse-repeat {
  0% { transform: scale(1); }
  100% { transform: scale(1.08); }
}
```

#### Auto-repeat Logic
```typescript
const AutoRepeatButton = ({ onPress, delay = 500, interval = 150 }) => {
  const [isRepeating, setIsRepeating] = useState(false);
  const timeoutRef = useRef();
  const intervalRef = useRef();
  
  const startRepeat = () => {
    onPress();
    
    timeoutRef.current = setTimeout(() => {
      setIsRepeating(true);
      intervalRef.current = setInterval(onPress, interval);
    }, delay);
  };
  
  const stopRepeat = () => {
    setIsRepeating(false);
    clearTimeout(timeoutRef.current);
    clearInterval(intervalRef.current);
  };
  
  return (
    <Button
      className={`quantity-stepper-button ${isRepeating ? 'auto-repeating' : ''}`}
      onPointerDown={startRepeat}
      onPointerUp={stopRepeat}
      onPointerLeave={stopRepeat}
    >
      <Plus className="h-5 w-5" />
    </Button>
  );
};
```

---

### Progress Bar Animations

#### Smooth Progress Transitions
```css
.milestone-progress {
  transition: all 800ms cubic-bezier(0.4, 0, 0.2, 1);
}

.milestone-progress[data-completing="true"] {
  animation: progress-completion 1.2s ease-out;
}

@keyframes progress-completion {
  0% { 
    transform: scale(1); 
    box-shadow: 0 0 0 0 hsl(var(--success) / 0.4);
  }
  50% { 
    transform: scale(1.02); 
    box-shadow: 0 0 0 4px hsl(var(--success) / 0.2);
  }
  100% { 
    transform: scale(1); 
    box-shadow: 0 0 0 0 hsl(var(--success) / 0);
  }
}

/* Multi-segment progress for complex milestones */
.segmented-progress {
  display: flex;
  gap: 2px;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  background: hsl(var(--muted));
}

.progress-segment {
  flex: 1;
  background: hsl(var(--muted-foreground) / 0.2);
  transition: all 400ms ease;
}

.progress-segment.completed {
  background: hsl(var(--success));
  animation: segment-complete 0.3s ease-out;
}

@keyframes segment-complete {
  0% { transform: scaleY(0.5); }
  50% { transform: scaleY(1.2); }
  100% { transform: scaleY(1); }
}
```

---

### Bulk Update Interactions

#### Selection Animation
```css
.bulk-selection-enter {
  animation: selection-appear 0.3s ease-out;
}

.bulk-selection-exit {
  animation: selection-disappear 0.2s ease-in;
}

@keyframes selection-appear {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes selection-disappear {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0.95);
  }
}

.bulk-action-bar {
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.bulk-action-bar.visible {
  transform: translateY(0);
}
```

#### Batch Progress Animation
```typescript
const BulkProgressIndicator = ({ total, completed, failed }) => {
  const successRate = ((completed - failed) / total) * 100;
  const failureRate = (failed / total) * 100;
  const pendingRate = 100 - successRate - failureRate;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Processing {completed} of {total} components</span>
        <span>{Math.round(successRate)}% success rate</span>
      </div>
      
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="absolute left-0 top-0 h-full bg-success transition-all duration-300 ease-out"
          style={{ width: `${successRate}%` }}
        />
        <div 
          className="absolute top-0 h-full bg-destructive transition-all duration-300 ease-out"
          style={{ 
            left: `${successRate}%`,
            width: `${failureRate}%` 
          }}
        />
        <div 
          className="absolute right-0 top-0 h-full bg-warning transition-all duration-300 ease-out animate-pulse"
          style={{ width: `${pendingRate}%` }}
        />
      </div>
    </div>
  );
};
```

---

### Error State Animations

#### Form Validation Errors
```css
.field-error-enter {
  animation: error-slide-in 0.3s ease-out;
}

.field-error-exit {
  animation: error-slide-out 0.2s ease-in;
}

@keyframes error-slide-in {
  0% {
    opacity: 0;
    transform: translateY(-8px);
    height: 0;
  }
  100% {
    opacity: 1;
    transform: translateY(0);
    height: auto;
  }
}

@keyframes error-slide-out {
  0% {
    opacity: 1;
    transform: translateY(0);
    height: auto;
  }
  100% {
    opacity: 0;
    transform: translateY(-8px);
    height: 0;
  }
}

.input-error {
  animation: input-shake 0.4s ease-in-out;
  border-color: hsl(var(--destructive));
  box-shadow: 0 0 0 2px hsl(var(--destructive) / 0.2);
}

@keyframes input-shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
  20%, 40%, 60%, 80% { transform: translateX(2px); }
}
```

#### Network Error Recovery
```typescript
const NetworkErrorToast = ({ retry, dismiss }) => (
  <div className="flex items-center gap-3 p-4 bg-destructive text-destructive-foreground rounded-lg animate-in slide-in-from-right-full duration-300">
    <WifiOff className="h-5 w-5 shrink-0" />
    <div className="flex-1">
      <p className="font-medium">Connection lost</p>
      <p className="text-sm opacity-90">Changes saved locally</p>
    </div>
    <div className="flex gap-2">
      <Button 
        size="sm" 
        variant="outline"
        className="bg-transparent border-destructive-foreground/20"
        onClick={retry}
      >
        Retry
      </Button>
      <Button 
        size="sm" 
        variant="ghost"
        onClick={dismiss}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  </div>
);
```

---

### Mobile-Specific Interactions

#### Swipe Gestures
```css
.swipe-card {
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
}

.swipe-card.swiping {
  transition: none;
}

.swipe-action-revealed {
  animation: action-reveal 0.3s ease-out;
}

@keyframes action-reveal {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.swipe-action-button {
  transition: all 150ms ease;
}

.swipe-action-button:active {
  transform: scale(0.95);
  filter: brightness(0.9);
}
```

#### Pull-to-refresh
```typescript
const PullToRefresh = ({ onRefresh, children }) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const threshold = 80;
  
  return (
    <div className="relative">
      <div 
        className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200"
        style={{
          height: `${Math.min(pullDistance, threshold)}px`,
          opacity: pullDistance > 20 ? 1 : 0
        }}
      >
        <div className={`transition-transform duration-200 ${
          pullDistance > threshold ? 'rotate-180' : ''
        }`}>
          <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </div>
      </div>
      
      <div style={{ paddingTop: isRefreshing ? `${threshold}px` : 0 }}>
        {children}
      </div>
    </div>
  );
};
```

---

### Loading State Orchestration

#### Skeleton Animation
```css
.skeleton {
  background: linear-gradient(
    90deg,
    hsl(var(--muted)) 25%,
    hsl(var(--muted-foreground) / 0.1) 50%,
    hsl(var(--muted)) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.staggered-skeleton:nth-child(1) { animation-delay: 0ms; }
.staggered-skeleton:nth-child(2) { animation-delay: 100ms; }
.staggered-skeleton:nth-child(3) { animation-delay: 200ms; }
```

#### Progressive Enhancement
```typescript
const ProgressiveLoader = ({ isLoading, children }) => {
  const [showContent, setShowContent] = useState(false);
  
  useEffect(() => {
    if (!isLoading) {
      // Slight delay to avoid flash
      setTimeout(() => setShowContent(true), 50);
    }
  }, [isLoading]);
  
  return (
    <div className="relative">
      {isLoading && (
        <div className="animate-in fade-in duration-200">
          <MilestoneSkeleton />
        </div>
      )}
      
      {showContent && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-400">
          {children}
        </div>
      )}
    </div>
  );
};
```

---

## Accessibility & Reduced Motion

### Respecting User Preferences
```css
@media (prefers-reduced-motion: reduce) {
  *,
  ::before,
  ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  /* Keep essential feedback animations */
  .milestone-checkbox[data-state="checked"],
  .field-error-enter,
  .optimistic-update-success {
    animation-duration: 0.2s !important;
  }
}

@media (prefers-reduced-motion: no-preference) {
  /* Enhanced animations for users who enjoy them */
  .milestone-completion {
    animation: completion-celebration 1s ease-out;
  }
  
  @keyframes completion-celebration {
    0% { transform: scale(1); }
    50% { 
      transform: scale(1.1); 
      filter: brightness(1.2);
    }
    100% { 
      transform: scale(1);
      filter: brightness(1);
    }
  }
}
```

### Focus Management
```typescript
const useFocusManagement = () => {
  const focusRingStyles = {
    base: "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    high: "focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-4",
    error: "focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
  };
  
  const trapFocus = (containerRef) => {
    // Implementation for modal focus trapping
  };
  
  const announceLiveUpdate = (message) => {
    // Screen reader announcements
  };
  
  return { focusRingStyles, trapFocus, announceLiveUpdate };
};
```

This interaction system creates a cohesive, efficient interface that feels responsive and reliable in the demanding field environment while remaining accessible to all users.