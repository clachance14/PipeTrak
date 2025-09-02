# Field Weld Validator

A comprehensive validation engine for field weld imports in PipeTrak, designed to handle up to 20,000 rows with batch processing for optimal performance.

## Features

### Core Validation Capabilities

- **Format Validation**: Validates Weld ID format and uniqueness within project
- **Drawing Reference Validation**: Ensures drawing numbers exist in database
- **Test Package Validation**: Validates test package format if provided
- **Boolean Field Parsing**: Supports Yes/No, True/False, 1/0, X, or blank values for R and S columns
- **Date Parsing**: Handles Excel date numbers and common date formats for Y column (PMI Complete DATE)
- **Comprehensive Error Reporting**: Row-by-row validation with detailed error categorization
- **Performance Optimized**: Batch processing for up to 20,000 rows

### Validation Categories

- **Errors**: Critical issues that prevent import
- **Warnings**: Data quality issues that don't prevent import
- **Info**: Informational messages and processing notes

### Key Validation Rules

#### Required Fields
- **Weld ID (Column A)**: Must be unique within project and file
- **Drawing Number (Column D)**: Must exist in project database

#### Format Validation
- Pressure values: Range validation (0-15,000 PSI with warnings)
- Weld sizes and schedules: Format consistency checks
- Boolean fields: Accept multiple formats (Yes/No, True/False, 1/0, X, blank)
- Dates: Excel date number support, reasonable date range validation

#### Cross-Reference Validation
- Drawing existence in project database
- Duplicate weld ID detection (within file and against existing data)
- Test package format consistency

#### Business Rule Validation
- Dates not in future (with reasonable tolerance)
- Pressure ranges within industrial standards
- PMI/PWHT consistency checks
- Drawing inheritance validation for test pressure and spec codes

## Usage

### Basic Validation

```typescript
import { createFieldWeldValidator } from './field-weld-validator.js';

// Create validator instance
const validator = await createFieldWeldValidator(
  'project-id',
  'organization-id', 
  'user-id',
  {
    maxRows: 20000,
    strictMode: true
  }
);

// Validate field weld data
const report = await validator.validateFieldWelds(parsedRows);

if (report.isValid) {
  console.log(`✓ ${report.summary.validRows} field welds ready for import`);
} else {
  console.log(`✗ ${report.summary.errorCount} errors need to be fixed`);
}
```

### Integration Workflow

```typescript
import { EnhancedFieldWeldImportWorkflow } from './field-weld-validation-integration.js';

const workflow = new EnhancedFieldWeldImportWorkflow(context);

// Quick validation check
const quickCheck = await workflow.performDryRunValidation(buffer, filename);

if (!quickCheck.canProceed) {
  return { error: 'Validation failed', issues: quickCheck.criticalIssues };
}

// Full validation with detailed report
const result = await workflow.validateFieldWeldImport(buffer, filename, {
  generateCsvReport: true,
  strictMode: true
});

// Generate UI-friendly summary
const summary = workflow.generateValidationSummary(result.validationReport);
```

### CSV Report Export

```typescript
// Generate detailed validation report in CSV format
const csvReport = await validator.exportValidationReport(report);

// CSV contains: Row, Field, Category, Code, Error, Value, Recommendation
// Example:
// Row,Field,Category,Code,Error,Value,Recommendation
// 5,testPressure,error,NEGATIVE_PRESSURE,"Test pressure cannot be negative",-100,"Enter a positive pressure value or leave blank"
```

## Validation Report Structure

```typescript
interface FieldWeldValidationReport {
  isValid: boolean;
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
  };
  errors: FieldWeldValidationError[];
  warnings: FieldWeldValidationError[];
  infos: FieldWeldValidationError[];
  validRows: FieldWeldImportData[];
  invalidRows: any[];
  duplicateWeldIds: string[];
  missingDrawings: string[];
  inheritanceApplied: {
    testPressure: number;
    specCode: number;
  };
  recommendations: string[];
}
```

## Error Codes Reference

### Critical Errors (Prevent Import)
- `DUPLICATE_EXISTING_WELD`: Weld ID already exists in database
- `DUPLICATE_IN_FILE`: Duplicate weld ID within import file
- `DRAWING_NOT_FOUND`: Drawing number not found in project (strict mode)
- `NEGATIVE_PRESSURE`: Test pressure is negative
- `SCHEMA_*`: Schema validation failures (missing required fields, wrong types)

### Warnings (Data Quality Issues)
- `WELD_ID_SPECIAL_CHARS`: Weld ID contains special characters
- `WELD_ID_HIGH_NUMBER`: Sequential weld ID number is very high
- `PRESSURE_VERY_HIGH`: Test pressure > 15,000 PSI
- `PRESSURE_HIGH`: Test pressure > 10,000 PSI
- `PRESSURE_LOW`: Test pressure < 50 PSI
- `DATE_FUTURE`: PMI date more than 1 year in future
- `DATE_OLD`: PMI date more than 2 years in past
- `PMI_REQUIRED_NO_DATE`: PMI required but no completion date
- `PMI_DATE_NOT_REQUIRED`: PMI date provided but not marked required
- `INHERITED_TEST_PRESSURE`: Test pressure inherited from drawing
- `INHERITED_SPEC_CODE`: Spec code inherited from drawing

## Column Mapping (WELD LOG Format)

Based on real WELD LOG.xlsx analysis, the validator supports these column mappings:

| Column | Field | Description | Required |
|--------|-------|-------------|----------|
| A | weldIdNumber | Weld ID Number | ✓ |
| B | welderStencil | Welder Stencil | |
| D | drawingNumber | Drawing/Isometric Number | ✓ |
| F | testPackageNumber | Package Number | |
| G | testPressure | Test Pressure | |
| J | specCode | SPEC Code | |
| R | pmiRequired | PMI Required (Boolean) | |
| S | pwhtRequired | PWHT Required (Boolean) | |
| Y | pmiCompleteDate | PMI Complete Date | |
| AA | comments | Comments/Notes | |

Additional optional fields:
- I: weldSize (Common: 1", 3", etc.)
- T: xrayPercentage (5%, 10%, etc.)
- U: weldType (Butt Joint, etc.)

## Performance Considerations

### Batch Processing
- Processes files in 5,000-row batches
- Optimized for up to 20,000 rows
- Memory-efficient handling of large datasets

### Drawing Inheritance Cache
- Pre-loads drawing data for the project
- Applies inheritance for missing test pressure and spec codes
- Tracks inheritance statistics for reporting

### Validation Stages
- **FORMAT_CHECK**: Basic file format validation
- **PREVIEW_VALIDATION**: Quick validation for UI preview
- **FULL_IMPORT_VALIDATION**: Comprehensive validation before import

## Best Practices

### File Preparation
1. Ensure Column A contains unique weld IDs
2. Verify Column D drawing numbers exist in project
3. Use consistent boolean formats (Yes/No recommended)
4. Provide test pressure or ensure drawings have pressure data
5. Keep file size under 100MB and rows under 20,000

### Error Resolution
1. Download CSV validation report for detailed error analysis
2. Fix critical errors first (duplicates, missing drawings, negative values)
3. Review warnings for data quality improvements
4. Use drawing inheritance when appropriate
5. Validate in preview mode before full import

### Integration Tips
- Use dry-run validation for quick checks
- Generate UI summaries for user-friendly feedback
- Export CSV reports for detailed error analysis
- Process large files in off-peak hours
- Monitor performance with batch processing

## Testing

The validator includes comprehensive tests covering:
- Schema validation with various data types
- Business rule validation
- Drawing inheritance logic
- Duplicate detection
- Performance testing with large datasets
- CSV report generation
- Real-world integration scenarios

Run tests with:
```bash
npm test field-weld-validator
```

## API Integration Example

```typescript
// API endpoint example
export async function validateFieldWeldFile(req: Request) {
  const { buffer, filename, projectId, organizationId, userId } = req.body;
  
  try {
    const context = {
      projectId,
      organizationId,
      userId,
      validationStage: ValidationStage.PREVIEW_VALIDATION
    };
    
    const workflow = new EnhancedFieldWeldImportWorkflow(context);
    const result = await workflow.performDryRunValidation(buffer, filename);
    
    return {
      success: result.canProceed,
      summary: result.summary,
      recommendations: result.recommendations,
      criticalIssues: result.criticalIssues.slice(0, 10), // Limit for UI
      warnings: result.warnings.slice(0, 10)
    };
    
  } catch (error) {
    return {
      success: false,
      error: 'Validation failed',
      message: error.message
    };
  }
}
```

This validation engine provides production-ready field weld import validation with comprehensive error reporting, performance optimization, and seamless integration with the existing PipeTrak import system.