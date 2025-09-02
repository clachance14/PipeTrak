# Inline Discrete Milestones Component

## Overview

The `InlineDiscreteMilestones` component provides a compact, single-click milestone update interface designed to replace the expandable dropdown approach for discrete milestone workflows.

## Features

- **Single-click updates**: Toggle milestone completion with one click
- **Visual progress indicators**: Color-coded pills (green=complete, gray=incomplete, yellow=locked)
- **Smart abbreviations**: 3-letter milestone abbreviations with full name tooltips
- **Sequential enforcement**: Milestones lock until prerequisites are completed
- **Optimistic updates**: Immediate UI feedback with error rollback
- **Responsive design**: Works on desktop and mobile
- **Progress tracking**: Shows both count (1/5) and percentage completion

## Usage

### Basic Implementation

```tsx
import { InlineDiscreteMilestones } from './InlineDiscreteMilestones';

<InlineDiscreteMilestones
  component={componentWithMilestones}
  className="min-w-[300px]"
  onMilestoneUpdate={(milestoneId, completed) => {
    console.log(`Milestone ${milestoneId} updated to ${completed}`);
  }}
/>
```

### Feature Flag Integration

The component is integrated with ComponentTable behind a feature flag:

```bash
# Enable inline milestone pills
NEXT_PUBLIC_USE_INLINE_DISCRETE_MILESTONES=true
```

### Workflow Compatibility

- ✅ **MILESTONE_DISCRETE**: Full support with pill interface
- ❌ **MILESTONE_PERCENTAGE**: Shows error message (use DirectEditMilestoneColumn)
- ❌ **MILESTONE_QUANTITY**: Shows error message (use DirectEditMilestoneColumn)

## Component Props

```tsx
interface InlineDiscreteMilestonesProps {
  component: ComponentWithMilestones;
  className?: string;
  onMilestoneUpdate?: (milestoneId: string, completed: boolean) => void;
}
```

## Milestone Templates Supported

| Template | Count | Milestones | Abbreviations |
|----------|-------|------------|---------------|
| **Full Milestone Set** | 7 | Receive → Erect → Connect → Support → Punch → Test → Restore | RCV → ERC → CON → SUP → PCH → TST → RST |
| **Reduced Milestone Set** | 5 | Receive → Install → Punch → Test → Restore | RCV → INS → PCH → TST → RST |
| **Field Weld** | 5 | Fit-up Ready → Weld → Punch → Test → Restore | FIT → WLD → PCH → TST → RST |
| **Insulation** | 2 | Insulate → Metal Out | INS → MTO |
| **Paint** | 2 | Primer → Finish Coat | PRM → FIN |

## Visual States

### Pill States
- **Green**: Milestone completed
- **Gray**: Milestone not completed (available)
- **Yellow**: Milestone locked (prerequisites required)
- **Pulsing**: Update in progress

### Layout
```
[✓ RCV] [✓ INS] [○ PCH] [○ TST] [○ RST] | 2/5 ████░░░░ 40%
```

## Integration with MilestoneUpdateEngine

The component integrates with the existing milestone update system:

- **Optimistic updates**: Immediate UI changes
- **Error handling**: Automatic rollback on API failures
- **Real-time sync**: Updates reflect changes from other users
- **Offline support**: Queues updates when offline

## Accessibility

- **ARIA roles**: `role="switch"` with `aria-checked` states
- **Keyboard navigation**: Tab through pills, Space/Enter to toggle
- **Screen reader support**: Full milestone names announced
- **Tooltips**: Hover/focus shows full milestone information
- **High contrast**: Color-blind friendly states

## Performance

- **Optimized rendering**: React.memo for pill components
- **Cached abbreviations**: O(1) lookup performance
- **Minimal re-renders**: Only affected milestones update
- **Small bundle size**: ~3KB additional JavaScript

## Migration from DirectEditMilestoneColumn

The component provides a drop-in replacement for discrete milestones:

```tsx
// Before (3 clicks: expand → select → confirm)
<DirectEditMilestoneColumn component={component} />

// After (1 click: toggle)
<InlineDiscreteMilestones component={component} />
```

## Testing

Run the test suite:
```bash
npm test InlineDiscreteMilestones
```

The component includes comprehensive tests for:
- Milestone pill rendering
- Click interactions and state updates
- Locked milestone behavior
- Progress calculation
- Error handling
- Non-discrete workflow handling