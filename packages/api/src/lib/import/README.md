# Import Processing System

This directory contains the import processing system for PipeTrak, designed to handle various file formats for importing component and field weld data.

## Architecture Overview

The system follows a clean abstraction pattern with:

1. **Base Processor** (`base-processor.ts`) - Abstract class defining the import pipeline
2. **Specific Processors** - Concrete implementations for different file formats
3. **Progressive Validation** - Multi-stage validation approach
4. **File Validation** - Comprehensive file format and size validation

## Base Import Processor

The `BaseImportProcessor` abstract class defines the standard pipeline:

```typescript
abstract class BaseImportProcessor<T> {
  // 1. Validate file format and detect import type
  abstract validateFormat(buffer: Buffer, filename: string): Promise<FormatValidationResult>;
  
  // 2. Parse file into structured data
  abstract parseFile(buffer: Buffer, filename: string): Promise<ParsedFileData>;
  
  // 3. Validate parsed data according to business rules
  abstract validateData(parsedData: ParsedFileData): Promise<ValidationResult>;
  
  // 4. Process validated data for database insertion
  abstract processImport(validatedData: ValidationResult): Promise<ProcessedImportData>;
}
```

### Validation Stages

The system supports three progressive validation stages:

1. **FORMAT_CHECK** - Quick format detection and basic validation
2. **PREVIEW_VALIDATION** - Lightweight validation for UI preview (first 50 rows)
3. **FULL_IMPORT_VALIDATION** - Complete validation before database insertion

## Field Weld Processor

The `FieldWeldProcessor` handles WELD LOG Excel files with the following specifications:

### File Format Requirements

- **File Type**: Excel (.xlsx, .xls)
- **File Size**: Maximum 100MB
- **Column Range**: A through AA (27 columns total)
- **Row Limit**: Up to 20,000 rows
- **Required Headers**:
  - Column A: "Weld ID Number"
  - Column D: "Drawing Number"

### Column Mapping

| Excel Column | Field Name | Required | Description |
|--------------|------------|----------|-------------|
| A | weldIdNumber | ✓ | Unique weld identifier |
| B | welderStencil | | Welder identification stencil |
| D | drawingNumber | ✓ | Drawing or isometric number |
| F | testPackageNumber | | Test package identifier |
| G | testPressure | | Test pressure (PSI) |
| J | specCode | | Specification code |
| R | pmiRequired | | PMI required (boolean) |
| S | pwhtRequired | | PWHT required (boolean) |
| Y | pmiCompleteDate | | PMI completion date |
| AA | comments | | Additional comments |

### Drawing Inheritance

The processor supports inheritance of data from drawing records:

- **Test Pressure (Column G)**: If empty, inherits from drawing data
- **Spec Code (Column J)**: If empty, inherits from drawing data

### Data Transformations

- **Boolean Fields**: Accepts "true/false", "yes/no", "1/0", "x" formats
- **Date Fields**: Automatically converts Excel date formats to JavaScript Date objects
- **Numeric Fields**: Handles strings like "150 PSI" by extracting numeric values
- **Required Field Validation**: Ensures weld ID and drawing number are present

## Usage Examples

### Basic Import Processing

```typescript
import { FieldWeldProcessor } from './field-weld-processor.js';
import { ImportContext, ValidationStage } from './base-processor.js';

const context: ImportContext = {
  projectId: 'proj-123',
  organizationId: 'org-456', 
  userId: 'user-789',
  validationStage: ValidationStage.FULL_IMPORT_VALIDATION
};

const processor = new FieldWeldProcessor(context);

// 1. Validate format
const formatResult = await processor.validateFormat(fileBuffer, filename);
if (!formatResult.isValid) {
  throw new Error(`Invalid format: ${formatResult.errors.join(', ')}`);
}

// 2. Parse file
const parsedData = await processor.parseFile(fileBuffer, filename);

// 3. Validate data
const validationResult = await processor.validateData(parsedData);

// 4. Process for import
const processedData = await processor.processImport(validationResult);
```

### Preview Mode

```typescript
const previewContext: ImportContext = {
  projectId: 'preview',
  organizationId: 'preview',
  userId: 'preview',
  validationStage: ValidationStage.FORMAT_CHECK,
  options: { maxRows: 50, strictMode: false }
};

const processor = new FieldWeldProcessor(previewContext);
const formatResult = await processor.validateFormat(fileBuffer, filename);

// Returns quick format validation for UI preview
```

## Error Handling

The system provides comprehensive error reporting:

### Validation Errors
- Row-level errors with specific field and value information
- Business rule violations
- Schema validation failures

### Format Errors
- Unsupported file types
- Missing required columns
- File size exceeded
- Corrupt file detection

### Processing Errors
- Database constraint violations
- Template assignment failures
- Instance calculation errors

## Performance Considerations

- **Batch Processing**: Processes data in configurable batches (default: 1000 rows)
- **Memory Efficient**: Streams large files without loading entire content in memory
- **Early Validation**: Fails fast on format errors before processing data
- **Chunked Operations**: Breaks large operations into smaller chunks

## File Validation

The `FileValidator` utility class provides:

- **Size Validation**: 100MB maximum file size
- **Type Validation**: Only Excel files (.xlsx, .xls)
- **Magic Byte Validation**: Verifies file signatures to prevent malicious uploads
- **Extension Validation**: Checks file extensions match MIME types

## Testing

The system includes comprehensive tests covering:

- Schema validation edge cases
- File format detection
- Data transformation logic
- Error handling scenarios
- Performance boundaries

Run tests with:
```bash
npm test packages/api/src/lib/import/__tests__/
```

## Integration Points

The processors integrate with:

- **Database Layer**: Prisma ORM for data persistence
- **File Storage**: Supabase Storage for file handling
- **Validation Layer**: Zod schemas for type safety
- **Error Reporting**: Structured error objects for frontend consumption
- **Progress Tracking**: Real-time import progress via WebSocket events

## Future Extensions

The architecture supports easy addition of new processors:

1. **Components Processor**: For standard component imports
2. **QC Data Processor**: For quality control test results
3. **Milestone Processor**: For milestone progress updates
4. **Custom Format Processor**: For client-specific formats

Each new processor extends `BaseImportProcessor` and implements the four core methods while following the established patterns for validation, error handling, and data processing.