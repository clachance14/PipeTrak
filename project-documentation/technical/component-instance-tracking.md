# Component Instance Tracking System

## Overview

PipeTrak's component instance tracking system addresses a fundamental requirement in industrial construction: the same component (valve, gasket, fitting) appears multiple times on engineering drawings, and each instance must be tracked independently for installation progress.

## Business Requirements

### Real-World Scenario
A single drawing (P-35F11) might specify:
- 10 identical gaskets (GSWAZ1DZZASG5331)
- 3 identical valves (VGATU-SECBFLR02F-017)
- 5 identical couplings (MCPLALTLEAA1H1795)

Each physical instance needs separate tracking because:
- Installation happens at different times
- Different crew members handle different instances
- Progress reporting requires granular tracking
- Quality control needs instance-level documentation

## Technical Design

### Schema Structure

```prisma
model Component {
  id                 String   @id @default(cuid())
  projectId          String
  drawingId          String   // Required - components belong to drawings
  
  // Component identification
  componentId        String   // Part number from catalog
  instanceNumber     Int      @default(1) // Instance on THIS drawing
  totalInstancesOnDrawing Int? // Total count on THIS drawing
  displayId          String?  // Human-readable format
  
  // ... other fields ...
  
  // Unique constraint per drawing (not project)
  @@unique([drawingId, componentId, instanceNumber])
  @@index([drawingId, componentId]) // Query all instances
  @@index([projectId, componentId]) // Query across project
}
```

### Key Design Decisions

#### 1. Per-Drawing Instance Tracking
**Decision**: Instance numbers are scoped to drawings, not projects.

**Rationale**:
- Drawings are the primary reference for field workers
- Instance numbers reset per drawing (simpler for foremen)
- Aligns with how components are specified in engineering documents

**Example**:
```
Drawing P-35F11: GSWAZ1DZZASG5331 instances 1, 2, 3
Drawing P-35F12: GSWAZ1DZZASG5331 instances 1, 2, 3, 4, 5 (separate set)
```

#### 2. Display ID Generation
**Decision**: Generate human-readable display IDs during import.

**Format Options**:
- Single instance: "GSWAZ1DZZASG5331"
- Multiple instances: "GSWAZ1DZZASG5331 (3 of 10)"

**Benefits**:
- Foremen immediately understand which instance they're working with
- Progress reports show meaningful information
- QC documentation is clearer

#### 3. Unique Constraint Strategy
**Decision**: `@@unique([drawingId, componentId, instanceNumber])`

**Prevents**:
- Duplicate instance numbers for the same component on a drawing
- Data integrity issues during imports

**Allows**:
- Same component across multiple drawings
- Same instance numbers on different drawings

## Import System Implementation

### Instance Assignment Algorithm

```typescript
// Track instance numbers per drawing+componentId
const instanceTracker = new Map<string, { current: number, total: number }>();

// First pass: count instances per drawing
for (const comp of components) {
  const key = `${comp.drawingNumber}:${comp.componentId}`;
  const tracker = instanceTracker.get(key) || { current: 0, total: 0 };
  tracker.total++;
  instanceTracker.set(key, tracker);
}

// Second pass: assign instance numbers
for (const comp of components) {
  const key = `${comp.drawingNumber}:${comp.componentId}`;
  const tracker = instanceTracker.get(key)!;
  tracker.current++;
  
  const instanceNumber = tracker.current;
  const totalInstances = tracker.total;
  
  // Generate display ID
  const displayId = totalInstances > 1 
    ? `${comp.componentId} (${instanceNumber} of ${totalInstances})`
    : comp.componentId;
    
  // Create component with instance data
  await createComponent({
    ...comp,
    instanceNumber,
    totalInstancesOnDrawing: totalInstances,
    displayId
  });
}
```

### Data Quality Handling

The import system handles common data quality issues:

1. **Missing Drawings**: Components referencing non-existent drawings are skipped with warnings
2. **Duplicate Detection**: Automatically assigns instance numbers to duplicates
3. **Referential Integrity**: Maintains foreign key constraints

## Query Patterns

### Get All Instances of a Component on a Drawing
```typescript
const instances = await db.component.findMany({
  where: {
    drawingId: "drawing-123",
    componentId: "GSWAZ1DZZASG5331"
  },
  orderBy: { instanceNumber: 'asc' }
});
```

### Get Component Progress Across Project
```typescript
const progress = await db.component.groupBy({
  by: ['componentId'],
  where: { projectId: "project-123" },
  _count: true,
  _avg: { completionPercent: true }
});
```

### Update Specific Instance
```typescript
await db.component.update({
  where: {
    drawingId_componentId_instanceNumber: {
      drawingId: "drawing-123",
      componentId: "GSWAZ1DZZASG5331",
      instanceNumber: 3
    }
  },
  data: { 
    status: "COMPLETED",
    completionPercent: 100
  }
});
```

## UI Considerations

### Component List Display
```
Drawing P-35F11
├── GSWAZ1DZZASG5331 (1 of 3) - In Progress (66%)
├── GSWAZ1DZZASG5331 (2 of 3) - Not Started (0%)
├── GSWAZ1DZZASG5331 (3 of 3) - Complete (100%)
└── VGATU-SECBFLR02F-017 - Complete (100%)
```

### Bulk Operations
- Select all instances of a component
- Update multiple instances simultaneously
- Filter by instance completion status

## Migration from Legacy Systems

### Common Patterns in Excel Data
1. **No Instance Tracking**: Same component listed multiple times
2. **Manual Numbering**: Components numbered as "VALVE-1", "VALVE-2"
3. **Location-Based**: "VALVE @ Grid A3"

### Migration Strategy
1. Group identical components by drawing
2. Assign sequential instance numbers
3. Preserve original identifiers in metadata
4. Generate standardized display IDs

## Performance Considerations

### Indexes
- `[drawingId, componentId]` - Fast instance lookups
- `[projectId, componentId]` - Cross-project queries
- `[projectId, status]` - Progress reporting

### Optimization Tips
- Batch instance creation during imports
- Use bulk updates for milestone changes
- Cache instance counts per drawing

## Future Enhancements

### Planned Features
1. **Smart Instance Assignment**: ML-based prediction of instance counts
2. **Visual Instance Mapping**: Link instances to drawing coordinates
3. **Instance Templates**: Pre-define common instance patterns
4. **Cross-Reference Support**: Track instances across multiple drawings

### Potential Improvements
1. **Hierarchical Instances**: Support for sub-components
2. **Instance Relationships**: Define dependencies between instances
3. **Historical Tracking**: Maintain instance history through revisions

## Testing Scenarios

### Unit Tests
- Instance number assignment logic
- Display ID generation
- Unique constraint validation

### Integration Tests
- Import 100+ components with duplicates
- Concurrent instance updates
- Cross-drawing queries

### Edge Cases
- Single component with 100+ instances
- Components with no drawing assignment
- Retroactive instance numbering

## Conclusion

The component instance tracking system provides a robust foundation for managing the complexity of industrial construction projects. By tracking instances per drawing and generating clear display identifiers, the system aligns with field operations while maintaining data integrity.

Key benefits:
- **Accurate Progress Tracking**: Each gasket, valve, and fitting tracked individually
- **Clear Communication**: Foremen know exactly which instance they're working on
- **Flexible Import**: Handles various data quality scenarios
- **Scalable Design**: Supports projects with millions of components

This design ensures PipeTrak can handle real-world construction scenarios where component reuse is the norm, not the exception.