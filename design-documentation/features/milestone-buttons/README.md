# Milestone Button Design Specifications

## Overview

Milestone buttons are the core interactive elements of the mobile milestone tracking system. Each button represents a specific construction milestone (REC, ERC, CON, SUP, PCH, TST, RST) with direct-tap activation replacing traditional swipe gestures. The design prioritizes immediate visual status recognition and glove-compatible touch targets.

## Button Specifications

### Dimensions and Layout

```css
/* Base Dimensions (360px screen) */
.milestone-button {
  width: calc(100% / 7); /* ~51px on 360px screen */
  height: 56px;
  min-width: 44px; /* WCAG minimum */
  min-height: 56px; /* Industrial glove optimized */
}

/* Responsive Widths */
@media (min-width: 375px) { width: ~54px; } /* 375px / 7 */
@media (min-width: 414px) { width: ~59px; } /* 414px / 7 */
@media (min-width: 768px) { width: ~110px; height: 64px; } /* Tablet */
```

### Internal Structure

Each button contains:
- **Abbreviation Label**: 3-letter milestone code (12px semibold)
- **Status Circle**: 12px circle in top-right corner
- **Background**: Status-driven color scheme

```tsx
<button className="milestone-button" aria-label={fullMilestoneName}>
  <span className="milestone-abbr">{abbreviation}</span>
  <div className="milestone-status-circle" aria-hidden="true">
    {statusIcon}
  </div>
</button>
```

## Milestone Types and Abbreviations

### Standard Construction Milestones

1. **REC** - Receive Material
   - Full Name: "Receive Material"
   - Description: Material delivered to site and logged

2. **ERC** - Erect/Install  
   - Full Name: "Erect and Install"
   - Description: Physical installation and positioning

3. **CON** - Connect
   - Full Name: "Connect"  
   - Description: Joining connections made

4. **SUP** - Support Installation
   - Full Name: "Support Installation"
   - Description: Structural support systems installed

5. **PCH** - Punch List
   - Full Name: "Punch List Complete"
   - Description: Quality control items addressed

6. **TST** - Test
   - Full Name: "Testing Complete"
   - Description: All required tests performed and passed

7. **RST** - Ready for Startup
   - Full Name: "Ready for Startup"
   - Description: Component ready for commissioning

## Button States

### 1. Available State

**Visual**: White background, green border, dark text
**Interaction**: Tappable to mark complete
**Use Case**: Milestone can be completed (dependencies met)

```css
.milestone-button.available {
  background: #ffffff;
  border: 2px solid #10b981; /* var(--field-complete) */
  color: #1a1a1a;
}

.milestone-button.available .status-circle {
  background: #ffffff;
  border: 1px solid #10b981;
}
```

### 2. Complete State

**Visual**: Green background, white text
**Interaction**: Tappable to mark incomplete (if allowed)
**Use Case**: Milestone marked complete

```css
.milestone-button.complete {
  background: #10b981; /* var(--field-complete) */
  border: 2px solid #10b981;
  color: #ffffff;
}

.milestone-button.complete .status-circle {
  background: #ffffff;
  border: none;
}
```

**Status Icon**: CheckCircle (white, 12px)

### 3. Blocked State  

**Visual**: Gray background, white text, lock icon
**Interaction**: Non-interactive (disabled)
**Use Case**: Previous milestones not complete

```css
.milestone-button.blocked {
  background: #6b7280; /* gray-500 */
  border: 2px solid #6b7280;
  color: #ffffff;
  cursor: not-allowed;
  opacity: 0.8;
}

.milestone-button.blocked .status-circle {
  background: #ffffff;
  border: none;
}
```

**Status Icon**: Lock (white, 12px)

### 4. Dependent State

**Visual**: Green background, yellow border, white text  
**Interaction**: Tappable but shows dependency warning
**Use Case**: Can complete but has pending dependencies

```css
.milestone-button.dependent {
  background: #10b981; /* var(--field-complete) */
  border: 2px solid #eab308; /* yellow-500 */
  color: #ffffff;
}

.milestone-button.dependent .status-circle {
  background: #eab308;
  border: none;
}
```

**Status Icon**: Clock (white, 12px)

### 5. Error State

**Visual**: White background, red border, dark text
**Interaction**: Tappable to retry failed update
**Use Case**: Previous update attempt failed

```css
.milestone-button.error {
  background: #ffffff;
  border: 2px solid #ef4444; /* var(--destructive) */
  color: #1a1a1a;
}

.milestone-button.error .status-circle {
  background: #ef4444;
  border: none;
}
```

**Status Icon**: AlertCircle (white, 12px)

### 6. Loading State

**Visual**: Gray background, animated spinner
**Interaction**: Non-interactive during update
**Use Case**: Optimistic update in progress

```css
.milestone-button.loading {
  background: #f3f4f6; /* gray-100 */
  border: 2px solid #d1d5db; /* gray-300 */
  color: #6b7280; /* gray-500 */
  cursor: wait;
}

.milestone-button.loading .status-circle {
  background: transparent;
  border: none;
}
```

**Status Icon**: Loader2 (gray, 12px, spinning)

## State Machine

### State Transitions

```typescript
type MilestoneButtonState = 
  | 'available'    // Can be marked complete
  | 'complete'     // Already completed  
  | 'blocked'      // Dependencies not met
  | 'dependent'    // Has dependencies but can complete
  | 'loading'      // Update in progress
  | 'error';       // Update failed

interface StateTransition {
  from: MilestoneButtonState;
  to: MilestoneButtonState;
  trigger: 'user_tap' | 'dependency_change' | 'api_success' | 'api_error' | 'timeout';
  condition?: boolean;
}

const transitions: StateTransition[] = [
  // User interactions
  { from: 'available', to: 'loading', trigger: 'user_tap' },
  { from: 'complete', to: 'loading', trigger: 'user_tap', condition: canUndo },
  { from: 'dependent', to: 'loading', trigger: 'user_tap' },
  { from: 'error', to: 'loading', trigger: 'user_tap' },
  
  // API responses
  { from: 'loading', to: 'complete', trigger: 'api_success' },
  { from: 'loading', to: 'error', trigger: 'api_error' },
  { from: 'loading', to: 'available', trigger: 'timeout' },
  
  // Dependency changes
  { from: 'blocked', to: 'available', trigger: 'dependency_change' },
  { from: 'available', to: 'blocked', trigger: 'dependency_change' },
  { from: 'complete', to: 'dependent', trigger: 'dependency_change' },
];
```

### Business Logic Rules

```typescript
interface MilestoneRules {
  // Dependency checking
  canComplete: (milestone: Milestone, allMilestones: Milestone[]) => boolean;
  canUndo: (milestone: Milestone, permissions: UserPermissions) => boolean;
  
  // State determination  
  getInitialState: (milestone: Milestone, dependencies: Milestone[]) => MilestoneButtonState;
  getNextState: (current: MilestoneButtonState, trigger: StateTrigger) => MilestoneButtonState;
}

const milestoneRules: MilestoneRules = {
  canComplete: (milestone, allMilestones) => {
    // Check if all required previous milestones are complete
    const requiredMilestones = allMilestones
      .filter(m => m.sequenceNumber < milestone.sequenceNumber)
      .filter(m => m.isRequired);
    
    return requiredMilestones.every(m => m.isCompleted);
  },
  
  canUndo: (milestone, permissions) => {
    // Only admins can undo completed milestones
    // Only if no subsequent milestones are complete
    return permissions.role === 'admin' && 
           !milestone.hasSubsequentCompletions;
  },
  
  getInitialState: (milestone, dependencies) => {
    if (!this.canComplete(milestone, dependencies)) return 'blocked';
    if (milestone.isCompleted) return 'complete';
    if (milestone.hasPendingDependencies) return 'dependent';
    return 'available';
  }
};
```

## Interaction Patterns

### Touch Behavior

```typescript
interface TouchHandler {
  onTouchStart: (event: TouchEvent) => void;
  onTouchEnd: (event: TouchEvent) => void;
  onTouchCancel: (event: TouchEvent) => void;
}

const milestoneButtonTouch: TouchHandler = {
  onTouchStart: (event) => {
    // Immediate visual feedback
    button.classList.add('pressed');
    hapticFeedback.light();
    
    // Prevent scroll during interaction
    event.preventDefault();
  },
  
  onTouchEnd: (event) => {
    button.classList.remove('pressed');
    
    // Only trigger if touch ended within button bounds
    if (isTouchWithinBounds(event, button)) {
      handleMilestoneToggle();
    }
  },
  
  onTouchCancel: (event) => {
    button.classList.remove('pressed');
  }
};
```

### Optimistic Updates

```typescript
interface OptimisticUpdate {
  execute: (milestone: Milestone, newState: boolean) => Promise<void>;
  rollback: (milestone: Milestone, previousState: boolean) => void;
}

const optimisticMilestoneUpdate: OptimisticUpdate = {
  async execute(milestone, newState) {
    // 1. Immediate UI update
    updateButtonVisualState(milestone.id, newState ? 'complete' : 'available');
    
    // 2. Show loading state
    setTimeout(() => {
      updateButtonVisualState(milestone.id, 'loading');
    }, 50);
    
    // 3. Make API call
    try {
      await api.updateMilestone(milestone.id, { isCompleted: newState });
      updateButtonVisualState(milestone.id, newState ? 'complete' : 'available');
    } catch (error) {
      // 4. Rollback on failure
      this.rollback(milestone, !newState);
      showErrorToast('Update failed. Please try again.');
    }
  },
  
  rollback(milestone, previousState) {
    updateButtonVisualState(milestone.id, previousState ? 'complete' : 'available');
    
    // Subtle error animation
    button.classList.add('error-shake');
    setTimeout(() => button.classList.remove('error-shake'), 300);
  }
};
```

## Accessibility Implementation

### ARIA Labels and Properties

```tsx
<button
  className={`milestone-button ${state}`}
  aria-label={`${fullName} - ${state === 'complete' ? 'Completed' : 'Not completed'}`}
  aria-describedby={`${milestoneId}-description`}
  aria-pressed={state === 'complete'}
  aria-disabled={state === 'blocked' || state === 'loading'}
  data-milestone-id={milestoneId}
  data-sequence-number={sequenceNumber}
>
  <span className="milestone-abbr" aria-hidden="true">
    {abbreviation}
  </span>
  <div className="milestone-status-circle" aria-hidden="true">
    {getStatusIcon(state)}
  </div>
  
  {/* Screen reader only description */}
  <div id={`${milestoneId}-description`} className="sr-only">
    {getStateDescription(state, dependencies)}
  </div>
</button>
```

### Keyboard Navigation

```typescript
interface KeyboardHandler {
  onKeyDown: (event: KeyboardEvent) => void;
  onFocus: (event: FocusEvent) => void;
  onBlur: (event: FocusEvent) => void;
}

const milestoneKeyboard: KeyboardHandler = {
  onKeyDown: (event) => {
    switch (event.key) {
      case 'Enter':
      case ' ': // Spacebar
        event.preventDefault();
        handleMilestoneToggle();
        break;
        
      case 'ArrowLeft':
      case 'ArrowRight':
        event.preventDefault();
        navigateToNextMilestone(event.key === 'ArrowRight' ? 1 : -1);
        break;
        
      case 'Home':
        event.preventDefault();
        focusFirstMilestone();
        break;
        
      case 'End':
        event.preventDefault();
        focusLastMilestone();
        break;
    }
  },
  
  onFocus: (event) => {
    // Announce milestone state to screen readers
    announceToScreenReader(getFullStateDescription());
    
    // Visual focus indicator
    button.classList.add('keyboard-focused');
  },
  
  onBlur: (event) => {
    button.classList.remove('keyboard-focused');
  }
};
```

### Screen Reader Announcements

```typescript
interface ScreenReaderAnnouncements {
  onStateChange: (milestone: Milestone, oldState: string, newState: string) => void;
  onError: (milestone: Milestone, error: string) => void;
  onLoading: (milestone: Milestone) => void;
}

const screenReaderAnnouncements: ScreenReaderAnnouncements = {
  onStateChange: (milestone, oldState, newState) => {
    const message = newState === 'complete' 
      ? `${milestone.fullName} marked complete`
      : `${milestone.fullName} marked incomplete`;
    
    announceToScreenReader(message, 'polite');
  },
  
  onError: (milestone, error) => {
    announceToScreenReader(
      `Failed to update ${milestone.fullName}. ${error}`,
      'assertive'
    );
  },
  
  onLoading: (milestone) => {
    announceToScreenReader(
      `Updating ${milestone.fullName}`,
      'polite'
    );
  }
};
```

## Performance Specifications

### Rendering Optimization

```typescript
// Memoized button component
const MilestoneButton = React.memo(({ 
  milestone, 
  state, 
  onToggle,
  isVisible 
}: MilestoneButtonProps) => {
  // Only render if visible in viewport
  if (!isVisible) return <div className="milestone-button-placeholder" />;
  
  return (
    <button
      className={`milestone-button ${state}`}
      onClick={() => onToggle(milestone.id)}
    >
      {/* Button content */}
    </button>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for optimal re-renders
  return (
    prevProps.state === nextProps.state &&
    prevProps.milestone.id === nextProps.milestone.id &&
    prevProps.isVisible === nextProps.isVisible
  );
});
```

### Touch Response Time

```typescript
// Target: <50ms from tap to visual feedback
const TOUCH_RESPONSE_TARGET = 50; // milliseconds

class TouchPerformanceMonitor {
  private touchStartTime = 0;
  
  onTouchStart() {
    this.touchStartTime = performance.now();
    
    // Immediate visual feedback (within 16ms)
    requestAnimationFrame(() => {
      button.classList.add('pressed');
    });
  }
  
  onTouchEnd() {
    const responseTime = performance.now() - this.touchStartTime;
    
    // Log performance for optimization
    if (responseTime > TOUCH_RESPONSE_TARGET) {
      console.warn(`Touch response exceeded target: ${responseTime}ms`);
    }
    
    // Remove pressed state
    requestAnimationFrame(() => {
      button.classList.remove('pressed');
    });
  }
}
```

## Implementation Checklist

### Required Components
- [ ] Base MilestoneButton component with all states
- [ ] State management hook (useMilestoneState)
- [ ] Optimistic update handler
- [ ] Error recovery mechanism
- [ ] Accessibility implementation

### Required Styles  
- [ ] State-specific button styles
- [ ] Touch interaction animations
- [ ] Loading state animations
- [ ] Error state animations
- [ ] Focus indicators
- [ ] Reduced motion support

### Required Functionality
- [ ] Touch event handling
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] State machine implementation
- [ ] Performance monitoring
- [ ] Error logging

### Testing Requirements
- [ ] All button states render correctly
- [ ] Touch targets meet WCAG requirements
- [ ] Keyboard navigation works properly
- [ ] Screen reader announcements are clear
- [ ] Optimistic updates work correctly
- [ ] Error recovery functions properly
- [ ] Performance meets targets (<50ms response)

---

*Next: [Interaction Patterns and Accessibility](../mobile-interactions/README.md)*