# Mobile Milestone UI Style Guide

## Overview

This style guide defines the visual language for PipeTrak's mobile milestone interface, optimized for construction field environments. All specifications integrate with the existing Tailwind CSS configuration and shadcn/ui component system.

## Color System

### Primary Status Colors

Based on the established PipeTrak field color tokens:

```css
/* Available/Pending State */
--milestone-available-bg: #ffffff;
--milestone-available-border: #10b981; /* var(--field-complete) */
--milestone-available-text: #1a1a1a;

/* Complete State */
--milestone-complete-bg: #10b981; /* var(--field-complete) */
--milestone-complete-border: #10b981;
--milestone-complete-text: #ffffff;

/* Blocked State */
--milestone-blocked-bg: #6b7280; /* gray-500 */
--milestone-blocked-border: #6b7280;
--milestone-blocked-text: #ffffff;

/* Dependent State */
--milestone-dependent-bg: #10b981; /* var(--field-complete) */
--milestone-dependent-border: #eab308; /* yellow-500 */
--milestone-dependent-text: #ffffff;

/* Error State */
--milestone-error-bg: #ffffff;
--milestone-error-border: #ef4444; /* var(--destructive) */
--milestone-error-text: #1a1a1a;

/* Loading State */
--milestone-loading-bg: #f3f4f6; /* gray-100 */
--milestone-loading-border: #d1d5db; /* gray-300 */
--milestone-loading-text: #6b7280; /* gray-500 */
```

### Field Environment Considerations

All colors tested for:
- **Sunlight Visibility**: 4.5:1 minimum contrast ratio in direct sunlight
- **Polarized Glasses**: No color shifts or invisibility
- **Wet Screen Conditions**: Maintains visibility with water droplets
- **Dirty Screen Conditions**: High contrast prevents loss of information

## Typography

### Scale and Hierarchy

Using the existing Geist Sans font family with mobile-optimized sizing:

```css
/* Component ID - Header Primary */
.component-id {
  font-family: var(--font-geist-sans);
  font-size: 1.125rem; /* 18px */
  font-weight: 500; /* medium */
  line-height: 1.25; /* tight */
  letter-spacing: -0.025em;
}

/* Completion Percentage - Header Secondary */
.completion-percentage {
  font-family: var(--font-geist-sans);
  font-size: 1.125rem; /* 18px */
  font-weight: 600; /* semibold */
  line-height: 1.25; /* tight */
  letter-spacing: 0;
}

/* Meta Badge Text */
.meta-badge {
  font-family: var(--font-geist-sans);
  font-size: 0.75rem; /* 12px */
  font-weight: 500; /* medium */
  line-height: 1; /* none */
  letter-spacing: 0.025em; /* wide */
  text-transform: uppercase;
}

/* Milestone Button Abbreviation */
.milestone-abbr {
  font-family: var(--font-geist-sans);
  font-size: 0.75rem; /* 12px */
  font-weight: 600; /* semibold */
  line-height: 1; /* none */
  letter-spacing: 0.05em; /* wider */
  text-transform: uppercase;
}

/* Milestone Button Sub-text */
.milestone-subtext {
  font-family: var(--font-geist-sans);
  font-size: 0.625rem; /* 10px */
  font-weight: 400; /* normal */
  line-height: 1; /* none */
  letter-spacing: 0.025em; /* wide */
}
```

### Responsive Typography Rules

```css
/* Base (360px+) */
:root {
  --component-id-size: 1.125rem; /* 18px */
  --percentage-size: 1.125rem; /* 18px */
  --badge-size: 0.75rem; /* 12px */
  --milestone-abbr-size: 0.75rem; /* 12px */
}

/* Small Mobile (375px+) */
@media (min-width: 375px) {
  :root {
    --component-id-size: 1.25rem; /* 20px */
    --percentage-size: 1.25rem; /* 20px */
  }
}

/* Large Mobile (414px+) */
@media (min-width: 414px) {
  :root {
    --component-id-size: 1.375rem; /* 22px */
    --percentage-size: 1.375rem; /* 22px */
    --badge-size: 0.875rem; /* 14px */
    --milestone-abbr-size: 0.875rem; /* 14px */
  }
}

/* Tablet (768px+) */
@media (min-width: 768px) {
  :root {
    --component-id-size: 1.5rem; /* 24px */
    --percentage-size: 1.5rem; /* 24px */
    --badge-size: 1rem; /* 16px */
    --milestone-abbr-size: 1rem; /* 16px */
  }
}
```

## Spacing System

### Layout Grid (8px base unit)

```css
/* Component Card Internal Spacing */
--card-padding-x: 16px; /* 2 * 8px base unit */
--card-section-gap: 0px; /* No gaps between sections */

/* Header Section */
--header-padding-y: 8px; /* 1 * 8px base unit */
--header-padding-x: 16px; /* 2 * 8px base unit */

/* Meta Section */
--meta-padding-y: 4px; /* 0.5 * 8px base unit */
--meta-padding-x: 16px; /* 2 * 8px base unit */
--meta-badge-gap: 8px; /* 1 * 8px base unit */

/* Milestone Section */
--milestone-padding: 0px; /* No internal padding */
--milestone-border-width: 1px;
```

### Touch Target Specifications

Following WCAG guidelines with construction-specific optimizations:

```css
/* Minimum Touch Targets (iOS/Android Standard) */
--touch-target-min: 44px;

/* Recommended Touch Targets (Industrial Glove Optimized) */
--touch-target-recommended: 56px;

/* Spacing Between Touch Targets */
--touch-target-spacing: 8px;

/* Milestone Button Implementation */
.milestone-button {
  min-height: var(--touch-target-recommended); /* 56px */
  min-width: var(--touch-target-min); /* 44px at minimum */
  padding: 8px 4px; /* Internal padding for content */
}
```

### Responsive Spacing

```css
/* Base Mobile (360px+) */
:root {
  --milestone-section-height: 56px;
  --milestone-button-min-width: 51px; /* 360px / 7 buttons */
}

/* Small Mobile (375px+) */
@media (min-width: 375px) {
  :root {
    --milestone-button-min-width: 54px; /* 375px / 7 buttons */
  }
}

/* Large Mobile (414px+) */
@media (min-width: 414px) {
  :root {
    --milestone-button-min-width: 59px; /* 414px / 7 buttons */
  }
}

/* Tablet (768px+) */
@media (min-width: 768px) {
  :root {
    --milestone-section-height: 64px; /* Larger touch targets */
    --milestone-button-min-width: 110px; /* 768px / 7 buttons */
  }
}
```

## Component Variants

### Badge Variants

Using shadcn/ui Badge component with field-specific modifications:

```tsx
// Type Badge (Component category)
<Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200">
  6" Steel Pipe
</Badge>

// Area Badge (Installation zone)
<Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
  Zone A
</Badge>

// Test Package Badge (Testing group)
<Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">
  TP-001
</Badge>

// Priority Badge (High/Critical only)
<Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">
  High Priority
</Badge>
```

## Interaction States

### Button State Specifications

```css
/* Base State */
.milestone-button {
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  transform: scale(1);
  cursor: pointer;
}

/* Hover State (Desktop/Tablet) */
@media (hover: hover) {
  .milestone-button:hover {
    transform: scale(1.02);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
}

/* Active/Pressed State */
.milestone-button:active {
  transform: scale(0.98);
  transition-duration: 75ms;
}

/* Focus State (Keyboard Navigation) */
.milestone-button:focus {
  outline: 2px solid var(--ring); /* #4e6df5 */
  outline-offset: 2px;
}

/* Disabled State */
.milestone-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: scale(1);
}

/* Loading State */
.milestone-button.loading {
  cursor: not-allowed;
  opacity: 0.8;
}
```

### Animation Specifications

```css
/* Success Animation (Milestone Completion) */
@keyframes milestone-success {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); background-color: var(--success); }
  100% { transform: scale(1); }
}

.milestone-success-animation {
  animation: milestone-success 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Error Animation (Failed Update) */
@keyframes milestone-error-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

.milestone-error-animation {
  animation: milestone-error-shake 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Loading Animation (Optimistic Update) */
@keyframes milestone-loading-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.milestone-loading-animation {
  animation: milestone-loading-pulse 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
```

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  .milestone-button,
  .milestone-success-animation,
  .milestone-error-animation,
  .milestone-loading-animation {
    animation: none;
    transition: none;
  }
  
  .milestone-button:hover {
    transform: none;
    box-shadow: 0 0 0 2px var(--ring);
  }
  
  .milestone-button:active {
    transform: none;
    background-color: var(--primary);
  }
}
```

## Icon Specifications

### Milestone Status Icons

Using Lucide React icons with construction-appropriate sizing:

```tsx
// Available/Pending
<Circle className="w-3 h-3 text-fieldPending" />

// Complete
<CheckCircle className="w-3 h-3 text-fieldComplete" />

// Blocked
<Lock className="w-3 h-3 text-fieldBlocked" />

// Dependent
<Clock className="w-3 h-3 text-fieldWarning" />

// Error
<AlertCircle className="w-3 h-3 text-destructive" />

// Loading
<Loader2 className="w-3 h-3 text-primary animate-spin" />
```

### Icon Positioning

```css
.milestone-icon {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 12px;
  height: 12px;
  z-index: 10;
}

/* Ensure icon visibility on all backgrounds */
.milestone-icon {
  filter: drop-shadow(0 1px 2px rgba(255, 255, 255, 0.8));
}
```

## Dark Mode Considerations

While PipeTrak focuses on field use (primarily daylight), dark mode support maintains consistency:

```css
.dark .milestone-button {
  /* Available State */
  --milestone-available-bg: #1f2937; /* gray-800 */
  --milestone-available-border: #059669; /* green-600 */
  --milestone-available-text: #ffffff;
  
  /* Complete State */
  --milestone-complete-bg: #059669; /* green-600 */
  --milestone-complete-border: #059669;
  --milestone-complete-text: #ffffff;
  
  /* Blocked State */
  --milestone-blocked-bg: #4b5563; /* gray-600 */
  --milestone-blocked-border: #4b5563;
  --milestone-blocked-text: #ffffff;
}
```

## Field Testing Requirements

### Contrast Validation
- **WCAG AAA**: 7:1 minimum for critical status indicators
- **Direct Sunlight**: Manual testing required with actual devices
- **Polarized Glasses**: Testing with construction-grade safety glasses

### Physical Testing
- **Work Gloves**: Various thickness levels (thin latex to thick winter)
- **Wet Conditions**: Water resistance and touch sensitivity
- **Dirty Screens**: Visibility with dust, mud, and moisture

### Performance Validation
- **Frame Rate**: 60fps scrolling with 200+ components
- **Touch Response**: <50ms visual feedback from tap to state change
- **Animation Performance**: GPU acceleration on all targeted devices

---

*Next: [Milestone Button Design Specifications](../features/milestone-buttons/README.md)*