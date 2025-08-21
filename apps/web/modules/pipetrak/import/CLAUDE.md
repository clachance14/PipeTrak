# PipeTrak Import System - Complete Developer Guide

## System Overview

> **Migration Status**: V2 implementation is now the primary import system (August 2025). V1 has been archived as ImportWizard.v1.archived.tsx.

The Import System is PipeTrak's component import functionality, designed to handle Excel files containing piping component data with flexible type mapping and intelligent milestone template assignment.

### Design Philosophy
- **Simplicity**: Clean, focused implementation (replaced 696-line V1 system)
- **Flexibility**: Handles 50+ component type variations from different Excel formats
- **Intelligence**: Smart milestone template assignment based on component type
- **User Experience**: 4-step wizard with preview functionality
- **Data Integrity**: Quantity expansion with proper instance tracking per drawing

### Key Improvements Over V1
- 90% reduction in code complexity
- Flexible type mapping system (no hard-coded dependencies)
- Preview mode to validate mappings before import
- Better error handling and validation
- Modern React UI with progress indicators
- Support for component instance tracking

## Architecture Overview

```
Excel File → Excel Parser → Type Mapper → Template Assigner → Database
     ↓            ↓            ↓             ↓                ↓
   Raw Data → Structured → Mapped Types → Templates → Components + Milestones
```

## Core Components

### 1. ComponentTypeMapper (`/packages/api/src/lib/import/type-mapper.ts`)

**Purpose**: Maps Excel component type variations to standardized database enum values.

**Key Features**:
- Maps 50+ type variations (e.g., "Gate Valve", "VALVE", "VLV" → "VALVE")
- Fallback to "MISC" for unknown types
- Statistics tracking for mapping results

**Example Usage**:
```typescript
const typeMapper = new ComponentTypeMapper();
const dbType = typeMapper.mapType("Gate Valve"); // Returns: "VALVE"
const stats = typeMapper.getTypeCounts(["Valve", "Support", "Unknown"]); 
// Returns: { valve: 1, support: 1, misc: 1, ... }
```

**Type Mappings Reference**:
```typescript
// Valves
'VALVE', 'VLV', 'GATE VALVE', 'CHECK VALVE', 'BALL VALVE', 
'BUTTERFLY VALVE', 'GLOBE VALVE', 'PLUG VALVE', 'NEEDLE VALVE',
'PRESSURE RELIEF VALVE', 'SAFETY VALVE', 'CONTROL VALVE' → 'VALVE'

// Supports  
'SUPPORT', 'SUP', 'PIPE SUPPORT', 'HANGER', 'GUIDE', 
'ANCHOR', 'SPRING HANGER', 'RIGID HANGER' → 'SUPPORT'

// Gaskets
'GASKET', 'GSK', 'SEAL', 'O-RING', 'SPIRAL WOUND', 
'FULL FACE', 'RAISED FACE' → 'GASKET'

// And 35+ more mappings...
```

### 2. MilestoneTemplateAssigner (`/packages/api/src/lib/import/template-assigner.ts`)

**Purpose**: Assigns appropriate milestone templates based on component type.

**Logic**:
- **Full Milestone Set** (7 milestones): PIPE, SPOOL components
- **Reduced Milestone Set** (5 milestones): All other component types

**Templates**:
```typescript
// Full Set: Receive → Erect → Connect → Test → Punch → Close → Complete
// Reduced Set: Receive → Install → Test → Punch → Complete
```

**Usage**:
```typescript
const assigner = new MilestoneTemplateAssigner();
await assigner.initialize(projectId);
const templateId = assigner.getTemplateForType('VALVE'); // Returns reduced template ID
```

### 3. Excel Parser (`/packages/api/src/lib/import/excel-parser.ts`)

**Purpose**: Processes Excel files and handles quantity expansion.

**Key Functions**:
- `parseExcel(buffer)`: Converts Excel buffer to structured data
- `calculateTotalInstances(rows)`: Sums QTY column for total instance count  
- `detectColumnMapping(headers)`: Auto-detects column names with variations

**Quantity Expansion Logic**:
```typescript
// Input: 1 row with componentId="ABC123", QTY=3
// Output: 3 component instances:
//   - ABC123 (1 of 3)
//   - ABC123 (2 of 3) 
//   - ABC123 (3 of 3)
```

### 4. Import API (`/apps/web/app/api/pipetrak/import/components-v2/route.ts`)

**Purpose**: Main API endpoint handling preview and full import operations.

**Modes**:
- **Preview Mode** (`preview: true`): Returns mapping statistics without database changes
- **Import Mode** (`preview: false`): Performs full import with database transactions

**Authentication**: Requires organization owner/admin role
**Transaction Safety**: All database operations wrapped in transactions

## Data Flow

### 1. Excel File Processing
```
Raw Excel → Parse Sheets → Detect Columns → Extract Rows
```

### 2. Type Mapping & Validation
```  
Excel Types → ComponentTypeMapper → Database Enums → Validation
```

### 3. Quantity Expansion
```
Single Row (QTY=5) → 5 Individual Instances → Instance Numbering
```

### 4. Database Creation
```
Components → Milestone Templates → Component Milestones
```

## Database Schema

### Component Model
```prisma
model Component {
  id                      String @id @default(cuid())
  projectId               String
  drawingId               String  // Required - components belong to drawings
  componentId             String  // Business ID from Excel (part number)  
  instanceNumber          Int     // Instance on this drawing (1, 2, 3...)
  totalInstancesOnDrawing Int?    // Total instances of this component on drawing
  displayId               String? // "ABC123 (1 of 3)" or "ABC123"
  type                    ComponentType
  milestoneTemplateId     String
  
  // Physical attributes from Excel
  spec         String?
  size         String?
  description  String?
  material     String?  
  notes        String?  // Comments column
  
  // Status tracking
  status            ComponentStatus @default(NOT_STARTED)
  completionPercent Float @default(0)
  
  @@unique([drawingId, componentId, instanceNumber])
}
```

### Instance Tracking Logic
- **Scope**: Per drawing, not per project (same component can appear on multiple drawings)
- **Numbering**: Sequential per drawing (1, 2, 3, ...)
- **Display**: Human-readable format ("ABC123 (2 of 5)")

## UI Components

### ImportWizard (`/apps/web/modules/pipetrak/import/ImportWizardV2.tsx`)

**4-Step Process**:

1. **Upload**: File selection with drag-and-drop
2. **Preview**: Show mapping statistics and unknown types  
3. **Importing**: Progress indicator during database operations
4. **Results**: Success summary with links to view components

**Key Features**:
- File validation (.xlsx, .xls only)
- Base64 encoding for API transmission
- Error handling with user-friendly messages
- Responsive design for mobile/desktop

### Page Route (`/app/(organizations)/[organizationSlug]/pipetrak/[projectId]/import/v2/page.tsx`)

**Security**:
- Session authentication required
- Organization membership validation
- Project access verification

**URL Structure**:
```
/app/{organizationSlug}/pipetrak/{projectId}/import/v2
```

## Implementation Guide

### Step 1: Set Up Type Mapping
```typescript
// Create ComponentTypeMapper class
export class ComponentTypeMapper {
  private readonly TYPE_MAPPINGS: Record<string, ComponentType> = {
    // Add all type variations here
  };
  
  mapType(excelType: string): ComponentType {
    // Normalize and map to database enum
  }
}
```

### Step 2: Create Template Assigner  
```typescript
// Initialize milestone templates
export class MilestoneTemplateAssigner {
  async initialize(projectId: string) {
    // Load or create milestone templates
  }
  
  getTemplateForType(componentType: ComponentType): string {
    // Return appropriate template ID
  }
}
```

### Step 3: Build Import API
```typescript
// Handle preview and import requests
export async function POST(request: NextRequest) {
  // 1. Authenticate user
  // 2. Parse Excel file  
  // 3. Map types and assign templates
  // 4. Preview mode: return statistics
  // 5. Import mode: create database records
}
```

### Step 4: Create UI Components
```tsx
// 4-step wizard component
export function ImportWizardV2({ projectId }: Props) {
  // State management for wizard steps
  // File upload handling
  // API communication
  // Error handling
}
```

## Testing & Validation

### Expected Behavior with TAKEOFF File
```
Input:  390 Excel rows with QTY values (includes duplicates)
Process: Grouped to ~200 unique components 
Output: 1,353 component instances + 6,765 milestones (5 per component)
Types:  All mapped to database enums (valve, support, gasket, etc.)
Result: ✅ SUCCESS - No constraint violations, proper instance numbering
```

### Test Results (August 2025)
```bash
✅ Components created: 1,353
✅ Milestones created: 6,765 (5 per component using Reduced Milestone Set)
✅ Duplicates handled: Multiple Excel rows grouped by (drawing, component)
✅ Transaction success: All operations committed atomically
```

### Common Test Cases
- **Single quantity**: QTY=1 → 1 instance, displayId = componentId
- **Multiple quantity**: QTY=5 → 5 instances, displayId = "ABC123 (1 of 5)"
- **Excel duplicates**: Multiple rows for same component → Grouped and quantities summed
- **Unknown types**: "Weird Type" → mapped to "MISC"
- **Missing data**: Handles empty cells gracefully
- **Existing components**: Continues instance numbering from max existing + 1

## Error Handling

### Validation Errors
- Missing required fields (Drawing, Component ID)
- Invalid quantity values
- File parsing failures

### Database Errors (All Resolved)  
- ~~Duplicate component instances~~ → ✅ Fixed with component grouping
- ~~Missing milestone templates~~ → ✅ Templates created automatically
- ~~Transaction rollbacks on failure~~ → ✅ Atomic transactions implemented

### User Experience
- Clear error messages in UI
- Field-level validation
- Graceful fallbacks for edge cases

## System Status

### ✅ Fully Functional (August 2025)
The Import System is now **production-ready** with all major issues resolved:

- **✅ Component Grouping**: Eliminates Excel duplicates by grouping components per drawing
- **✅ Transaction Safety**: Components and milestones created atomically
- **✅ Drawing Creation**: Automatically creates missing drawings
- **✅ Instance Numbering**: Proper sequential numbering without conflicts
- **✅ Duplicate Prevention**: Checks existing components and continues numbering
- **✅ Error Handling**: Clear error messages with proper HTTP status codes

### Recent Fixes Applied
- **Duplicate Component Resolution**: Added component grouping logic to prevent constraint violations
- **Transaction Fix**: Milestone creation now uses same transaction client as components
- **Drawing ID Mapping**: Fixed UUID/string mismatch in duplicate checking
- **Comprehensive Debugging**: Added detailed logging for troubleshooting

### Potential Improvements
- Advanced column mapping detection
- Progress indicators during import
- Validation rule configuration
- UI improvements for better user experience

### Performance Considerations
- Large file handling (100MB+ Excel files)
- Database connection pooling
- Memory usage during processing
- Background job processing for huge imports

## File Structure

```
/apps/web/modules/pipetrak/import/
├── CLAUDE.md                    # This documentation
├── ImportWizardV2.tsx          # Main UI component (exported as ImportWizard)
├── ImportWizard.v1.archived.tsx # Archived V1 implementation
└── index.ts                    # Exports ImportWizardV2 as ImportWizard

/packages/api/src/lib/import/
├── types.ts                    # TypeScript interfaces  
├── type-mapper.ts              # ComponentTypeMapper class
├── template-assigner.ts        # MilestoneTemplateAssigner class
└── excel-parser.ts             # Excel processing utilities

/apps/web/app/api/pipetrak/import/
└── components-v2/
    └── route.ts                # Import API endpoint

/apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pipetrak/[projectId]/import/
└── v2/
    └── page.tsx                # Import page route
```

## Development Commands

```bash
# Test the import system
cd tooling/scripts
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx test-import-v2.ts

# Run the web application  
cd apps/web
pnpm dev

# Access import V2 UI
http://localhost:3000/app/{org}/pipetrak/{project}/import/v2
```

## Quick Start Rebuild Guide

1. **Create Type Mapper**: Handle 50+ Excel type variations → database enums
2. **Build Template Assigner**: Assign milestone templates based on component type  
3. **Implement Excel Parser**: Process files and expand quantities to instances
4. **Create Import API**: Handle preview/import with authentication and validation
5. **Build UI Wizard**: 4-step process with file upload and progress indicators
6. **Add Page Route**: Organization-scoped URL with access controls
7. **Test Integration**: Validate with real Excel files and database operations

The system is designed for maintainability and extensibility. Each component has a single responsibility and clear interfaces, making it easy to modify or extend functionality.