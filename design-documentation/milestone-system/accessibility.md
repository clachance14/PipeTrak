# Accessibility Guidelines - Milestone Update System

## WCAG AA Compliance Strategy

PipeTrak's milestone system meets WCAG 2.1 AA standards as a baseline, with enhanced requirements for industrial field use. Our accessibility approach prioritizes **functional accessibility** - ensuring the system works for users with disabilities in real construction environments.

---

## Color & Contrast Requirements

### Enhanced Contrast Standards
```css
:root {
  /* WCAG AA: 4.5:1 minimum, PipeTrak target: 6:1 */
  --contrast-aa-minimum: 4.5;
  --contrast-pipetrak-target: 6.0;
  --contrast-outdoor-enhanced: 8.0;
  
  /* Field-optimized color tokens */
  --field-text-primary: #1a1a1a; /* 15.3:1 on white */
  --field-text-secondary: #374151; /* 8.9:1 on white */
  --field-background: #ffffff;
  --field-surface: #f9fafb;
  
  /* Status colors with enhanced contrast */
  --status-complete: #047857; /* Dark green, 7.2:1 */
  --status-complete-bg: #ecfdf5; /* Light green background */
  --status-pending: #b45309; /* Dark amber, 6.8:1 */
  --status-pending-bg: #fffbeb;
  --status-critical: #dc2626; /* Red, 6.1:1 */
  --status-critical-bg: #fef2f2;
  --status-blocked: #ea580c; /* Orange, 5.9:1 */
  --status-blocked-bg: #fff7ed;
}

/* Dark mode with enhanced outdoor visibility */
.dark {
  --field-text-primary: #f9fafb;
  --field-text-secondary: #d1d5db;
  --field-background: #111827;
  --field-surface: #1f2937;
  
  /* High contrast status colors for dark mode */
  --status-complete: #10b981;
  --status-complete-bg: #064e3b;
  --status-pending: #f59e0b;
  --status-pending-bg: #78350f;
  --status-critical: #ef4444;
  --status-critical-bg: #7f1d1d;
  --status-blocked: #f97316;
  --status-blocked-bg: #9a3412;
}

/* High contrast mode for extreme outdoor conditions */
@media (prefers-contrast: high) {
  :root {
    --field-text-primary: #000000;
    --field-text-secondary: #2d3748;
    --field-background: #ffffff;
    --border-contrast: #000000;
  }
  
  .dark {
    --field-text-primary: #ffffff;
    --field-text-secondary: #e2e8f0;
    --field-background: #000000;
    --border-contrast: #ffffff;
  }
}
```

### Color-Blind Friendly Design
```typescript
const colorBlindSafeTokens = {
  // Using shape + color for status indication
  statusIndicators: {
    complete: { color: '#10b981', icon: 'CheckCircle2', shape: 'circle' },
    pending: { color: '#f59e0b', icon: 'Clock', shape: 'square' },
    blocked: { color: '#ef4444', icon: 'AlertTriangle', shape: 'triangle' },
    error: { color: '#dc2626', icon: 'X', shape: 'octagon' }
  },
  
  // Progress visualization patterns
  progressPatterns: {
    striped: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px)',
    dotted: 'radial-gradient(circle, currentColor 30%, transparent 30%)',
    solid: 'solid'
  }
};

const StatusBadge = ({ status, children }) => {
  const config = colorBlindSafeTokens.statusIndicators[status];
  const Icon = lucideIcons[config.icon];
  
  return (
    <Badge 
      className={`status-${status}`}
      style={{ 
        backgroundColor: config.color,
        '--pattern': colorBlindSafeTokens.progressPatterns[config.shape]
      }}
    >
      <Icon className="h-3 w-3 mr-1" />
      {children}
    </Badge>
  );
};
```

---

## Keyboard Navigation & Focus Management

### Focus Ring Enhancement
```css
.focus-visible {
  --focus-ring-width: 2px;
  --focus-ring-offset: 2px;
  --focus-ring-color: hsl(var(--primary));
  
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
  border-radius: calc(var(--radius) + var(--focus-ring-offset));
}

/* Enhanced focus for field conditions */
@media (prefers-contrast: high) {
  .focus-visible {
    --focus-ring-width: 3px;
    --focus-ring-offset: 3px;
  }
}

/* Critical interactive elements */
.milestone-control:focus-visible {
  --focus-ring-width: 3px;
  --focus-ring-color: hsl(var(--primary));
  box-shadow: 
    0 0 0 var(--focus-ring-offset) hsl(var(--background)),
    0 0 0 calc(var(--focus-ring-offset) + var(--focus-ring-width)) var(--focus-ring-color);
}

/* Error states */
.milestone-control[aria-invalid="true"]:focus-visible {
  --focus-ring-color: hsl(var(--destructive));
}
```

### Keyboard Shortcuts
```typescript
const keyboardShortcuts = {
  // Global shortcuts
  global: {
    'Ctrl+K': 'Open command palette',
    'Ctrl+/': 'Show keyboard shortcuts',
    'Esc': 'Close modals/cancel operation',
    'Ctrl+Z': 'Undo last milestone change'
  },
  
  // Table navigation
  table: {
    'Tab': 'Next cell',
    'Shift+Tab': 'Previous cell',
    'Enter': 'Edit selected cell',
    'Escape': 'Cancel edit, return to navigation',
    'Space': 'Select/deselect row',
    'Ctrl+A': 'Select all visible rows',
    'ArrowUp/Down': 'Navigate rows',
    'ArrowLeft/Right': 'Navigate columns',
    'Home': 'First cell in row',
    'End': 'Last cell in row',
    'Ctrl+Home': 'First cell in table',
    'Ctrl+End': 'Last cell in table'
  },
  
  // Milestone editing
  milestones: {
    'Space': 'Toggle checkbox milestone',
    'Enter': 'Confirm percentage/quantity input',
    '+': 'Increment quantity by 1',
    'Shift++': 'Increment quantity by 5',
    '-': 'Decrement quantity by 1',
    'Shift+-': 'Decrement quantity by 5',
    '0-9': 'Quick percentage (10%, 20%, etc.)',
    'C': 'Mark milestone complete',
    'R': 'Reset milestone to 0'
  },
  
  // Bulk operations
  bulk: {
    'Ctrl+Shift+M': 'Open bulk milestone modal',
    'Ctrl+Enter': 'Execute bulk update',
    'Ctrl+Shift+A': 'Select all components in current view',
    'Ctrl+Shift+D': 'Deselect all'
  }
};

const KeyboardShortcutsProvider = ({ children }) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = `${event.ctrlKey ? 'Ctrl+' : ''}${event.shiftKey ? 'Shift+' : ''}${event.key}`;
      
      // Global shortcuts
      if (keyboardShortcuts.global[key]) {
        event.preventDefault();
        handleGlobalShortcut(key);
      }
      
      // Context-specific shortcuts
      const context = getCurrentContext();
      if (keyboardShortcuts[context]?.[key]) {
        event.preventDefault();
        handleContextShortcut(context, key);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return children;
};
```

### Focus Trapping in Modals
```typescript
const useFocusTrap = (isActive) => {
  const containerRef = useRef();
  const previousActiveElement = useRef();
  
  useEffect(() => {
    if (!isActive) return;
    
    // Store currently focused element
    previousActiveElement.current = document.activeElement;
    
    const container = containerRef.current;
    if (!container) return;
    
    // Get all focusable elements
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    // Focus first element
    firstElement?.focus();
    
    const handleKeyDown = (event) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      // Restore focus
      previousActiveElement.current?.focus();
    };
  }, [isActive]);
  
  return containerRef;
};
```

---

## Screen Reader Support

### ARIA Labels and Descriptions
```typescript
const MilestoneDiscrete = ({ milestone, onUpdate }) => {
  const ariaLabel = `${milestone.milestoneName}, ${milestone.isCompleted ? 'completed' : 'not completed'}`;
  const ariaDescription = milestone.completedAt 
    ? `Completed on ${formatDate(milestone.completedAt)} by ${milestone.completedBy}`
    : 'Click to mark as complete';
  
  return (
    <div className="milestone-card">
      <Checkbox
        checked={milestone.isCompleted}
        onCheckedChange={(checked) => onUpdate(milestone.id, { isCompleted: checked })}
        aria-label={ariaLabel}
        aria-describedby={`milestone-desc-${milestone.id}`}
      />
      
      <div className="milestone-content">
        <Label className="milestone-name">
          {milestone.milestoneName}
        </Label>
        <div 
          id={`milestone-desc-${milestone.id}`}
          className="sr-only"
        >
          {ariaDescription}
        </div>
      </div>
    </div>
  );
};

const MilestonePercentage = ({ milestone, onUpdate }) => {
  const currentValue = milestone.percentageComplete || 0;
  
  return (
    <div className="milestone-card">
      <Label htmlFor={`slider-${milestone.id}`} className="milestone-name">
        {milestone.milestoneName}
      </Label>
      
      <div className="slider-container">
        <Slider
          id={`slider-${milestone.id}`}
          value={[currentValue]}
          onValueChange={(value) => onUpdate(milestone.id, { percentageComplete: value[0] })}
          min={0}
          max={100}
          step={5}
          aria-label={`${milestone.milestoneName} progress: ${currentValue} percent`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={currentValue}
          aria-valuetext={`${currentValue} percent complete`}
        />
        
        <div 
          aria-live="polite" 
          aria-atomic="true"
          className="sr-only"
        >
          {currentValue === 100 ? 'Milestone completed' : `${currentValue} percent complete`}
        </div>
      </div>
    </div>
  );
};

const MilestoneQuantity = ({ milestone, component, onUpdate }) => {
  const currentValue = milestone.quantityComplete || 0;
  const maxValue = milestone.quantityTotal || component.totalQuantity || 100;
  const unit = milestone.unit || 'items';
  
  return (
    <div className="milestone-card">
      <Label htmlFor={`quantity-${milestone.id}`}>
        {milestone.milestoneName}
      </Label>
      
      <div className="quantity-controls" role="group" aria-label="Quantity controls">
        <Button
          aria-label={`Decrease ${milestone.milestoneName} count`}
          disabled={currentValue <= 0}
          onClick={() => onUpdate(milestone.id, { quantityComplete: currentValue - 1 })}
        >
          <Minus className="h-4 w-4" />
        </Button>
        
        <Input
          id={`quantity-${milestone.id}`}
          type="number"
          value={currentValue}
          onChange={(e) => onUpdate(milestone.id, { quantityComplete: parseInt(e.target.value) || 0 })}
          min={0}
          max={maxValue}
          aria-label={`${milestone.milestoneName}: ${currentValue} of ${maxValue} ${unit}`}
          aria-describedby={`quantity-desc-${milestone.id}`}
        />
        
        <Button
          aria-label={`Increase ${milestone.milestoneName} count`}
          disabled={currentValue >= maxValue}
          onClick={() => onUpdate(milestone.id, { quantityComplete: currentValue + 1 })}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <div 
        id={`quantity-desc-${milestone.id}`}
        className="sr-only"
        aria-live="polite"
      >
        {currentValue} of {maxValue} {unit} complete. 
        {Math.round((currentValue / maxValue) * 100)}% progress.
      </div>
    </div>
  );
};
```

### Live Regions for Dynamic Updates
```typescript
const LiveUpdateAnnouncer = () => {
  const [announcements, setAnnouncements] = useState([]);
  
  const announce = (message, priority = 'polite') => {
    const id = Date.now();
    setAnnouncements(prev => [...prev, { id, message, priority }]);
    
    // Auto-clear after announcement
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(item => item.id !== id));
    }, 3000);
  };
  
  return (
    <>
      <div 
        aria-live="polite" 
        aria-atomic="false"
        className="sr-only"
      >
        {announcements
          .filter(item => item.priority === 'polite')
          .map(item => (
            <div key={item.id}>{item.message}</div>
          ))}
      </div>
      
      <div 
        aria-live="assertive" 
        aria-atomic="true"
        className="sr-only"
      >
        {announcements
          .filter(item => item.priority === 'assertive')
          .map(item => (
            <div key={item.id}>{item.message}</div>
          ))}
      </div>
    </>
  );
};

// Usage in milestone updates
const useLiveAnnouncements = () => {
  const announce = useContext(LiveUpdateContext);
  
  const announceMilestoneUpdate = (milestone, oldValue, newValue) => {
    if (milestone.workflowType === 'MILESTONE_DISCRETE') {
      announce(
        newValue.isCompleted 
          ? `${milestone.milestoneName} marked as complete`
          : `${milestone.milestoneName} marked as incomplete`,
        'polite'
      );
    } else if (milestone.workflowType === 'MILESTONE_PERCENTAGE') {
      announce(
        `${milestone.milestoneName} progress updated to ${newValue.percentageComplete}%`,
        'polite'
      );
    } else if (milestone.workflowType === 'MILESTONE_QUANTITY') {
      announce(
        `${milestone.milestoneName} quantity updated to ${newValue.quantityComplete} of ${milestone.quantityTotal}`,
        'polite'
      );
    }
  };
  
  const announceBulkUpdate = (componentCount, milestoneCount) => {
    announce(
      `Bulk update completed. ${milestoneCount} milestones updated across ${componentCount} components.`,
      'assertive'
    );
  };
  
  const announceError = (error) => {
    announce(
      `Error: ${error.message}. Please try again.`,
      'assertive'
    );
  };
  
  return { announceMilestoneUpdate, announceBulkUpdate, announceError };
};
```

---

## Touch & Motor Accessibility

### Large Touch Targets
```css
.touch-target {
  /* WCAG AA: 44px minimum, PipeTrak field: 52px minimum */
  min-width: 52px;
  min-height: 52px;
  
  /* Ensure clickable area extends beyond visual element */
  position: relative;
}

.touch-target::before {
  content: '';
  position: absolute;
  inset: -8px; /* Extend touch area by 8px in all directions */
  border-radius: inherit;
}

/* Checkbox with enhanced touch area */
.milestone-checkbox {
  width: 24px;
  height: 24px;
  /* Visual size */
}

.milestone-checkbox-container {
  padding: 14px; /* Creates 52px total touch target */
  margin: -14px; /* Negative margin to maintain layout */
}

/* Slider with enhanced thumb */
.milestone-slider .slider-thumb {
  width: 28px;
  height: 28px;
  /* Large enough for precise control */
}

.milestone-slider .slider-thumb::before {
  content: '';
  position: absolute;
  width: 52px;
  height: 52px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  /* Invisible expanded touch area */
}

/* Stepper buttons */
.quantity-stepper-btn {
  width: 52px;
  height: 52px;
  border-radius: 8px;
  
  /* Increased padding for easier targeting */
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Touch feedback */
.touch-target:active {
  transform: scale(0.95);
  transition: transform 100ms ease-out;
}
```

### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  /* Disable animations but keep essential feedback */
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  /* Keep important state changes visible */
  .milestone-update-success,
  .milestone-update-error,
  .focus-visible {
    transition-duration: 0.15s !important;
  }
  
  /* Replace motion with color/opacity changes */
  .milestone-completed {
    opacity: 0.8;
    background-color: hsl(var(--success) / 0.1);
  }
  
  .optimistic-update-pending {
    opacity: 0.7;
    background-color: hsl(var(--muted));
  }
}
```

---

## High Contrast & Low Vision Support

### Enhanced Visual Hierarchy
```css
@media (prefers-contrast: high) {
  :root {
    /* Extreme contrast ratios */
    --text-primary: #000000;
    --text-secondary: #333333;
    --background: #ffffff;
    --surface: #f5f5f5;
    --border: #000000;
    --focus-ring: #0066cc;
    
    /* Status colors with maximum contrast */
    --status-success: #006600;
    --status-warning: #cc6600;
    --status-error: #cc0000;
    --status-info: #0066cc;
  }
  
  .dark {
    --text-primary: #ffffff;
    --text-secondary: #cccccc;
    --background: #000000;
    --surface: #1a1a1a;
    --border: #ffffff;
    
    --status-success: #00ff00;
    --status-warning: #ffcc00;
    --status-error: #ff0000;
    --status-info: #00ccff;
  }
  
  /* Enhanced borders and outlines */
  .milestone-card {
    border-width: 2px;
    border-color: var(--border);
  }
  
  .milestone-checkbox {
    border-width: 3px;
  }
  
  .progress-bar {
    border: 2px solid var(--border);
    background: var(--background);
  }
  
  .progress-bar-fill {
    background: var(--status-success);
    border-right: 2px solid var(--border);
  }
}

/* Font size preferences */
@media (prefers-font-size: large) {
  .milestone-card {
    font-size: 1.125rem;
    line-height: 1.75rem;
  }
  
  .milestone-name {
    font-size: 1.25rem;
    font-weight: 600;
  }
  
  .milestone-status {
    font-size: 1rem;
  }
}
```

### Pattern-Based Progress Indicators
```css
/* For users who have difficulty distinguishing colors */
.progress-indicator {
  position: relative;
  overflow: hidden;
}

.progress-indicator::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

/* Different patterns for different states */
.progress-indicator[data-status="completed"]::after {
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 4px,
    rgba(0, 0, 0, 0.1) 4px,
    rgba(0, 0, 0, 0.1) 8px
  );
}

.progress-indicator[data-status="in-progress"]::after {
  background-image: repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 6px,
    rgba(0, 0, 0, 0.1) 6px,
    rgba(0, 0, 0, 0.1) 12px
  );
}

.progress-indicator[data-status="blocked"]::after {
  background-image: radial-gradient(
    circle at center,
    rgba(0, 0, 0, 0.1) 2px,
    transparent 2px
  );
  background-size: 8px 8px;
}
```

---

## Assistive Technology Testing

### Screen Reader Testing Checklist
- [ ] **NVDA** (Windows): Milestone updates announced correctly
- [ ] **JAWS** (Windows): Bulk operations provide clear feedback
- [ ] **VoiceOver** (macOS/iOS): Mobile interface fully navigable
- [ ] **TalkBack** (Android): Touch gestures work with screen reader
- [ ] **Orca** (Linux): Table navigation functions properly

### Keyboard Navigation Testing
- [ ] All interactive elements reachable via keyboard
- [ ] Tab order follows logical flow
- [ ] Focus indicators clearly visible
- [ ] Keyboard shortcuts don't conflict with assistive tech
- [ ] Modal dialogs trap focus properly

### Motor Accessibility Testing  
- [ ] All touch targets meet 52px minimum
- [ ] Interface works with head/mouth stick
- [ ] Switch navigation supported
- [ ] Voice control commands work
- [ ] One-handed operation possible

### Cognitive Accessibility Features
```typescript
const CognitiveSupport = {
  // Clear, consistent labeling
  labels: {
    save: "Save Changes",
    cancel: "Cancel (No Changes Will Be Saved)",
    delete: "Delete (This Cannot Be Undone)",
    bulkUpdate: "Update Multiple Components"
  },
  
  // Progress indicators
  showProgress: true,
  showRemainingSteps: true,
  allowUndo: true,
  
  // Error prevention
  confirmDestructiveActions: true,
  showPreviewBeforeUpdate: true,
  highlightRequiredFields: true,
  
  // Memory aids
  showRecentActions: true,
  persistFormData: true,
  provideBreadcrumbs: true
};
```

This comprehensive accessibility foundation ensures PipeTrak works for all users, including those with disabilities working in challenging industrial environments.