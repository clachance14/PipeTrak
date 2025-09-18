# Component Card Specifications

## Overview

The Component Card is the primary interface element for mobile milestone tracking. Each card represents a single construction component with its milestone progress, designed for one-handed operation with work gloves in harsh field conditions.

## Layout Specifications

### Card Dimensions (360px Screen)

```
Total Card Height: 112px
├── Header Section:    32px (28.6% of total)
├── Meta Section:      24px (21.4% of total)
└── Milestone Section: 56px (50.0% of total)

Card Width: 100vw (edge-to-edge, no margins)
```

### Responsive Breakpoints

| Screen Width | Card Width | Milestone Button Width |
|--------------|------------|------------------------|
| 360px (base) | 360px      | ~51px (360÷7)         |
| 375px        | 375px      | ~54px (375÷7)         |
| 414px        | 414px      | ~59px (414÷7)         |
| 768px+       | 100%       | ~110px (768÷7)        |

## Section Specifications

### Header Section (32px height)

**Purpose**: Component identification and overall progress
**Layout**: Horizontal flex with space-between alignment

```css
.component-header {
  height: 32px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
```

#### Left Side - Component ID
- **Typography**: font-medium text-lg (18px) leading-tight
- **Color**: text-foreground
- **Max Width**: 60% of available space
- **Truncation**: text-ellipsis with tooltip on overflow

#### Right Side - Completion Percentage
- **Typography**: font-semibold text-lg (18px)
- **Color**: Dynamic based on completion
  - 0%: text-fieldPending (#4a4a4a)
  - 1-99%: text-primary (#4e6df5)
  - 100%: text-fieldComplete (#10b981)

### Meta Section (24px height)

**Purpose**: Component metadata badges
**Layout**: Horizontal flex with 8px gaps

```css
.component-meta {
  height: 24px;
  padding: 0 16px 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  overflow-x: auto;
}
```

#### Badge Specifications
Each badge uses shadcn/ui Badge component:

```tsx
<Badge variant="secondary" className="text-xs px-2 py-1 whitespace-nowrap">
  {content}
</Badge>
```

- **Type Badge**: Component type (e.g., "6\" Steel Pipe")
- **Area Badge**: Installation area (e.g., "Zone A")  
- **Test Package Badge**: Testing group (e.g., "TP-001")
- **Priority Badge**: Only shown for high/critical priority

#### Badge Priority Order
1. Type (always shown)
2. Area (always shown) 
3. Test Package (if applicable)
4. Priority (if high/critical)

### Milestone Section (56px height)

**Purpose**: Interactive milestone buttons
**Layout**: 7-column equal-width grid

```css
.milestone-section {
  height: 56px;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0;
  border-top: 1px solid var(--border);
}
```

## Component States

### Default State
```css
.component-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: 0; /* Edge-to-edge design */
  box-shadow: none;
  margin-bottom: 1px; /* Subtle separation */
}
```

### Loading State
- **Shimmer Effect**: Applied to header and milestone sections
- **Duration**: 1.5s infinite loop
- **Implementation**: Using shadcn/ui Skeleton component

### Error State
- **Border**: 2px solid var(--destructive)
- **Background**: Subtle red tint (red-50/10)
- **Retry Indicator**: Small retry icon in header right

### Offline State
- **Header Overlay**: Semi-transparent offline indicator
- **Milestone Buttons**: Disabled with opacity 0.6
- **Sync Indicator**: Spinning sync icon when attempting to connect

## Accessibility Specifications

### ARIA Implementation
```tsx
<div
  role="article"
  aria-label={`Component ${componentId} - ${completionPercent}% complete`}
  aria-describedby={`meta-${componentId} milestones-${componentId}`}
  tabIndex={0}
>
  <div id={`meta-${componentId}`} aria-label={`Type: ${type}, Area: ${area}`}>
    {/* Meta badges */}
  </div>
  <div id={`milestones-${componentId}`} role="group" aria-label="Milestones">
    {/* Milestone buttons */}
  </div>
</div>
```

### Keyboard Navigation
- **Tab**: Focus entire component card
- **Arrow Keys**: Navigate between milestone buttons within focused card
- **Enter/Space**: Activate focused milestone button
- **Escape**: Exit milestone focus, return to card level

### Screen Reader Support
- **Card Summary**: Announced when focused
- **Progress Updates**: Live region announcements for changes
- **Error Recovery**: Clear error messages and retry instructions

## Performance Specifications

### Rendering Optimization
- **Virtual Scrolling**: Required for 200+ components
- **Lazy Loading**: Milestone buttons rendered only when visible
- **Memoization**: Component-level React.memo for unchanged props

### Animation Performance
- **Transform Only**: Use transform properties for animations
- **GPU Acceleration**: will-change: transform on animated elements
- **Reduced Motion**: Respect prefers-reduced-motion media query

### Memory Management
- **Component Pool**: Reuse card instances during scrolling
- **Image Lazy Loading**: Defer non-critical image loading
- **Event Cleanup**: Proper cleanup of touch event listeners

## Field Usage Validation

### Glove Compatibility Test
- **Thick Winter Gloves**: All interactive elements must be activatable
- **Wet Gloves**: Touch registration must work with moisture
- **Dirty Screens**: High contrast maintains visibility

### Sunlight Readability Test
- **Direct Sunlight**: All text must remain legible
- **Polarized Sunglasses**: No color shifting or invisibility
- **Screen Brightness**: Optimized for maximum brightness settings

### One-Handed Operation Test
- **Thumb Reach**: All primary actions within thumb zone
- **Hand Position**: Works in both left and right hand orientations
- **Device Orientation**: Portrait orientation only (construction standard)

## Implementation Checklist

### Required Components
- [ ] shadcn/ui Card component
- [ ] shadcn/ui Badge component  
- [ ] shadcn/ui Skeleton component
- [ ] Custom MilestoneButton component
- [ ] Progress percentage calculator

### Required Styles
- [ ] Tailwind responsive grid system
- [ ] PipeTrak field color tokens
- [ ] Touch target minimum sizes
- [ ] High contrast mode support

### Required Functionality
- [ ] Optimistic updates with rollback
- [ ] Offline state management
- [ ] Loading state handling
- [ ] Error recovery flows
- [ ] Accessibility compliance

### Testing Requirements
- [ ] Physical device testing with gloves
- [ ] Outdoor visibility testing
- [ ] Screen reader compatibility
- [ ] Keyboard navigation
- [ ] Performance benchmarking (60fps scroll)

---

*Next: [Milestone Button Design Specifications](../milestone-buttons/README.md)*