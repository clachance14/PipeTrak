# Field Weld Column Mapper Component

## Overview

The `FieldWeldColumnMapper` component provides a comprehensive interface for mapping Excel columns from WELD LOG.xlsx files to field weld data fields. This component handles the enhanced 27-column format (A through Z plus AA) and integrates with the existing PipeTrak import system.

## Component Features

### 🔧 Core Functionality
- **27-column support**: Handles Excel columns A-Z plus AA (27 total columns)
- **Auto-mapping**: Intelligent detection of field mappings based on header content and position
- **Real-time validation**: Visual indicators for mapping status (valid, warning, error)
- **Required field validation**: Enforces mapping of critical fields (Weld ID, Drawing Number)
- **Desktop-optimized**: Horizontal scrolling for wide table displays
- **Data preview**: Shows first 10 rows with current mappings applied

### 📊 Visual Indicators
- ✅ **Green checkmarks**: Successfully mapped fields
- ⚠️ **Yellow warnings**: Optional fields or mapping mismatches  
- ❌ **Red errors**: Missing required field mappings
- ✨ **Auto badges**: Fields that were automatically mapped
- 📋 **Preview table**: Real data display with proper formatting

### 🎯 Required Fields
- **Weld ID** (Column A): Unique identifier for each weld
- **Drawing Number** (Column D): Associates weld with specific drawing

### 📋 Optional Fields
- Welder Stencil, Test Package, Test Pressure, Spec Code
- Weld Size, PMI/PWHT flags, X-ray Percentage, Weld Type
- PMI Complete Date, Comments

## Usage Example

```tsx
import { FieldWeldColumnMapper } from "./FieldWeldColumnMapper";

function ImportWizard() {
  const [mappings, setMappings] = useState({});
  
  return (
    <FieldWeldColumnMapper
      parsedData={{
        headers: ["Weld ID Number", "Welder Stencil", ...],
        rows: [{ "Weld ID Number": "1", ... }],
        metadata: { filename: "WELD LOG.xlsx" }
      }}
      mappings={mappings}
      onMappingChange={setMappings}
      onContinue={() => console.log("Proceeding...")}
      onBack={() => console.log("Going back...")}
      validationResults={{ isValid: true, errors: [], warnings: [] }}
    />
  );
}
```

## Integration with PipeTrak Architecture

### Data Flow
1. **File Upload** → `FieldWeldUpload` component validates file format
2. **Column Mapping** → `FieldWeldColumnMapper` handles field assignments  
3. **Validation** → Integration with `FieldWeldProcessor` from API package
4. **Import** → Processed data sent to Supabase via RPC calls

### Architecture Integration
```
apps/web/modules/pipetrak/qc/import/
├── FieldWeldUpload.tsx          # File upload & validation
├── FieldWeldColumnMapper.tsx    # Column mapping (NEW)  
├── FieldWeldValidationPreview.tsx # Data validation display
└── FieldWeldImportWizard.tsx    # Overall flow coordinator

packages/api/src/lib/import/
├── field-weld-processor.ts      # Backend processing logic
├── base-processor.ts            # Shared validation framework
└── types.ts                     # Import type definitions
```

### API Integration
The component works with the enhanced `FieldWeldProcessor` that handles:
- **Format validation**: Ensures WELD LOG.xlsx structure
- **Data transformation**: Maps Excel data to component records  
- **Business rules**: Validates weld IDs, drawing numbers, pressure values
- **Batch processing**: Handles up to 20,000 rows efficiently

## Column Mapping Logic

### Position-Based Mapping
```typescript
const WELD_LOG_COLUMN_MAPPING = {
  'A': 'weldIdNumber',        // Required
  'B': 'welderStencil',       
  'D': 'drawingNumber',       // Required
  'F': 'testPackageNumber',   
  'G': 'testPressure',        
  'J': 'specCode',            
  'R': 'pmiRequired',         // Boolean
  'S': 'pwhtRequired',        // Boolean
  'Y': 'pmiCompleteDate',     // Date
  'AA': 'comments'            
  // ... other columns
};
```

### Auto-mapping Algorithm
1. **Position validation**: Checks if column position matches expected field
2. **Header analysis**: Compares header text to expected field names
3. **Content validation**: Ensures header contains relevant keywords
4. **Conflict resolution**: Prevents duplicate field assignments

## Validation System

### Field Requirements
- **Critical**: Weld ID and Drawing Number must be mapped
- **Recommended**: Test Package and Spec Code for complete QC tracking
- **Optional**: All other fields can be updated later in QC module

### Status Indicators
```typescript
type ValidationStatus = 'valid' | 'warning' | 'error';

// Valid: Required field properly mapped
// Warning: Optional field or position mismatch  
// Error: Required field missing
```

## Data Preview Features

### Interactive Preview Table
- Shows first 10 rows of actual Excel data
- Updates in real-time as mappings change
- Horizontal scroll for wide data sets
- Truncated cell display with full-content tooltips

### Preview Controls
- Toggle preview visibility to save screen space
- Column headers show field names and Excel positions
- Empty cells display with visual placeholders

## Responsive Design

### Desktop Focus
- Optimized for wide screens with many columns
- Horizontal scrolling for mapping grid and preview table
- Efficient use of screen real estate

### Mobile Considerations  
- While desktop-focused, maintains readability on smaller screens
- Scrollable areas maintain touch compatibility
- Important information remains visible at all viewport sizes

## Error Handling

### Validation Errors
```typescript
interface ValidationResults {
  isValid: boolean;
  errors: string[];      // Critical issues blocking import
  warnings: string[];    // Non-critical issues for review
}
```

### User Feedback
- Clear error messages for mapping requirements
- Warning indicators for data quality issues
- Success confirmation when mappings are complete

## Performance Considerations

### Large File Handling
- Preview limited to first 10 rows for performance
- Efficient column mapping with minimal re-renders
- Virtualized scrolling for large column sets

### Memory Management  
- Streaming data processing for large Excel files
- Minimal data duplication between components
- Cleanup of file readers and temporary objects

## Testing Strategy

### Unit Tests
- Column mapping logic validation
- Auto-mapping algorithm testing  
- Validation rule enforcement
- Component state management

### Integration Tests
- File upload → mapping → validation flow
- API integration with FieldWeldProcessor
- Error handling and recovery scenarios

### Visual Tests
- Component rendering across screen sizes
- Data preview formatting and scrolling
- Status indicator accuracy

## Future Enhancements

### Planned Features
- **Custom field mapping**: User-defined field assignments
- **Template save/load**: Store mapping configurations  
- **Bulk validation**: Preview validation results for all rows
- **Advanced preview**: Sorting, filtering, and search in preview table

### Performance Improvements
- **Virtualized mapping grid**: Handle 100+ columns efficiently
- **Background validation**: Non-blocking validation processing
- **Cached mappings**: Remember successful mapping patterns

## File Structure

```
/apps/web/modules/pipetrak/qc/import/
├── FieldWeldColumnMapper.tsx           # Main component
├── FieldWeldColumnMapperExample.tsx    # Usage example
├── __tests__/
│   ├── FieldWeldColumnMapper.test.tsx  # Component tests
│   └── mapping-logic.test.ts           # Logic tests
└── README.md                          # This documentation
```

## Related Components

- **ComponentTable.tsx**: Reference for table patterns and Excel-like interfaces
- **ColumnMapper.tsx**: Generic column mapping (component import)
- **ValidationPreview.tsx**: Data validation display patterns
- **ImportWizard.tsx**: Multi-step import flow coordination

---

*This component integrates with the enhanced FieldWeldProcessor and follows PipeTrak's established patterns for data import, validation, and user interaction.*