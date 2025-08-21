# Gasket Milestone Display Issue - Root Cause & Fix

## Issue Summary
Gaskets are displaying incorrect milestones (Fit-up, Welded) instead of the proper reduced milestone set (Receive, Install/Connect, Punch, Test, Restore).

## Root Cause Analysis

### The Problem
All components in PipeTrak are being assigned the **same "Standard Piping" milestone template** regardless of their component type.

### Code Location
`/tooling/scripts/src/seed-sdo-tank.ts` (Line 261)
```typescript
milestoneTemplateId: pipingTemplate.id,  // ALL components get the same template!
```

### Current Behavior
1. Only ONE milestone template exists: "Standard Piping"
   - Received (20%)
   - Fit-up (20%)
   - Welded (20%)
   - Tested (20%)
   - Insulated (20%)

2. This template is applied to ALL components:
   - Gaskets ❌ (Should NOT have Fit-up/Welded)
   - Valves ❌ (Should have Install, not Welded)
   - Supports ❌ (Should have reduced set)
   - Pipes ✓ (Correct for pipes)

## Required Fix

### 1. Create Multiple Milestone Templates

```typescript
// Full Milestone Set Template (Spools & Piping)
const fullTemplate = await prisma.milestoneTemplate.create({
  data: {
    name: "Full Milestone Set",
    description: "For spools and piping by footage",
    milestones: JSON.stringify([
      { name: "Receive", weight: 5, order: 1 },
      { name: "Erect", weight: 30, order: 2 },
      { name: "Connect", weight: 30, order: 3 },
      { name: "Support", weight: 15, order: 4 },
      { name: "Punch", weight: 5, order: 5 },
      { name: "Test", weight: 10, order: 6 },
      { name: "Restore", weight: 5, order: 7 }
    ])
  }
});

// Reduced Milestone Set Template (Valves, Gaskets, Supports, etc.)
const reducedTemplate = await prisma.milestoneTemplate.create({
  data: {
    name: "Reduced Milestone Set",
    description: "For valves, gaskets, supports, instruments",
    milestones: JSON.stringify([
      { name: "Receive", weight: 10, order: 1 },
      { name: "Install", weight: 60, order: 2 },
      { name: "Punch", weight: 10, order: 3 },
      { name: "Test", weight: 15, order: 4 },
      { name: "Restore", weight: 5, order: 5 }
    ])
  }
});

// Field Weld Template
const fieldWeldTemplate = await prisma.milestoneTemplate.create({
  data: {
    name: "Field Weld",
    description: "For field welds",
    milestones: JSON.stringify([
      { name: "Fit-up Ready", weight: 10, order: 1 },
      { name: "Weld", weight: 60, order: 2 },
      { name: "Punch", weight: 10, order: 3 },
      { name: "Test", weight: 15, order: 4 },
      { name: "Restore", weight: 5, order: 5 }
    ])
  }
});

// Insulation Template
const insulationTemplate = await prisma.milestoneTemplate.create({
  data: {
    name: "Insulation",
    description: "For insulation work",
    milestones: JSON.stringify([
      { name: "Insulate", weight: 60, order: 1 },
      { name: "Metal Out", weight: 40, order: 2 }
    ])
  }
});

// Paint Template
const paintTemplate = await prisma.milestoneTemplate.create({
  data: {
    name: "Paint",
    description: "For paint/coating work",
    milestones: JSON.stringify([
      { name: "Primer", weight: 40, order: 1 },
      { name: "Finish Coat", weight: 60, order: 2 }
    ])
  }
});
```

### 2. Create Template Resolution Function

```typescript
function resolveTemplateByComponentType(
  componentType: string,
  workflowType: string,
  templates: Map<string, MilestoneTemplate>
): string {
  const typeMapping: Record<string, string> = {
    // Full set
    'SPOOL': 'Full Milestone Set',
    'PIPE': 'Full Milestone Set',
    'PIPING': 'Full Milestone Set',
    
    // Reduced set
    'GASKET': 'Reduced Milestone Set',
    'VALVE': 'Reduced Milestone Set',
    'SUPPORT': 'Reduced Milestone Set',
    'INSTRUMENT': 'Reduced Milestone Set',
    
    // Special templates
    'FIELD_WELD': 'Field Weld',
    'WELD': 'Field Weld',
    'INSULATION': 'Insulation',
    'PAINT': 'Paint',
  };
  
  const templateName = typeMapping[componentType.toUpperCase()] || 'Full Milestone Set';
  const template = templates.get(templateName);
  
  if (!template) {
    console.warn(`Template ${templateName} not found for type ${componentType}, using default`);
    return templates.get('Full Milestone Set')!.id;
  }
  
  return template.id;
}
```

### 3. Update Component Creation

```typescript
// During import or seed
const component = await prisma.component.create({
  data: {
    // ... other fields ...
    milestoneTemplateId: resolveTemplateByComponentType(
      componentData.type,
      componentData.workflowType,
      templateMap
    ),
  }
});
```

## Implementation Steps

### Phase 1: Create Templates (Immediate)
1. Create migration script to add all milestone templates
2. Update seed scripts to create proper templates
3. Map component types to correct templates

### Phase 2: Fix Existing Data (Next)
1. Create script to reassign templates for existing components
2. Update milestones to match new templates
3. Preserve any completion data

### Phase 3: Update Import System (Following)
1. Modify import logic to use template resolution
2. Add validation for component type → template mapping
3. Allow template override during import if needed

## Migration Script for Existing Data

```typescript
async function fixGasketMilestones() {
  // Find all gaskets with wrong template
  const gaskets = await prisma.component.findMany({
    where: {
      OR: [
        { type: { contains: 'GASKET', mode: 'insensitive' } },
        { type: { contains: 'GKT', mode: 'insensitive' } },
        { componentId: { startsWith: 'GK' } }
      ]
    },
    include: {
      milestones: true
    }
  });
  
  console.log(`Found ${gaskets.length} gaskets to fix`);
  
  // Get or create the reduced template
  const reducedTemplate = await prisma.milestoneTemplate.findFirst({
    where: { name: 'Reduced Milestone Set' }
  }) || await createReducedTemplate();
  
  for (const gasket of gaskets) {
    // Update template reference
    await prisma.component.update({
      where: { id: gasket.id },
      data: { milestoneTemplateId: reducedTemplate.id }
    });
    
    // Map old milestones to new ones
    const milestoneMapping = {
      'Received': 'Receive',
      'Fit-up': 'Install',  // Map Fit-up to Install
      'Welded': 'Install',   // Map Welded to Install
      'Tested': 'Test',
      'Insulated': 'Restore'
    };
    
    // Delete old milestones
    await prisma.componentMilestone.deleteMany({
      where: { componentId: gasket.id }
    });
    
    // Create new milestones with proper names and weights
    const newMilestones = JSON.parse(reducedTemplate.milestones as string);
    for (let i = 0; i < newMilestones.length; i++) {
      const milestone = newMilestones[i];
      
      // Check if any old milestone maps to this new one
      const wasCompleted = gasket.milestones.some(m => 
        milestoneMapping[m.milestoneName] === milestone.name && m.isCompleted
      );
      
      await prisma.componentMilestone.create({
        data: {
          componentId: gasket.id,
          milestoneOrder: i,
          milestoneName: milestone.name,
          creditWeight: milestone.weight,
          isCompleted: wasCompleted,
          completedAt: wasCompleted ? new Date() : null
        }
      });
    }
  }
  
  console.log('Gasket milestones fixed successfully');
}
```

## Testing Plan

1. **Verify Templates**
   - Confirm all 5 template types exist
   - Validate milestone names and weights sum to 100%

2. **Test Component Assignment**
   - Import gasket → Should get Reduced template
   - Import pipe → Should get Full template
   - Import field weld → Should get Field Weld template

3. **Validate Display**
   - Gaskets show: Receive, Install, Punch, Test, Restore
   - No gaskets show: Fit-up or Welded

4. **Check Progress Calculations**
   - ROC weights calculate correctly
   - Completion percentages accurate

## Expected Outcome

After implementing this fix:
- ✅ Gaskets will show correct milestones (Receive, Install, Punch, Test, Restore)
- ✅ Each component type will have appropriate milestone set
- ✅ ROC calculations will be accurate based on component type
- ✅ Import system will automatically assign correct templates

---

*Document Version: 1.0*
*Author: Sarah (Product Owner)*
*Date: 2025-08-12*
*Priority: HIGH - Data integrity issue affecting progress tracking*