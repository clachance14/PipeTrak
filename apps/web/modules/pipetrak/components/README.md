# PipeTrak Components Module

## Overview

The Components module provides Excel-like table interface for managing industrial construction components with advanced bulk update capabilities. Built for foremen and project managers to efficiently track component installation progress across large projects.

## Key Features

### 🔄 Bulk Update System
Advanced bulk operations for updating component milestones with intelligent grouping and error handling.

### 🎯 Advanced Filtering
Persistent, user-friendly filtering system with localStorage support for session continuity.

### 📱 Responsive Design
Mobile-first interface with touch optimization for field use.

### 🚨 Robust Error Handling
Comprehensive error recovery with partial success handling and retry mechanisms.

---

## Architecture

### Component Structure

```
apps/web/modules/pipetrak/components/
├── components/
│   ├── ComponentTable.tsx           # Main table interface
│   ├── FilterBar.tsx               # Advanced filtering component
│   ├── BulkMilestoneModal.tsx      # Bulk update modal interface
│   ├── FailureDetailsModal.tsx     # Error handling and retry modal
│   └── DrawingGroup.tsx            # Drawing-based component grouping
├── lib/
│   ├── bulk-update-service.ts      # API service layer
│   ├── bulk-update-utils.ts        # Helper functions and types
│   └── actions.ts                  # Server actions
└── types.ts                        # TypeScript definitions
```

---

## Core Components

### FilterBar.tsx

**Purpose**: Provides persistent filtering with localStorage support

**Features**:
- Priority filters: Area, Test Package, System, Type, Status
- Search functionality with debounced input
- Automatic filter state persistence
- Clear all filters capability

**Usage**:
```tsx
<FilterBar
  filters={filters}
  onFiltersChange={setFilters}
  availableOptions={{
    areas: ['Area1', 'Area2'],
    testPackages: ['TP1', 'TP2'],
    systems: ['System1', 'System2'],
    types: ['Spool', 'Gasket'],
    statuses: ['Not Started', 'In Progress', 'Complete']
  }}
/>
```

### BulkMilestoneModal.tsx

**Purpose**: Main interface for bulk component updates with intelligent grouping

**Features**:
- **Quick Mode**: Apply same milestone to all component types
- **Advanced Mode**: Different milestones per component type
- **Component Grouping**: Automatically groups by milestone template
- **Progress Tracking**: Real-time update progress
- **Validation**: Pre-update validation with warnings

**Update Modes**:
- **Quick**: Best when all components share common milestones
- **Advanced**: Required when component types have different milestone templates (e.g., spool vs gasket)

**Usage**:
```tsx
<BulkMilestoneModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  selectedComponents={selectedComponents}
  onBulkUpdate={async (updates) => {
    const service = createBulkUpdateService();
    return await service.performBulkUpdate(updates);
  }}
/>
```

### FailureDetailsModal.tsx

**Purpose**: Comprehensive error handling and retry interface

**Features**:
- **Grouped Error Display**: Errors grouped by type for easier analysis
- **Selective Retry**: Choose which failures to retry
- **CSV Export**: Export failure details for external analysis
- **Copy to Clipboard**: Quick sharing of error information

**Error Types Handled**:
- Milestone not found for component type
- Access denied (permission issues)
- Network/connectivity errors
- Database constraint violations

---

## Service Layer

### bulk-update-service.ts

**Purpose**: API service layer with progress tracking and batch processing

**Key Classes**:

#### BulkUpdateService
```typescript
const service = new BulkUpdateService((progress) => {
  console.log(`${progress.percentage}% complete`);
});

// Quick update
const result = await service.quickUpdate('Received', components);

// Advanced update  
const result = await service.advancedUpdate(groups, selections);

// Batched processing (for large datasets)
const result = await service.batchedUpdate(request, 50);
```

#### Helper Functions
```typescript
// Quick one-off updates
const result = await quickBulkUpdate('Received', components);

// Advanced updates with progress tracking
const result = await advancedBulkUpdate(groups, selections, onProgress);
```

---

## Type System

### Core Types

```typescript
// Component grouping
export interface ComponentGroup {
  type: string;
  templateId: string;
  templateName: string;
  components: ComponentWithMilestones[];
  availableMilestones: string[];
  commonWithOthers: string[];
}

// Bulk update selections
export interface BulkUpdateSelections {
  [templateId: string]: Set<string>; // milestone names
}

// Results
export type BulkUpdateFailure = {
  componentId: string;
  milestoneName?: string;
  error: string;
};

export type BulkUpdateSuccess = {
  componentId: string;
  milestoneName: string;
  milestone?: any;
};

export interface BulkUpdateResult {
  successful: BulkUpdateSuccess[];
  failed: BulkUpdateFailure[];
  total: number;
}
```

### Filter System
```typescript
export interface FilterState {
  area: string;
  testPackage: string;
  system: string;
  type: string;
  status: string;
  search: string;
}
```

---

## API Integration

### Endpoints

#### POST `/api/pipetrak/milestones/bulk-update-discrete`

**Purpose**: Execute bulk milestone updates with discrete completion states

**Request Format**:
```typescript
// Quick Mode
{
  mode: "quick",
  milestoneName: "Received",
  componentIds: ["comp1", "comp2", "comp3"]
}

// Advanced Mode
{
  mode: "advanced",
  groups: [{
    templateId: "template1",
    componentIds: ["comp1", "comp2"],
    milestones: ["Received", "Installed"]
  }]
}
```

**Response Format**:
```typescript
{
  successful: [
    { componentId: "comp1", milestoneName: "Received", milestone: {...} }
  ],
  failed: [
    { componentId: "comp2", milestoneName: "Received", error: "Milestone not found" }
  ],
  total: 2
}
```

---

## Common Use Cases

### Use Case 1: "All supports have been received"

```typescript
// 1. Filter components
const filters = { type: 'Support', status: 'Not Started', area: 'all', testPackage: 'all', system: 'all', search: '' };

// 2. Select all filtered
const filteredComponents = applyComponentFilters(components, filters);

// 3. Quick bulk update
const service = createBulkUpdateService();
const result = await service.quickUpdate('Received', filteredComponents);
```

### Use Case 2: "Test package TP-01 has been tested"

```typescript
// 1. Filter by test package
const filters = { testPackage: 'TP-01', area: 'all', type: 'all', system: 'all', status: 'all', search: '' };

// 2. Group by component type (handles spool vs gasket differences)
const groups = groupComponentsByTemplate(filteredComponents);

// 3. Advanced update with different milestones per type
const selections = {
  'spool-template': new Set(['Pressure Test', 'Final Inspection']),
  'gasket-template': new Set(['Installed', 'Tested'])
};

const result = await service.advancedUpdate(groups, selections);
```

### Use Case 3: Error Recovery

```typescript
// Handle partial failures
if (result.failed.length > 0) {
  // Show failure modal
  setFailures(result.failed);
  setShowFailureModal(true);
}

// Retry failed items
const retryResult = await service.performBulkUpdate({
  mode: 'quick',
  milestoneName: 'Received',
  componentIds: result.failed.map(f => f.componentId)
});
```

---

## Performance Considerations

### Large Dataset Handling
- **Batch Processing**: Automatic batching for >50 components
- **Virtual Scrolling**: Table virtualization for large component lists  
- **Debounced Filtering**: Search input debounced to prevent excessive filtering
- **localStorage Optimization**: Efficient filter state serialization

### Memory Management
- **Selective Loading**: Only load visible components
- **Cleanup**: Proper cleanup of event listeners and subscriptions
- **Memoization**: React.memo and useMemo for expensive calculations

---

## Testing

### Test Files
- `__tests__/actions.test.ts` - Server actions testing
- `__mocks__/msw-handlers.ts` - Mock service worker handlers
- `__fixtures__/` - Test data fixtures

### Coverage Areas
- ✅ Filter persistence and state management
- ✅ Bulk update service with mock API responses
- ✅ Error handling and retry mechanisms
- ✅ Component grouping and validation logic
- 🔄 E2E bulk update workflows (in progress)

---

## Troubleshooting

### Common Issues

**FilterBar not persisting state**:
```typescript
// Ensure localStorage is available
if (typeof window !== 'undefined') {
  localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
}
```

**BulkUpdateModal showing "No common milestones"**:
```typescript
// Use Advanced mode when component types have different milestone templates
const groups = groupComponentsByTemplate(components);
console.log('Groups:', groups.map(g => ({ type: g.type, milestones: g.availableMilestones })));
```

**FailureDetailsModal export not working**:
```typescript
// Check browser support for Blob and URL.createObjectURL
if (typeof window !== 'undefined' && window.Blob) {
  // CSV export functionality available
}
```

**TypeScript parsing errors with array index types**:
```typescript
// Use explicit types instead of array index syntax
// ❌ BulkUpdateResult["failed"][0]  
// ✅ BulkUpdateFailure
```

---

## Development Guidelines

### Adding New Filters
1. Update `FilterState` interface in `types.ts`
2. Add filter option to `FilterBar.tsx`
3. Update `applyComponentFilters` function
4. Add to localStorage serialization

### Extending Bulk Operations  
1. Add new update mode to `BulkMilestoneModal.tsx`
2. Update API endpoint to handle new mode
3. Add validation logic to `bulk-update-utils.ts`
4. Update TypeScript types

### Performance Optimization
1. Use React.memo for expensive components
2. Implement proper key props for list items
3. Debounce user input (search, filters)
4. Consider virtualization for large lists

---

*This documentation covers the bulk update system implementation. For general PipeTrak architecture, see `.claude/pipetrak/claude.md`.*