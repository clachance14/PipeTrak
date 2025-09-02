# Field Weld Import System - Developer Guide

## Overview

This document provides comprehensive guidance for developers working on the field weld import system in PipeTrak. The system enables bulk import of field weld data from WELD LOG.xlsx files with proper dual-table tracking and milestone management.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Field Weld Milestone Template](#field-weld-milestone-template)
3. [MilestoneTemplateAssigner Pattern](#milestonetemplateassigner-pattern)
4. [Dual-Table Record Creation](#dual-table-record-creation)
5. [Import Process Flow](#import-process-flow)
6. [Performance Optimizations](#performance-optimizations)
7. [Troubleshooting Guide](#troubleshooting-guide)
8. [Testing Strategies](#testing-strategies)

## System Architecture

### Core Components

```
Field Weld Import System
├── Frontend
│   ├── FieldWeldUpload.tsx (File upload UI)
│   ├── FieldWeldUploadWrapper.tsx (Client wrapper)
│   └── ColumnMapper.tsx (Column mapping - future)
├── Backend
│   ├── /api/pipetrak/qc/field-welds/import/route.ts (Main import API)
│   ├── MilestoneTemplateAssigner (Template management)
│   └── Excel parsing utilities
└── Database
    ├── Component table (Main tracking)
    ├── FieldWeld table (QC-specific data)
    └── ComponentMilestone table (Progress tracking)
```

### Data Flow

1. **File Upload** → Excel file validated and parsed
2. **Row Processing** → Only actual data rows processed (not formatted empty rows)
3. **Duplicate Detection** → Check both Component and FieldWeld tables
4. **Batch Processing** → Process in batches of 10 welds
5. **Dual-Table Creation** → Create Component + FieldWeld records
6. **Milestone Creation** → Use Field Weld template via MilestoneTemplateAssigner

## Field Weld Milestone Template

### Template Definition

Field welds use a specialized milestone template with welding-specific milestones:

```typescript
{
  name: "Field Weld",
  description: "For field welds - weld-specific milestone tracking",
  milestones: [
    { name: "Fit Up", weight: 10, order: 1 },
    { name: "Weld Made", weight: 60, order: 2 },
    { name: "Punch", weight: 10, order: 3 },
    { name: "Test", weight: 15, order: 4 },
    { name: "Restore", weight: 5, order: 5 }
  ]
}
```

### ROC (Rules of Credit) Weights

- **Fit Up**: 10% - Preparation and fitup work
- **Weld Made**: 60% - Actual welding completion (major milestone)
- **Punch**: 10% - Punch list items and minor fixes  
- **Test**: 15% - Testing and inspection
- **Restore**: 5% - Final restoration and cleanup

### Key Differences from Other Templates

- **Reduced Milestone Set**: Generic (Receive, Install, Punch, Test, Restore)
- **Field Weld Template**: Welding-specific (Fit Up, Weld Made, Punch, Test, Restore)

## MilestoneTemplateAssigner Pattern

### Adding New Component Types

When adding support for new component types with custom milestone templates:

#### 1. Update Template Interface

```typescript
// In template-assigner.ts
export class MilestoneTemplateAssigner {
  private templates: {
    full?: MilestoneTemplate;
    reduced?: MilestoneTemplate;
    fieldWeld?: MilestoneTemplate;  // Add new template
    // Add more as needed
  } = {};
}
```

#### 2. Add Template Initialization

```typescript
async initialize(projectId: string) {
  // ... existing templates ...
  
  this.templates.fieldWeld = await this.ensureTemplate(projectId, {
    name: 'Field Weld',
    description: 'For field welds - weld-specific milestone tracking',
    milestones: [
      { name: 'Fit Up', weight: 10, order: 1 },
      { name: 'Weld Made', weight: 60, order: 2 },
      { name: 'Punch', weight: 10, order: 3 },
      { name: 'Test', weight: 15, order: 4 },
      { name: 'Restore', weight: 5, order: 5 }
    ]
  });
}
```

#### 3. Update Template Assignment Logic

```typescript
getTemplateForType(componentType: ComponentType): string {
  if (!this.templates.full || !this.templates.reduced || !this.templates.fieldWeld) {
    throw new Error('Templates not initialized. Call initialize() first.');
  }
  
  // Add specific component type handling
  if (componentType === 'FIELD_WELD') {
    console.log(`Assigning Field Weld template to ${componentType}`);
    return this.templates.fieldWeld.id;
  }
  
  // ... rest of logic
}
```

### Template Definition Files

Also update template definitions in:
- `tooling/scripts/src/create-milestone-templates.ts`
- `packages/api/src/lib/file-processing.ts`

## Dual-Table Record Creation

### Architecture Pattern

Field welds require records in both tables for complete tracking:

```typescript
await db.$transaction(async (tx) => {
  // 1. Create Component record (main system tracking)
  const component = await tx.component.create({
    data: {
      projectId,
      drawingId: drawing.id,
      milestoneTemplateId: fieldWeldTemplateId,
      componentId: weldData.weldIdNumber,
      weldId: weldData.weldIdNumber,          // Links to FieldWeld
      type: "FIELD_WELD",                     // Component type
      workflowType: "MILESTONE_DISCRETE",
      displayId: weldData.weldIdNumber,
      instanceNumber: 1,
      status: "NOT_STARTED",
      completionPercent: 0
    }
  });
  
  // 2. Create FieldWeld record (QC-specific data)  
  const fieldWeld = await tx.fieldWeld.create({
    data: {
      projectId,
      weldIdNumber: weldData.weldIdNumber,    // Links to Component
      drawingId: drawing.id,
      packageNumber: weldData.testPackageNumber || "TBD",
      specCode: weldData.specCode || "TBD",
      weldSize: weldData.weldSize || "TBD",
      // ... other QC fields
    }
  });
  
  // 3. Create milestones using template assigner
  await templateAssigner.createMilestonesForComponents([{
    id: component.id,
    milestoneTemplateId: component.milestoneTemplateId,
    workflowType: component.workflowType
  }], tx);
});
```

### Data Relationship

```
Component Table                    FieldWeld Table
├── id (Primary Key)              ├── id (Primary Key)  
├── componentId = "123"           ├── weldIdNumber = "123"
├── weldId = "123" ────────────────┤ (Linking field)
├── type = "FIELD_WELD"           ├── weldSize, specCode, etc.
├── milestoneTemplateId           └── QC-specific fields
└── General component fields      

ComponentMilestone Table
├── componentId → Component.id
├── milestoneName = "Fit Up"
├── milestoneOrder = 1
├── weight = 10
└── isCompleted = false
```

## Import Process Flow

### 1. File Upload & Validation

```typescript
// Frontend: FieldWeldUploadWrapper.tsx
const handleImport = async (file: File, validationResult: any) => {
  const fileBuffer = await file.arrayBuffer();
  const base64Buffer = Buffer.from(fileBuffer).toString('base64');
  
  const payload = {
    projectId,
    fileData: { buffer: base64Buffer },
    filename: file.name,
    validationData: {
      isValid: true,
      totalRows: 0,    // Backend determines from Excel
      validRows: 0,    // Backend determines from Excel  
      validatedRows: [] // Backend parses and populates
    },
    options: {
      skipErrors: false,            // Handle duplicates
      createMissingDrawings: true,  // Auto-create drawings
      dryRun: false
    }
  };
}
```

### 2. Excel Parsing with Row Filtering

```typescript
// Backend: Critical optimization
const fieldWeldData = parsedData.rows
  .map((row, index) => {
    // Check if row has actual data BEFORE processing
    const weldIdRaw = row[parsedData.headers[0]] || row['A'];
    const drawingNumberRaw = row[parsedData.headers[3]] || row['D'];
    
    // Skip empty/invalid rows early
    if (!weldIdRaw || !drawingNumberRaw || 
        String(weldIdRaw).trim() === '' || 
        String(drawingNumberRaw).trim() === '') {
      return null; // Mark for filtering
    }
    
    // Process only valid rows
    return {
      weldIdNumber: String(weldIdRaw).trim(),
      drawingNumber: String(drawingNumberRaw).trim(),
      // ... other fields
    };
  })
  .filter((item): item is FieldWeldImportData => item !== null);
```

### 3. Duplicate Detection

```typescript
// Check both Component and FieldWeld tables
const existingComponents = await prisma.component.findMany({
  where: {
    projectId,
    componentId: { in: validationData.validatedRows.map(row => row.weldIdNumber) }
  },
  select: { componentId: true }
});

const existingWeldIds = await prisma.fieldWeld.findMany({
  where: {
    projectId,
    weldIdNumber: { in: validationData.validatedRows.map(row => row.weldIdNumber) }
  },
  select: { weldIdNumber: true }
});

// Filter out duplicates from both tables
const duplicates = weldRowsToProcess.filter(row => 
  existingWeldIdSet.has(row.weldIdNumber) || 
  existingComponentIdSet.has(row.weldIdNumber)
);
```

### 4. Batch Processing

```typescript
// Process in small batches to prevent timeouts
const BATCH_SIZE = 10; // Optimal size for complex operations
const batches = [];
for (let i = 0; i < weldRowsToProcess.length; i += BATCH_SIZE) {
  batches.push(weldRowsToProcess.slice(i, i + BATCH_SIZE));
}

for (const batch of batches) {
  await prisma.$transaction(async (tx) => {
    // Create components and field welds
    // Use template assigner for milestones
  }, {
    timeout: 30000, // 30 second timeout
  });
}
```

## Performance Optimizations

### 1. Row Filtering Optimization

**Problem**: Excel files often have thousands of formatted but empty rows
**Solution**: Filter rows early in the processing pipeline

```typescript
// BEFORE: Process all 5000 rows, then filter
const allRows = parsedData.rows.map(processRow).filter(isValid);

// AFTER: Check validity first, then process
const validRows = parsedData.rows
  .filter(hasActualData)  // Check first
  .map(processRow);       // Process only valid rows
```

### 2. Batch Size Optimization

- **25 welds/batch**: Transaction timeouts
- **10 welds/batch**: ✅ Optimal performance
- **5 welds/batch**: Too many transactions (overhead)

### 3. Template Assigner Efficiency

Uses bulk `createMany` operations:
```typescript
await tx.componentMilestone.createMany({
  data: allMilestonesToCreate  // Bulk insert
});
```

Instead of individual creates:
```typescript
// AVOID: Individual creates in loop
for (const milestone of milestones) {
  await tx.componentMilestone.create({ data: milestone });
}
```

### 4. Transaction Timeout Management

```typescript
await prisma.$transaction(async (tx) => {
  // Complex operations
}, {
  timeout: 30000, // 30 seconds for complex operations
});
```

## Troubleshooting Guide

### Common Issues

#### 1. "Cannot read properties of undefined (reading 'create')"

**Cause**: Wrong table name in Prisma query
**Solution**: Use correct model names
```typescript
// WRONG
await tx.milestone.create(...)

// CORRECT  
await tx.componentMilestone.create(...)
```

#### 2. "Argument `milestoneName` is missing"

**Cause**: Using wrong field names for ComponentMilestone
**Solution**: Use correct field names
```typescript
// WRONG
{
  name: "Fit Up",
  sequence: 1,
  type: "discrete"
}

// CORRECT
{
  milestoneName: "Fit Up",
  milestoneOrder: 1,
  weight: 10
}
```

#### 3. "Transaction already closed" / "Transaction not found"

**Cause**: Transaction timeout from processing too many records
**Solutions**:
- Reduce batch size (10 records max)
- Increase timeout (30 seconds)
- Use template assigner (bulk operations)

#### 4. "Unique constraint failed on (drawingId, componentId, instanceNumber)"

**Cause**: Duplicate components not filtered properly
**Solution**: Check both Component and FieldWeld tables for duplicates

#### 5. Field welds get wrong milestones

**Cause**: MilestoneTemplateAssigner not updated for FIELD_WELD type
**Solution**: Add Field Weld template support to template assigner

### Debugging Steps

1. **Check console logs** for template assignment
2. **Verify template initialization** in database
3. **Confirm batch sizes** and transaction timeouts
4. **Test with small file first** (10-50 rows)
5. **Check duplicate detection** is working

### Performance Monitoring

```typescript
console.log(`Field Weld Import: Processing ${weldRowsToProcess.length} welds in ${batches.length} batches`);
console.log(`Field Weld Import: Batch ${batchNumber} completed - created ${batchResult.componentsCreated} components`);
```

## Testing Strategies

### Unit Tests

```typescript
describe('MilestoneTemplateAssigner', () => {
  test('assigns Field Weld template to FIELD_WELD components', () => {
    const templateId = assigner.getTemplateForType('FIELD_WELD');
    expect(templateId).toBe(mockFieldWeldTemplate.id);
  });
});
```

### Integration Tests

```typescript
describe('Field Weld Import', () => {
  test('creates both Component and FieldWeld records', async () => {
    const result = await importFieldWelds(mockExcelData);
    
    expect(result.created.components).toBe(10);
    expect(result.created.fieldWelds).toBe(10);
    expect(result.created.milestones).toBe(50); // 10 welds × 5 milestones
  });
});
```

### Load Testing

- Test with 1,000+ weld files
- Measure import time and memory usage
- Verify no transaction timeouts
- Confirm milestone creation accuracy

### Manual Testing Checklist

- [ ] Upload 721-row WELD LOG.xlsx file
- [ ] Verify all rows processed (not 5000+)
- [ ] Check Component table has FIELD_WELD records
- [ ] Check FieldWeld table has matching records
- [ ] Verify each component has 5 milestones
- [ ] Confirm milestone names: Fit Up, Weld Made, Punch, Test, Restore
- [ ] Test duplicate handling with re-import
- [ ] Verify error messages are clear

## Future Enhancements

### Planned Improvements

1. **Column Mapping UI** - Visual interface for mapping Excel columns
2. **Advanced Validation** - Multi-tier validation system
3. **Progress Tracking** - Real-time import progress updates
4. **Mobile Responsiveness** - Tablet/phone optimization
5. **Performance Scaling** - Parallel processing for 20k+ welds

### Extensibility Points

- Add new component types with custom templates
- Implement custom validation rules
- Add new milestone templates
- Extend duplicate detection logic
- Create custom import processors

---

## Related Documentation

- [Linear Epic: Field Weld Import System](https://linear.app/pipetrak/issue/PIP-56)
- [ROC Component Type Matrix](../project-documentation/roc-component-type-matrix.md)
- [Milestone Template System](./milestone-templates.md)
- [Import System Architecture](./import-architecture.md)

---

*Last Updated: August 28, 2025 - Implementation of core field weld import functionality*