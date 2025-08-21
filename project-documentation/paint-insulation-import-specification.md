# Paint & Insulation Import System Specification

## Overview

This document defines the complete import system enhancements required to support specification-driven Paint and Insulation tracking. The import system must automatically detect, validate, and process paint/insulation specifications to create appropriate progress tracking records.

**Key Objectives:**
- Auto-detect paint and insulation specification columns
- Validate specification values and handle edge cases
- Create progress tracking records only for valid specifications
- Maintain backward compatibility with existing import workflows
- Provide clear feedback on specification processing results

## Column Detection and Mapping

### 1. Paint Specification Mapping

**Target Field:** `Component.paintSpec`

**Auto-Detection Patterns:**

```typescript
const PAINT_SPEC_MAPPINGS = [
  // Primary patterns (exact matches preferred)
  'paint_spec', 'paint_specification', 'paint_class', 'paint_code',
  'coating_spec', 'coating_specification', 'coating_class', 'coating_code',
  'primer_spec', 'primer_specification',
  
  // Secondary patterns (fuzzy matching)
  'paint', 'coating', 'primer', 'finish', 
  'protective_coating', 'surface_treatment',
  
  // Common variations
  'paint_type', 'coating_type', 'paint_system', 'coating_system',
  'spec_paint', 'spec_coating', 'paint_std', 'coating_std'
];
```

**Column Header Examples:**
- ✅ "Paint Spec" → `paintSpec`
- ✅ "Coating Class" → `paintSpec` 
- ✅ "Primer Code" → `paintSpec`
- ✅ "Paint Specification" → `paintSpec`
- ❌ "Paint Color" → Not mapped (too specific)

### 2. Insulation Specification Mapping

**Target Field:** `Component.insulationSpec`

**Auto-Detection Patterns:**

```typescript
const INSULATION_SPEC_MAPPINGS = [
  // Primary patterns (exact matches preferred)
  'insulation_spec', 'insulation_specification', 'insulation_class', 'insulation_code',
  'insul_spec', 'insul_specification', 'insul_class', 'insul_code',
  
  // Secondary patterns (fuzzy matching)
  'insulation', 'insul', 'thermal', 'lagging',
  
  // Common variations
  'insulation_type', 'insul_type', 'thermal_spec', 'thermal_class',
  'spec_insulation', 'spec_insul', 'insulation_std', 'insul_std'
];
```

**Column Header Examples:**
- ✅ "Insulation Class" → `insulationSpec`
- ✅ "Insul Spec" → `insulationSpec`
- ✅ "Thermal Code" → `insulationSpec`
- ✅ "Insulation 1 Class" → `insulationSpec`
- ❌ "Insulation Thickness" → Not mapped (measurement, not specification)

### 3. Enhanced ColumnMapper Implementation

**Updated ColumnMapper class:**

```typescript
// Enhanced standardMappings in packages/api/src/lib/file-processing.ts
export class ColumnMapper {
  private standardMappings: Record<string, string[]> = {
    // ... existing mappings ...
    
    // NEW: Paint and Insulation specification mappings
    paintSpec: [
      // Exact specification terms
      'paint_spec', 'paint_specification', 'paint_class', 'paint_code',
      'coating_spec', 'coating_specification', 'coating_class', 'coating_code',
      'primer_spec', 'primer_specification', 'primer_class', 'primer_code',
      'finish_spec', 'finish_specification', 'finish_class', 'finish_code',
      
      // System and type terms
      'paint_system', 'coating_system', 'paint_type', 'coating_type',
      'protective_coating', 'surface_treatment', 'finish_system',
      
      // Standard and spec terms
      'paint_std', 'coating_std', 'paint_standard', 'coating_standard',
      'spec_paint', 'spec_coating', 'spec_primer', 'spec_finish'
    ],
    
    insulationSpec: [
      // Exact specification terms
      'insulation_spec', 'insulation_specification', 'insulation_class', 'insulation_code',
      'insul_spec', 'insul_specification', 'insul_class', 'insul_code',
      
      // Alternative terms
      'thermal_spec', 'thermal_specification', 'thermal_class', 'thermal_code',
      'lagging_spec', 'lagging_specification', 'lagging_class', 'lagging_code',
      
      // System and type terms
      'insulation_type', 'insul_type', 'thermal_type', 'insulation_system',
      'thermal_system', 'insul_system',
      
      // Standard and spec terms
      'insulation_std', 'insul_std', 'thermal_std', 'insulation_standard',
      'spec_insulation', 'spec_insul', 'spec_thermal'
    ]
  };

  // Enhanced similarity calculation for specification columns
  private calculateSpecificationSimilarity(str1: string, str2: string): number {
    const normalized1 = this.normalizeSpecificationHeader(str1);
    const normalized2 = this.normalizeSpecificationHeader(str2);
    
    // Exact match gets highest score
    if (normalized1 === normalized2) return 1.0;
    
    // Check for specification keywords
    const specKeywords = ['spec', 'specification', 'class', 'code', 'type', 'std', 'standard'];
    const containsSpecKeyword1 = specKeywords.some(kw => normalized1.includes(kw));
    const containsSpecKeyword2 = specKeywords.some(kw => normalized2.includes(kw));
    
    if (containsSpecKeyword1 && containsSpecKeyword2) {
      return this.calculateSimilarity(normalized1, normalized2) * 1.2; // Boost for spec columns
    }
    
    return this.calculateSimilarity(normalized1, normalized2);
  }
  
  private normalizeSpecificationHeader(header: string): string {
    return header
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }
}
```

## Specification Validation

### 1. Valid Specification Detection

**Business Rules for Valid Specifications:**

```typescript
export class SpecificationValidator {
  
  static isValidPaintSpec(value: any): boolean {
    if (!value) return false;
    
    const stringValue = String(value).trim().toUpperCase();
    
    // Invalid values that mean "no paint required"
    const invalidValues = ['', 'NONE', 'N/A', 'NA', 'NULL', 'NO', 'NOT REQUIRED', 'NR'];
    if (invalidValues.includes(stringValue)) return false;
    
    // Must have some alphanumeric content
    if (!/[A-Z0-9]/.test(stringValue)) return false;
    
    // Valid if it passes basic criteria
    return stringValue.length >= 2 && stringValue.length <= 50;
  }
  
  static isValidInsulationSpec(value: any): boolean {
    if (!value) return false;
    
    const stringValue = String(value).trim().toUpperCase();
    
    // Invalid values that mean "no insulation required"
    const invalidValues = ['', 'NONE', 'N/A', 'NA', 'NULL', 'NO', 'NOT REQUIRED', 'NR'];
    if (invalidValues.includes(stringValue)) return false;
    
    // Must have some alphanumeric content
    if (!/[A-Z0-9]/.test(stringValue)) return false;
    
    // Valid if it passes basic criteria
    return stringValue.length >= 2 && stringValue.length <= 50;
  }
  
  static normalizeSpecification(value: any): string | null {
    if (!value) return null;
    
    const stringValue = String(value).trim().toUpperCase();
    
    // Handle common "no spec" values
    const noSpecValues = ['NONE', 'N/A', 'NA', 'NULL', 'NO', 'NOT REQUIRED', 'NR', ''];
    if (noSpecValues.includes(stringValue)) return null;
    
    return stringValue;
  }
}
```

### 2. Import Validation Process

**Enhanced DataValidator class:**

```typescript
export class DataValidator {
  async validateComponentData(
    data: any[], 
    mappings: ColumnMapping[],
    validationContext?: {
      projectId: string;
      existingDrawings?: Set<string>;
      existingTemplates?: Set<string>;
    }
  ): Promise<ValidationResult> {
    
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const validRows: ComponentImportData[] = [];
    const invalidRows: any[] = [];
    const specificationStats = {
      paintSpecsFound: 0,
      insulationSpecsFound: 0,
      paintSpecsValid: 0,
      insulationSpecsValid: 0
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowErrors: ValidationError[] = [];
      
      // ... existing validation logic ...
      
      // NEW: Paint specification validation
      if (this.hasPaintSpecMapping(mappings)) {
        const paintSpecValue = this.getMappedValue(row, 'paintSpec', mappings);
        const normalizedPaintSpec = SpecificationValidator.normalizeSpecification(paintSpecValue);
        
        specificationStats.paintSpecsFound++;
        
        if (normalizedPaintSpec) {
          if (SpecificationValidator.isValidPaintSpec(normalizedPaintSpec)) {
            specificationStats.paintSpecsValid++;
            (row as any).paintSpec = normalizedPaintSpec;
          } else {
            warnings.push({
              row: i + 1,
              field: 'paintSpec',
              value: paintSpecValue,
              message: `Invalid paint specification format: "${paintSpecValue}". Will be treated as no paint required.`,
              code: 'INVALID_PAINT_SPEC'
            });
            (row as any).paintSpec = null;
          }
        } else {
          (row as any).paintSpec = null;
        }
      }
      
      // NEW: Insulation specification validation
      if (this.hasInsulationSpecMapping(mappings)) {
        const insulationSpecValue = this.getMappedValue(row, 'insulationSpec', mappings);
        const normalizedInsulationSpec = SpecificationValidator.normalizeSpecification(insulationSpecValue);
        
        specificationStats.insulationSpecsFound++;
        
        if (normalizedInsulationSpec) {
          if (SpecificationValidator.isValidInsulationSpec(normalizedInsulationSpec)) {
            specificationStats.insulationSpecsValid++;
            (row as any).insulationSpec = normalizedInsulationSpec;
          } else {
            warnings.push({
              row: i + 1,
              field: 'insulationSpec',
              value: insulationSpecValue,
              message: `Invalid insulation specification format: "${insulationSpecValue}". Will be treated as no insulation required.`,
              code: 'INVALID_INSULATION_SPEC'
            });
            (row as any).insulationSpec = null;
          }
        } else {
          (row as any).insulationSpec = null;
        }
      }
      
      // ... rest of validation logic ...
    }
    
    return {
      valid: validRows,
      invalid: invalidRows,
      errors,
      warnings,
      summary: {
        total: data.length,
        valid: validRows.length,
        invalid: invalidRows.length,
        errors: errors.length,
        warnings: warnings.length,
        specificationStats
      }
    };
  }
}
```

## Progress Record Creation

### 1. Component Creation with Specifications

**Enhanced component creation logic:**

```typescript
export class ComponentProcessor {
  
  async processValidatedComponents(
    validatedData: ComponentImportData[],
    projectId: string,
    milestoneTemplates: Map<string, any>
  ): Promise<ProcessingResult> {
    
    const results = {
      componentsCreated: 0,
      paintRecordsCreated: 0,
      insulationRecordsCreated: 0,
      errors: []
    };
    
    for (const componentData of validatedData) {
      try {
        // Create base component record
        const component = await this.createComponent(componentData, projectId, milestoneTemplates);
        results.componentsCreated++;
        
        // NEW: Create paint progress record if paint spec exists
        if (componentData.paintSpec) {
          await this.createPaintProgressRecord(component.id, componentData.paintSpec);
          results.paintRecordsCreated++;
        }
        
        // NEW: Create insulation progress record if insulation spec exists
        if (componentData.insulationSpec) {
          await this.createInsulationProgressRecord(component.id, componentData.insulationSpec);
          results.insulationRecordsCreated++;
        }
        
      } catch (error) {
        results.errors.push({
          componentId: componentData.componentId,
          error: error.message
        });
      }
    }
    
    return results;
  }
  
  private async createPaintProgressRecord(componentId: string, paintSpec: string): Promise<void> {
    await prisma.paintProgress.create({
      data: {
        componentId,
        paintSpec,
        primerComplete: false,
        finishCoatComplete: false,
        completionPercent: 0
      }
    });
  }
  
  private async createInsulationProgressRecord(componentId: string, insulationSpec: string): Promise<void> {
    await prisma.insulationProgress.create({
      data: {
        componentId,
        insulationSpec,
        insulateComplete: false,
        metalOutComplete: false,
        completionPercent: 0
      }
    });
  }
}
```

### 2. Bulk Processing Optimization

**Optimized bulk insert for large imports:**

```typescript
export class BulkComponentProcessor {
  
  async processBulkComponents(
    validatedData: ComponentImportData[],
    projectId: string
  ): Promise<BulkProcessingResult> {
    
    // Separate components by specification requirements
    const componentsData = [];
    const paintProgressData = [];
    const insulationProgressData = [];
    
    for (const data of validatedData) {
      componentsData.push(this.buildComponentData(data, projectId));
      
      if (data.paintSpec) {
        paintProgressData.push({
          componentId: data.componentId, // Will be resolved after component creation
          paintSpec: data.paintSpec,
          primerComplete: false,
          finishCoatComplete: false,
          completionPercent: 0
        });
      }
      
      if (data.insulationSpec) {
        insulationProgressData.push({
          componentId: data.componentId,
          insulationSpec: data.insulationSpec,
          insulateComplete: false,
          metalOutComplete: false,
          completionPercent: 0
        });
      }
    }
    
    // Execute bulk operations in transaction
    return await prisma.$transaction(async (tx) => {
      // Create components first
      const components = await tx.component.createMany({
        data: componentsData,
        skipDuplicates: true
      });
      
      // Create paint progress records
      if (paintProgressData.length > 0) {
        await tx.paintProgress.createMany({
          data: paintProgressData,
          skipDuplicates: true
        });
      }
      
      // Create insulation progress records
      if (insulationProgressData.length > 0) {
        await tx.insulationProgress.createMany({
          data: insulationProgressData,
          skipDuplicates: true
        });
      }
      
      return {
        componentsCreated: components.count,
        paintRecordsCreated: paintProgressData.length,
        insulationRecordsCreated: insulationProgressData.length
      };
    });
  }
}
```

## Import Templates and Examples

### 1. Enhanced CSV Template

**Updated CSV template with specification columns:**

```csv
Component ID,Type,Drawing ID,Area,System,Description,Paint Spec,Insulation Class
GSWAZ1DZZASG5331,GASKET,P-35F11,100,COOLING,Gasket spiral wound,NONE,NONE
VLSMC45D6CAST001,VALVE,P-35F12,100,COOLING,Globe valve 6 inch,EP-100,51P11C
SPOOL-001-6IN-CS,SPOOL,P-35F11,100,COOLING,6 inch carbon steel spool,EP-100,51P11C
FLANGE-WN-6IN-150,FLANGE,P-35F11,100,COOLING,Weld neck flange 6 inch,EP-200,NONE
SUPPORT-SPRING-001,SUPPORT,P-35F11,100,COOLING,Spring hanger support,PRIMER-A,NONE
```

**Column mapping results:**
- `Paint Spec` → `paintSpec`
- `Insulation Class` → `insulationSpec`

### 2. Excel Template with Validation

**Enhanced Excel template with dropdown validations:**

```typescript
export class ExcelTemplateGenerator {
  
  createEnhancedTemplate(): ExcelJS.Workbook {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Component Import');
    
    // Define headers with new specification columns
    const headers = [
      'Component ID', 'Type', 'Drawing ID', 'Area', 'System', 'Description',
      'Paint Spec', 'Insulation Class', // NEW columns
      'Size', 'Material', 'Pressure Rating'
    ];
    
    // Add headers with styling
    worksheet.addRow(headers);
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6E6FA' } };
    
    // Add data validation for specification columns
    this.addSpecificationValidation(worksheet);
    
    // Add sample data showing specification usage
    this.addSampleDataWithSpecs(worksheet);
    
    return workbook;
  }
  
  private addSpecificationValidation(worksheet: ExcelJS.Worksheet): void {
    // Paint Spec validation (column G)
    worksheet.dataValidations.add('G2:G1000', {
      type: 'list',
      allowBlank: true,
      formulae: ['"NONE,EP-100,EP-200,PRIMER-A,COATING-XYZ"'],
      showErrorMessage: true,
      errorStyle: 'warning',
      errorTitle: 'Invalid Paint Specification',
      error: 'Please select a valid paint specification or use NONE if paint is not required.'
    });
    
    // Insulation Class validation (column H)
    worksheet.dataValidations.add('H2:H1000', {
      type: 'list',
      allowBlank: true,
      formulae: ['"NONE,51P11C,MINERAL-WOOL,CERAMIC-BLANKET,FOAM-GLASS"'],
      showErrorMessage: true,
      errorStyle: 'warning',
      errorTitle: 'Invalid Insulation Specification',
      error: 'Please select a valid insulation specification or use NONE if insulation is not required.'
    });
  }
  
  private addSampleDataWithSpecs(worksheet: ExcelJS.Worksheet): void {
    const sampleData = [
      ['GASKET-001', 'GASKET', 'P-35F11', '100', 'COOLING', 'Spiral wound gasket', 'NONE', 'NONE'],
      ['VALVE-001', 'VALVE', 'P-35F12', '100', 'COOLING', 'Globe valve 6"', 'EP-100', '51P11C'],
      ['SPOOL-001', 'SPOOL', 'P-35F11', '100', 'COOLING', 'CS spool 6"', 'EP-100', '51P11C'],
      ['FLANGE-001', 'FLANGE', 'P-35F11', '100', 'COOLING', 'WN flange 6" 150#', 'EP-200', 'NONE']
    ];
    
    sampleData.forEach(row => worksheet.addRow(row));
    
    // Add notes explaining specification usage
    worksheet.addRow([]);
    worksheet.addRow(['NOTES:']);
    worksheet.addRow(['- Use NONE for components that do not require paint or insulation']);
    worksheet.addRow(['- Paint Spec: Specification code for paint/coating requirements']);
    worksheet.addRow(['- Insulation Class: Specification code for insulation requirements']);
    worksheet.addRow(['- Only components with valid specifications will be tracked for paint/insulation progress']);
  }
}
```

## Error Handling and Feedback

### 1. Import Validation Results

**Enhanced validation reporting:**

```typescript
interface ImportValidationSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: ValidationError[];
  warnings: ValidationError[];
  
  // NEW: Specification processing summary
  specificationSummary: {
    paintSpecColumns: string[];
    insulationSpecColumns: string[];
    paintSpecsFound: number;
    paintSpecsValid: number;
    insulationSpecsFound: number;
    insulationSpecsValid: number;
    componentsRequiringPaint: number;
    componentsRequiringInsulation: number;
    componentsRequiringBoth: number;
  };
}
```

### 2. Import Progress Feedback

**Real-time import feedback with specification processing:**

```typescript
export class ImportProgressTracker {
  
  emitProgress(
    importJobId: string, 
    progress: {
      stage: 'parsing' | 'validating' | 'processing_components' | 'processing_specs' | 'complete';
      percent: number;
      message: string;
      details?: any;
    }
  ): void {
    
    // Emit to real-time channel
    supabase.channel(`import_${importJobId}`)
      .send({
        type: 'progress_update',
        payload: {
          importJobId,
          ...progress,
          timestamp: new Date().toISOString()
        }
      });
  }
  
  async processWithProgress(importJobId: string, data: any[]): Promise<void> {
    
    this.emitProgress(importJobId, {
      stage: 'parsing',
      percent: 10,
      message: 'Parsing CSV data and detecting columns'
    });
    
    this.emitProgress(importJobId, {
      stage: 'validating',
      percent: 30,
      message: 'Validating component data and specifications'
    });
    
    this.emitProgress(importJobId, {
      stage: 'processing_components',
      percent: 60,
      message: 'Creating component records'
    });
    
    this.emitProgress(importJobId, {
      stage: 'processing_specs',
      percent: 80,
      message: 'Creating paint and insulation progress records'
    });
    
    this.emitProgress(importJobId, {
      stage: 'complete',
      percent: 100,
      message: 'Import completed successfully',
      details: {
        componentsCreated: 150,
        paintRecordsCreated: 89,
        insulationRecordsCreated: 67
      }
    });
  }
}
```

## Testing and Validation

### 1. Test Data Sets

**Comprehensive test scenarios:**

```typescript
const TEST_SCENARIOS = {
  
  // Scenario 1: Components with all specification types
  allSpecTypes: [
    { componentId: 'TEST-001', paintSpec: 'EP-100', insulationSpec: '51P11C' },
    { componentId: 'TEST-002', paintSpec: 'EP-200', insulationSpec: null },
    { componentId: 'TEST-003', paintSpec: null, insulationSpec: 'MINERAL-WOOL' },
    { componentId: 'TEST-004', paintSpec: null, insulationSpec: null }
  ],
  
  // Scenario 2: Edge cases and invalid values
  edgeCases: [
    { componentId: 'EDGE-001', paintSpec: 'NONE', insulationSpec: 'NONE' },
    { componentId: 'EDGE-002', paintSpec: '', insulationSpec: '' },
    { componentId: 'EDGE-003', paintSpec: 'N/A', insulationSpec: 'N/A' },
    { componentId: 'EDGE-004', paintSpec: '   ', insulationSpec: '   ' }
  ],
  
  // Scenario 3: Large volume test
  largeVolume: generateTestComponents(10000) // Mix of all specification types
};
```

### 2. Validation Test Suite

**Automated testing for specification processing:**

```typescript
describe('Paint & Insulation Import Processing', () => {
  
  test('should detect paint specification columns correctly', () => {
    const headers = ['Component ID', 'Paint Spec', 'Insulation Class', 'Type'];
    const mappings = new ColumnMapper().autoMapColumns(headers);
    
    expect(mappings.find(m => m.targetField === 'paintSpec')?.sourceColumn).toBe('Paint Spec');
    expect(mappings.find(m => m.targetField === 'insulationSpec')?.sourceColumn).toBe('Insulation Class');
  });
  
  test('should validate specifications correctly', () => {
    expect(SpecificationValidator.isValidPaintSpec('EP-100')).toBe(true);
    expect(SpecificationValidator.isValidPaintSpec('NONE')).toBe(false);
    expect(SpecificationValidator.isValidPaintSpec('')).toBe(false);
    expect(SpecificationValidator.isValidPaintSpec(null)).toBe(false);
  });
  
  test('should create progress records for valid specifications', async () => {
    const testData = [
      { componentId: 'TEST-001', paintSpec: 'EP-100', insulationSpec: '51P11C' }
    ];
    
    const result = await new ComponentProcessor().processValidatedComponents(
      testData, 'test-project-id', new Map()
    );
    
    expect(result.paintRecordsCreated).toBe(1);
    expect(result.insulationRecordsCreated).toBe(1);
  });
  
  test('should handle large imports efficiently', async () => {
    const largeDataSet = generateTestComponents(50000);
    const startTime = Date.now();
    
    const result = await new BulkComponentProcessor().processBulkComponents(
      largeDataSet, 'test-project-id'
    );
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(30000); // Should complete in under 30 seconds
    expect(result.componentsCreated).toBe(50000);
  });
});
```

---

*Document Version: 1.0*  
*Author: Import System Architect*  
*Date: 2025-08-14*  
*Status: Implementation Ready*  
*Performance Target: Process 50K components with specifications in under 30 seconds*