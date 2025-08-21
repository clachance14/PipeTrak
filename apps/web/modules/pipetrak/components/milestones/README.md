# PipeTrak Milestone Update System

A comprehensive, mobile-first milestone tracking system for industrial construction projects. Built with React, TypeScript, and optimized for field operations with poor network connectivity.

## Features

- **Three Workflow Types**: Discrete (checkbox), Percentage (0-100%), Quantity-based tracking
- **Optimistic Updates**: Instant UI feedback with automatic error recovery
- **Offline-First**: Works without internet, syncs when connected
- **Real-time Collaboration**: Live updates across all connected clients
- **Mobile-Optimized**: 52px+ touch targets for industrial gloves
- **Accessibility**: Full WCAG AA compliance with keyboard navigation
- **Bulk Operations**: Update multiple milestones with preview and rollback

## Quick Start

### Basic Usage

```tsx
import { 
  MilestoneUpdateEngine,
  RealtimeManager,
  MilestoneWorkflowRenderer 
} from './milestones';

function ComponentMilestones({ projectId, userId, component }) {
  return (
    <RealtimeManager projectId={projectId} userId={userId}>
      <MilestoneUpdateEngine projectId={projectId}>
        {component.milestones?.map(milestone => (
          <MilestoneWorkflowRenderer
            key={milestone.id}
            milestone={milestone}
            workflowType={component.workflowType}
            onUpdate={(value) => handleUpdate(milestone.id, value)}
          />
        ))}
      </MilestoneUpdateEngine>
    </RealtimeManager>
  );
}
```

### Table Integration

```tsx
import { ComponentTable } from '../ComponentTable';

function ProjectComponents({ projectId, userId, components }) {
  return (
    <ComponentTable
      components={components}
      projectId={projectId}
      userId={userId}
      onMilestoneClick={(component, milestoneId) => 
        // Handle milestone interaction
      }
    />
  );
}
```

### Mobile Interface

```tsx
import { MobileMilestoneSheet } from './milestones';

function MobileView({ component, isOpen, onClose }) {
  return (
    <MobileMilestoneSheet
      isOpen={isOpen}
      onClose={onClose}
      component={component}
      selectedMilestoneId="milestone-123"
    />
  );
}
```

## Core Components

### Milestone Renderers

#### MilestoneDiscreteRenderer
Checkbox-based milestone tracking for binary completion states.

```tsx
<MilestoneDiscreteRenderer
  milestone={milestone}
  isLocked={false}
  touchTargetSize={52}
  onUpdate={(completed) => updateMilestone(milestone.id, completed)}
/>
```

#### MilestonePercentageRenderer
Slider and input controls for percentage-based completion.

```tsx
<MilestonePercentageRenderer
  milestone={milestone}
  isLocked={false}
  touchTargetSize={52}
  onUpdate={(percentage) => updateMilestone(milestone.id, percentage)}
/>
```

#### MilestoneQuantityRenderer
Numeric input with unit support for quantity-based tracking.

```tsx
<MilestoneQuantityRenderer
  milestone={milestone}
  isLocked={false}
  touchTargetSize={52}
  onUpdate={(quantity) => updateMilestone(milestone.id, quantity)}
/>
```

### State Management

#### MilestoneUpdateEngine
Central state management with optimistic updates and error recovery.

```tsx
import { useMilestoneUpdateEngine } from './milestones';

function MyComponent() {
  const {
    updateMilestone,
    bulkUpdateMilestones,
    hasPendingUpdates,
    getOperationStatus,
    isOnline,
    syncOfflineQueue
  } = useMilestoneUpdateEngine();

  // Update single milestone
  const handleUpdate = async (milestoneId, value) => {
    await updateMilestone(
      milestoneId,
      componentId,
      milestoneName,
      workflowType,
      value
    );
  };

  // Bulk update multiple milestones
  const handleBulkUpdate = async (updates) => {
    await bulkUpdateMilestones(updates);
  };
}
```

### Bulk Operations

#### EnhancedBulkUpdateModal
Multi-step modal with preview and progress tracking.

```tsx
<EnhancedBulkUpdateModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  selectedComponents={selectedComponents}
  onBulkUpdate={async (updates) => {
    // Process bulk update
    return {
      successful: 10,
      failed: 0,
      transactionId: "bulk_123",
      results: []
    };
  }}
  onPreview={async (updates) => {
    // Generate preview
    return {
      totalUpdates: 10,
      validUpdates: 10,
      invalidUpdates: 0,
      preview: [],
      invalid: []
    };
  }}
/>
```

## Mobile Features

### Touch Optimization
All interactive elements meet WCAG touch target requirements:
- **Minimum**: 44px (iOS/Android standard)
- **Recommended**: 52px (optimized for industrial gloves)
- **Spacing**: 8px minimum between targets

### Swipe Gestures
Quick actions through intuitive swipe patterns:
- **Swipe Right**: Mark complete/incomplete
- **Swipe Left**: Open detail view
- **Long Press**: Show context menu

### Offline Support
Robust offline functionality:
- Queue operations when offline
- Auto-sync when connection restored
- Conflict resolution for concurrent edits
- Visual offline indicators

## Accessibility

### Keyboard Navigation
Full keyboard support for all interactions:
- **Tab/Shift+Tab**: Navigate between milestones
- **Enter/Space**: Toggle discrete milestones
- **Arrow Keys**: Navigate within percentage/quantity controls
- **Home/End**: Jump to first/last milestone

### Screen Reader Support
Comprehensive screen reader announcements:
- Milestone state changes
- Bulk operation progress
- Error messages and recovery
- Focus changes and context

### ARIA Implementation
```tsx
<div
  role="checkbox"
  aria-checked={isCompleted}
  aria-disabled={isLocked}
  aria-busy={isUpdating}
  aria-label="Install gasket: Completed"
  aria-describedby="milestone-sequence-info"
>
```

## Real-time Features

### Live Updates
Instant synchronization across all connected clients:
- Milestone state changes
- Bulk operation results
- User presence indicators
- Conflict notifications

### Presence Tracking
```tsx
import { usePresenceTracking } from './milestones';

function ComponentEditor({ componentId }) {
  const { startEditing, stopEditing } = usePresenceTracking(componentId);

  useEffect(() => {
    startEditing();
    return () => stopEditing();
  }, [startEditing, stopEditing]);
}
```

### Conflict Resolution
Automatic conflict detection with user-guided resolution:
- Last-writer-wins with notification
- Custom resolution UI for complex conflicts
- Audit trail for all changes

## API Integration

### Required Backend Endpoints

```typescript
// Single milestone update
PATCH /api/pipetrak/milestones/:id
{
  isCompleted?: boolean;
  percentageValue?: number;
  quantityValue?: number;
}

// Bulk update with batching
POST /api/pipetrak/milestones/bulk-update
{
  updates: Array<{
    componentId: string;
    milestoneName: string;
    isCompleted?: boolean;
    percentageValue?: number;
    quantityValue?: number;
  }>;
  options: {
    validateOnly?: boolean;
    atomic?: boolean;
    batchSize?: number;
  };
}

// Preview bulk changes
POST /api/pipetrak/milestones/preview-bulk
{
  updates: Array<MilestoneUpdate>;
}

// Offline sync
POST /api/pipetrak/milestones/sync
{
  operations: Array<OfflineOperation>;
  lastSyncTimestamp?: string;
}

// Undo bulk operation
POST /api/pipetrak/milestones/undo/:transactionId
```

### Error Handling

The system handles various error scenarios:

```typescript
interface MilestoneError {
  type: 'NETWORK_ERROR' | 'VALIDATION_ERROR' | 'PERMISSION_ERROR' | 'CONFLICT_ERROR';
  message: string;
  componentId?: string;
  milestoneId?: string;
  recovery?: ErrorRecoveryAction;
}
```

## Performance Considerations

### Optimization Strategies
- **Virtual Scrolling**: For large milestone lists
- **Debounced Updates**: Batch rapid changes
- **Optimistic UI**: Immediate feedback
- **Lazy Loading**: Load milestones on demand
- **Caching**: Aggressive caching with invalidation

### Bundle Size
- **Core**: ~45KB gzipped
- **Mobile**: +12KB for touch features
- **Accessibility**: +8KB for a11y features
- **Real-time**: +15KB for Supabase integration

## Testing

### Unit Tests
```bash
npm test milestone-discrete-renderer
npm test milestone-percentage-renderer
npm test milestone-quantity-renderer
npm test optimistic-update-manager
```

### Integration Tests
```bash
npm test milestone-system-integration
npm test bulk-update-flow
npm test offline-sync
```

### Accessibility Tests
```bash
npm test accessibility
npm run test:a11y
```

## Deployment Checklist

### Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### Feature Flags
```typescript
const config = {
  milestones: {
    enableBulkUpdates: true,
    enableOfflineMode: true,
    enableRealtimeSync: true,
    maxBulkUpdateSize: 500,
    optimisticUpdateTimeout: 5000
  }
};
```

### Monitoring
Key metrics to track:
- Update latency (P95 < 300ms)
- Bulk update success rate (> 99%)
- Offline sync completion (> 99%)
- Mobile usability (touch success rate > 95%)

## Migration Guide

### From Legacy System
1. **Data Migration**: Map existing milestone data to new schema
2. **User Training**: Provide training for new interface patterns
3. **Gradual Rollout**: Enable features progressively
4. **Fallback Plan**: Keep legacy system available during transition

### Breaking Changes
- v2.0: Changed milestone API from REST to GraphQL
- v2.1: Updated touch target sizes from 44px to 52px
- v2.2: Moved from Redux to TanStack Query

## Contributing

### Development Setup
```bash
git clone <repository>
cd pipetrak
npm install
npm run dev
```

### Coding Standards
- TypeScript strict mode
- ESLint + Prettier
- 100% test coverage for core logic
- Accessibility testing required
- Mobile testing on real devices

### Pull Request Process
1. Create feature branch
2. Add tests for new functionality
3. Run accessibility audit
4. Test on mobile devices
5. Update documentation
6. Request code review

## Support

### Common Issues
- **Offline sync fails**: Check network connectivity and retry
- **Touch targets too small**: Adjust `touchTargetSize` prop
- **Screen reader issues**: Verify ARIA labels and live regions
- **Performance problems**: Enable virtual scrolling for large datasets

### Debug Mode
```typescript
window.enableMilestoneDebug = true;
// Enables detailed logging and debug overlays
```

## License

MIT License - See LICENSE file for details.