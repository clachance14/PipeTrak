# Mobile Interaction Patterns & Accessibility

## Overview

This document defines the interaction patterns, micro-animations, and accessibility implementations for PipeTrak's mobile milestone interface. All patterns are optimized for construction field conditions, including work glove compatibility, one-handed operation, and harsh environmental factors.

## Core Interaction Principles

### Field-First Design Rules

1. **Direct Action**: No hidden gestures or complex interactions
2. **Immediate Feedback**: Visual response within 50ms of touch
3. **Forgiving Touch**: Large targets with generous tap zones  
4. **Clear Recovery**: Obvious paths to fix mistakes or errors
5. **One-Handed**: All primary actions within thumb reach

### Touch Interaction Guidelines

#### Primary Interactions
- **Single Tap**: Toggle milestone completion state
- **Press & Hold**: Show context menu (1000ms delay)
- **Focus + Enter/Space**: Keyboard activation

#### Prohibited Interactions
- **Double Tap**: Risk of accidental activation with gloves
- **Swipe**: Replaced with direct button taps
- **Pinch/Zoom**: Not applicable to milestone buttons
- **Edge Swipes**: Conflict with system navigation

## Touch Behavior Specifications

### Touch Event Handling

```typescript
interface TouchBehavior {
  // Touch area extends beyond visual button for easier targeting
  touchArea: {
    width: string; // 100% of button width + 4px
    height: string; // 100% of button height + 4px
    padding: string; // 2px all sides
  };
  
  // Response timing
  feedback: {
    visual: number; // <16ms (1 frame at 60fps)
    haptic: number; // <50ms
    audio: number; // <100ms (optional)
  };
  
  // State management
  states: {
    idle: TouchState;
    pressed: TouchState;
    loading: TouchState;
    success: TouchState;
    error: TouchState;
  };
}

// Touch state definitions
interface TouchState {
  backgroundColor: string;
  borderColor: string;
  transform: string;
  boxShadow: string;
  transition: string;
}

const touchBehavior: TouchBehavior = {
  touchArea: {
    width: 'calc(100% + 4px)',
    height: 'calc(100% + 4px)',
    padding: '2px'
  },
  
  feedback: {
    visual: 16,  // 1 frame
    haptic: 50,  // System haptic delay
    audio: 100   // Optional audio feedback
  },
  
  states: {
    idle: {
      backgroundColor: 'var(--milestone-available-bg)',
      borderColor: 'var(--milestone-available-border)',
      transform: 'scale(1)',
      boxShadow: 'none',
      transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)'
    },
    
    pressed: {
      backgroundColor: 'var(--milestone-available-bg)',
      borderColor: 'var(--milestone-available-border)',
      transform: 'scale(0.95)',
      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
      transition: 'all 75ms cubic-bezier(0.4, 0, 0.2, 1)'
    },
    
    loading: {
      backgroundColor: 'var(--milestone-loading-bg)',
      borderColor: 'var(--milestone-loading-border)',
      transform: 'scale(1)',
      boxShadow: 'none',
      transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'
    },
    
    success: {
      backgroundColor: 'var(--milestone-complete-bg)',
      borderColor: 'var(--milestone-complete-border)',  
      transform: 'scale(1.05)',
      boxShadow: '0 4px 8px rgba(16, 185, 129, 0.3)',
      transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'
    },
    
    error: {
      backgroundColor: 'var(--milestone-error-bg)',
      borderColor: 'var(--milestone-error-border)',
      transform: 'translateX(0)',
      boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
      transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)'
    }
  }
};
```

### Haptic Feedback Integration

```typescript
interface HapticFeedback {
  light: () => void;    // Button press confirmation
  medium: () => void;   // State change confirmation  
  heavy: () => void;    // Error or important state
  success: () => void;  // Milestone completion
  error: () => void;    // Failed operation
}

const hapticFeedback: HapticFeedback = {
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10); // 10ms light tap
    }
  },
  
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(25); // 25ms medium feedback
    }
  },
  
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 25, 50]); // Double pulse
    }
  },
  
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([25, 10, 25, 10, 50]); // Success pattern
    }
  },
  
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]); // Error pattern
    }
  }
};

// Usage in milestone interactions
const handleMilestoneTouch = (event: TouchEvent, milestone: Milestone) => {
  switch (event.type) {
    case 'touchstart':
      hapticFeedback.light();
      break;
      
    case 'touchend':
      if (isSuccessfulToggle(milestone)) {
        hapticFeedback.success();
      }
      break;
      
    case 'error':
      hapticFeedback.error();
      break;
  }
};
```

## Animation Specifications

### Micro-Interactions

#### Button Press Animation
```css
/* Immediate press feedback */
@keyframes button-press {
  0% { 
    transform: scale(1);
  }
  100% { 
    transform: scale(0.95);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  }
}

.milestone-button.pressed {
  animation: button-press 75ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
```

#### State Change Animations
```css
/* Completion success animation */
@keyframes milestone-complete {
  0% { 
    transform: scale(1);
    background-color: var(--milestone-available-bg);
  }
  50% { 
    transform: scale(1.1);
    background-color: var(--milestone-complete-bg);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  }
  100% { 
    transform: scale(1);
    background-color: var(--milestone-complete-bg);
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
  }
}

.milestone-button.success-animation {
  animation: milestone-complete 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Error shake animation */  
@keyframes milestone-error-shake {
  0%, 100% { 
    transform: translateX(0); 
  }
  25% { 
    transform: translateX(-4px);
    border-color: var(--destructive);
  }
  75% { 
    transform: translateX(4px);
    border-color: var(--destructive);
  }
}

.milestone-button.error-animation {
  animation: milestone-error-shake 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Loading pulse animation */
@keyframes milestone-loading {
  0%, 100% { 
    opacity: 1; 
    background-color: var(--milestone-loading-bg);
  }
  50% { 
    opacity: 0.7; 
    background-color: var(--milestone-available-bg);
  }
}

.milestone-button.loading-animation {
  animation: milestone-loading 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
```

#### Status Icon Animations
```css
/* Icon fade-in animation */
@keyframes icon-fade-in {
  0% { 
    opacity: 0; 
    transform: scale(0.8);
  }
  100% { 
    opacity: 1; 
    transform: scale(1);
  }
}

.milestone-status-icon {
  animation: icon-fade-in 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Loading spinner */
@keyframes icon-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.milestone-status-icon.loading {
  animation: icon-spin 1s linear infinite;
}
```

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  /* Disable animations for users who prefer reduced motion */
  .milestone-button,
  .milestone-button.pressed,
  .milestone-button.success-animation,
  .milestone-button.error-animation,
  .milestone-button.loading-animation,
  .milestone-status-icon {
    animation: none !important;
    transition: none !important;
  }
  
  /* Provide alternative feedback through color/opacity changes */
  .milestone-button.pressed {
    opacity: 0.8;
  }
  
  .milestone-button.success-animation {
    background-color: var(--milestone-complete-bg);
  }
  
  .milestone-button.error-animation {
    border-color: var(--destructive);
  }
}
```

## Accessibility Implementation

### WCAG 2.1 Compliance

#### Level AA Requirements Met
- **Color Contrast**: 4.5:1 minimum for normal text, 3:1 for large text
- **Touch Targets**: 44x44px minimum (we exceed with 56px height)
- **Focus Indicators**: Visible 2px outline on keyboard focus
- **Text Alternatives**: All icons have text alternatives
- **Keyboard Navigation**: Full keyboard access to all functions

#### Level AAA Enhancements
- **Color Contrast**: 7:1 for critical status indicators
- **Touch Targets**: 56px minimum (exceeds 44px requirement)
- **Error Recovery**: Clear instructions and easy correction paths

### Screen Reader Support

#### Milestone Button ARIA Implementation
```tsx
interface MilestoneButtonProps {
  milestone: Milestone;
  state: MilestoneButtonState;
  onToggle: () => void;
  dependencies?: Milestone[];
}

const MilestoneButton = ({ milestone, state, onToggle, dependencies }: MilestoneButtonProps) => {
  const getAriaLabel = () => {
    const baseName = milestone.fullName;
    const stateText = state === 'complete' ? 'completed' : 'not completed';
    const sequenceText = `Step ${milestone.sequenceNumber} of 7`;
    
    return `${baseName}, ${stateText}, ${sequenceText}`;
  };
  
  const getAriaDescription = () => {
    switch (state) {
      case 'blocked':
        const blockedBy = dependencies
          ?.filter(d => !d.isCompleted && d.sequenceNumber < milestone.sequenceNumber)
          .map(d => d.milestoneName)
          .join(', ');
        return `Cannot complete. Waiting for: ${blockedBy}`;
        
      case 'dependent':
        return 'Can complete but has pending dependencies';
        
      case 'error':
        return 'Previous update failed. Tap to retry';
        
      case 'loading':
        return 'Update in progress';
        
      default:
        return '';
    }
  };
  
  return (
    <button
      className={`milestone-button ${state}`}
      aria-label={getAriaLabel()}
      aria-describedby={milestone.description ? `desc-${milestone.id}` : undefined}
      aria-pressed={state === 'complete'}
      aria-disabled={state === 'blocked' || state === 'loading'}
      aria-busy={state === 'loading'}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
    >
      <span className="milestone-abbr" aria-hidden="true">
        {milestone.abbreviation}
      </span>
      
      <div className="milestone-status-icon" aria-hidden="true">
        {getStatusIcon(state)}
      </div>
      
      {/* Hidden description for screen readers */}
      {milestone.description && (
        <div id={`desc-${milestone.id}`} className="sr-only">
          {milestone.description}
        </div>
      )}
      
      {/* Live region for state announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
        id={`status-${milestone.id}`}
      >
        {getAriaDescription()}
      </div>
    </button>
  );
};
```

#### Live Announcements
```typescript
interface LiveAnnouncements {
  announceStateChange: (milestone: Milestone, newState: MilestoneButtonState) => void;
  announceError: (milestone: Milestone, error: string) => void;
  announceProgress: (completed: number, total: number) => void;
}

const liveAnnouncements: LiveAnnouncements = {
  announceStateChange: (milestone, newState) => {
    const announcement = newState === 'complete'
      ? `${milestone.fullName} completed`
      : `${milestone.fullName} marked incomplete`;
      
    updateLiveRegion(announcement, 'polite');
  },
  
  announceError: (milestone, error) => {
    const announcement = `Error updating ${milestone.fullName}: ${error}. Tap to retry.`;
    updateLiveRegion(announcement, 'assertive');
  },
  
  announceProgress: (completed, total) => {
    const announcement = `${completed} of ${total} milestones completed`;
    updateLiveRegion(announcement, 'polite');
  }
};

const updateLiveRegion = (message: string, priority: 'polite' | 'assertive') => {
  const liveRegion = document.getElementById('milestone-announcements');
  if (liveRegion) {
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.textContent = message;
    
    // Clear after announcement to avoid repetition
    setTimeout(() => {
      liveRegion.textContent = '';
    }, 1000);
  }
};
```

### Keyboard Navigation

#### Navigation Patterns
```typescript
interface KeyboardNavigation {
  focusableElements: HTMLElement[];
  currentIndex: number;
  
  // Core navigation
  next: () => void;
  previous: () => void;
  first: () => void;
  last: () => void;
  
  // Activation
  activate: () => void;
  
  // Context
  showContext: () => void;
}

const milestoneKeyboardNav: KeyboardNavigation = {
  focusableElements: [],
  currentIndex: -1,
  
  next() {
    if (this.currentIndex < this.focusableElements.length - 1) {
      this.currentIndex++;
      this.focusableElements[this.currentIndex].focus();
    }
  },
  
  previous() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.focusableElements[this.currentIndex].focus();
    }
  },
  
  first() {
    this.currentIndex = 0;
    this.focusableElements[0].focus();
  },
  
  last() {
    this.currentIndex = this.focusableElements.length - 1;
    this.focusableElements[this.currentIndex].focus();
  },
  
  activate() {
    const element = this.focusableElements[this.currentIndex] as HTMLButtonElement;
    if (element && !element.disabled) {
      element.click();
    }
  },
  
  showContext() {
    // Show milestone context menu or details
    const element = this.focusableElements[this.currentIndex];
    const milestoneId = element.getAttribute('data-milestone-id');
    if (milestoneId) {
      showMilestoneContext(milestoneId);
    }
  }
};

// Keyboard event handler
const handleKeyboardNavigation = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      event.preventDefault();
      milestoneKeyboardNav.next();
      break;
      
    case 'ArrowLeft':
    case 'ArrowUp':
      event.preventDefault();  
      milestoneKeyboardNav.previous();
      break;
      
    case 'Home':
      event.preventDefault();
      milestoneKeyboardNav.first();
      break;
      
    case 'End':
      event.preventDefault();
      milestoneKeyboardNav.last();
      break;
      
    case 'Enter':
    case ' ': // Spacebar
      event.preventDefault();
      milestoneKeyboardNav.activate();
      break;
      
    case 'F10':
    case 'ContextMenu':
      event.preventDefault();
      milestoneKeyboardNav.showContext();
      break;
      
    case 'Escape':
      // Return focus to component card level
      const componentCard = event.target.closest('.component-card');
      if (componentCard) {
        (componentCard as HTMLElement).focus();
      }
      break;
  }
};
```

#### Focus Management
```typescript
interface FocusManager {
  trapFocus: (container: HTMLElement) => void;
  restoreFocus: (previousElement: HTMLElement) => void;
  manageFocusOnStateChange: (milestone: Milestone, newState: MilestoneButtonState) => void;
}

const focusManager: FocusManager = {
  trapFocus(container) {
    const focusableElements = container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    container.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    });
  },
  
  restoreFocus(previousElement) {
    if (previousElement && typeof previousElement.focus === 'function') {
      previousElement.focus();
    }
  },
  
  manageFocusOnStateChange(milestone, newState) {
    const button = document.querySelector(`[data-milestone-id="${milestone.id}"]`) as HTMLElement;
    
    if (button) {
      // Keep focus on button after state change
      button.focus();
      
      // Announce the change
      liveAnnouncements.announceStateChange(milestone, newState);
    }
  }
};
```

## Error Handling & Recovery

### User-Friendly Error Messages
```typescript
interface ErrorRecovery {
  networkError: (milestone: Milestone) => ErrorRecoveryOptions;
  validationError: (milestone: Milestone, validation: ValidationError) => ErrorRecoveryOptions;
  permissionError: (milestone: Milestone) => ErrorRecoveryOptions;
  dependencyError: (milestone: Milestone, dependencies: Milestone[]) => ErrorRecoveryOptions;
}

interface ErrorRecoveryOptions {
  message: string;
  actions: RecoveryAction[];
  severity: 'low' | 'medium' | 'high';
}

interface RecoveryAction {
  label: string;
  action: () => void;
  primary?: boolean;
}

const errorRecovery: ErrorRecovery = {
  networkError: (milestone) => ({
    message: 'Connection lost. Your change will be saved when connection returns.',
    actions: [
      {
        label: 'Retry Now',
        action: () => retryMilestoneUpdate(milestone),
        primary: true
      },
      {
        label: 'Continue Offline',
        action: () => continueOfflineMode()
      }
    ],
    severity: 'medium'
  }),
  
  validationError: (milestone, validation) => ({
    message: validation.message,
    actions: [
      {
        label: 'Fix Issue',
        action: () => showMilestoneDetails(milestone),
        primary: true
      },
      {
        label: 'Cancel',
        action: () => revertMilestoneState(milestone)
      }
    ],
    severity: 'high'
  }),
  
  permissionError: (milestone) => ({
    message: 'You don\'t have permission to modify this milestone.',
    actions: [
      {
        label: 'Request Access',
        action: () => requestMilestoneAccess(milestone),
        primary: true
      },
      {
        label: 'Cancel',
        action: () => revertMilestoneState(milestone)
      }
    ],
    severity: 'high'
  }),
  
  dependencyError: (milestone, dependencies) => {
    const incompleteDeps = dependencies
      .filter(d => !d.isCompleted && d.sequenceNumber < milestone.sequenceNumber)
      .map(d => d.milestoneName)
      .join(', ');
      
    return {
      message: `Complete these milestones first: ${incompleteDeps}`,
      actions: [
        {
          label: 'Show Dependencies',
          action: () => highlightDependencies(dependencies),
          primary: true
        },
        {
          label: 'Cancel',
          action: () => revertMilestoneState(milestone)
        }
      ],
      severity: 'medium'
    };
  }
};
```

## Performance Considerations

### Interaction Response Targets
- **Touch Response**: <50ms visual feedback
- **State Change**: <100ms from tap to state update
- **Animation Duration**: 150-300ms (non-blocking)
- **Error Recovery**: <500ms to show error state

### Memory Management
```typescript
// Efficient event listener management
class MilestoneInteractionManager {
  private eventListeners = new Map<string, EventListener[]>();
  
  addListener(element: HTMLElement, event: string, listener: EventListener) {
    const key = `${element.id}-${event}`;
    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, []);
    }
    
    this.eventListeners.get(key)!.push(listener);
    element.addEventListener(event, listener);
  }
  
  removeAllListeners(element: HTMLElement) {
    for (const [key, listeners] of this.eventListeners.entries()) {
      if (key.startsWith(element.id)) {
        listeners.forEach(listener => {
          const [, event] = key.split('-');
          element.removeEventListener(event, listener);
        });
        this.eventListeners.delete(key);
      }
    }
  }
  
  cleanup() {
    this.eventListeners.clear();
  }
}
```

## Testing Requirements

### Accessibility Testing Checklist
- [ ] Screen reader compatibility (NVDA, JAWS, VoiceOver)
- [ ] Keyboard navigation completeness
- [ ] Color contrast validation (4.5:1 minimum)
- [ ] Touch target size validation (44px minimum)
- [ ] Focus indicator visibility
- [ ] Error message clarity
- [ ] Live region announcements

### Interaction Testing Checklist  
- [ ] Touch response within 50ms target
- [ ] Haptic feedback on supported devices
- [ ] Animation performance (60fps target)
- [ ] State change accuracy
- [ ] Error recovery functionality
- [ ] Offline interaction queueing

### Field Testing Checklist
- [ ] Work glove compatibility (various thicknesses)
- [ ] One-handed operation capability
- [ ] Sunlight visibility validation
- [ ] Wet screen interaction testing
- [ ] Battery impact assessment
- [ ] Network interruption handling

---

*Next: [Design Tokens Implementation](../../assets/design-tokens.json)*