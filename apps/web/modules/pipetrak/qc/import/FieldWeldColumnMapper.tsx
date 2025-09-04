"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { Alert, AlertDescription } from "@ui/components/alert";
import { 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Table2,
  Eye
} from "lucide-react";
import { cn } from "@ui/lib";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ui/components/table";
import { ScrollArea } from "@ui/components/scroll-area";

interface FieldWeldColumnMapperProps {
  /** Parsed Excel file data with headers and sample rows */
  parsedData: {
    headers: string[];
    rows: any[];
    metadata?: {
      filename?: string;
      totalRows?: number;
      totalColumns?: number;
    };
  };
  /** Current column mappings */
  mappings: Record<string, string>;
  /** Callback when mappings change */
  onMappingChange: (mappings: Record<string, string>) => void;
  /** Callback to proceed to next step */
  onContinue: () => void;
  /** Callback to go back */
  onBack: () => void;
  /** Validation results from the processor */
  validationResults?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}

/**
 * WELD LOG column mapping based on FieldWeldProcessor
 * Maps Excel column positions (A-AA) to field names
 */
const WELD_LOG_COLUMN_MAPPING = {
  'A': { field: 'weldIdNumber', label: 'Weld ID Number', required: true },
  'B': { field: 'welderStencil', label: 'Welder Stencil', required: false },
  'C': { field: '', label: 'Column C', required: false },
  'D': { field: 'drawingNumber', label: 'Drawing Number', required: true },
  'E': { field: '', label: 'Column E', required: false },
  'F': { field: 'testPackageNumber', label: 'Test Package Number', required: false },
  'G': { field: 'testPressure', label: 'Test Pressure', required: false },
  'H': { field: '', label: 'Column H', required: false },
  'I': { field: 'weldSize', label: 'Weld Size', required: false },
  'J': { field: 'specCode', label: 'Spec Code', required: false },
  'K': { field: '', label: 'Column K', required: false },
  'L': { field: '', label: 'Column L', required: false },
  'M': { field: '', label: 'Column M', required: false },
  'N': { field: '', label: 'Column N', required: false },
  'O': { field: '', label: 'Column O', required: false },
  'P': { field: '', label: 'Column P', required: false },
  'Q': { field: '', label: 'Column Q', required: false },
  'R': { field: 'pmiRequired', label: 'PMI Required', required: false },
  'S': { field: 'pwhtRequired', label: 'PWHT Required', required: false },
  'T': { field: 'xrayPercentage', label: 'X-ray Percentage', required: false },
  'U': { field: 'weldType', label: 'Weld Type', required: false },
  'V': { field: '', label: 'Column V', required: false },
  'W': { field: '', label: 'Column W', required: false },
  'X': { field: '', label: 'Column X', required: false },
  'Y': { field: 'pmiCompleteDate', label: 'PMI Complete Date', required: false },
  'Z': { field: '', label: 'Column Z', required: false },
  'AA': { field: 'comments', label: 'Comments', required: false },
} as const;

/**
 * Available field options for mapping
 */
const FIELD_OPTIONS = [
  { value: '', label: '-- Not Mapped --' },
  { value: 'weldIdNumber', label: 'Weld ID Number', required: true },
  { value: 'drawingNumber', label: 'Drawing Number', required: true },
  { value: 'welderStencil', label: 'Welder Stencil' },
  { value: 'testPackageNumber', label: 'Test Package Number' },
  { value: 'testPressure', label: 'Test Pressure' },
  { value: 'specCode', label: 'Spec Code' },
  { value: 'weldSize', label: 'Weld Size' },
  { value: 'pmiRequired', label: 'PMI Required (Boolean)' },
  { value: 'pwhtRequired', label: 'PWHT Required (Boolean)' },
  { value: 'xrayPercentage', label: 'X-ray Percentage' },
  { value: 'weldType', label: 'Weld Type' },
  { value: 'pmiCompleteDate', label: 'PMI Complete Date' },
  { value: 'comments', label: 'Comments' },
] as const;

export function FieldWeldColumnMapper({ 
  parsedData, 
  mappings, 
  onMappingChange,
  onContinue, 
  onBack,
  validationResults 
}: FieldWeldColumnMapperProps) {
  const [autoMappedColumns, setAutoMappedColumns] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(true);

  // Convert column index to Excel column letter
  const getColumnLetter = (index: number): string => {
    if (index < 26) {
      return String.fromCharCode(65 + index); // A-Z
    }
    if (index === 26) {
      return 'AA';
    }
    throw new Error(`Column index ${index} exceeds supported range (A-AA)`);
  };

  // Auto-map columns based on headers and position
  useEffect(() => {
    const autoMappings: Record<string, string> = { ...mappings };
    const mapped = new Set<string>();

    parsedData.headers.forEach((header, index) => {
      if (index >= 27) return; // Only handle A-AA columns
      
      const columnLetter = getColumnLetter(index);
      const expectedMapping = WELD_LOG_COLUMN_MAPPING[columnLetter as keyof typeof WELD_LOG_COLUMN_MAPPING];
      
      // If position-based mapping has a field defined and not already mapped
      if (expectedMapping.field && !Object.values(autoMappings).includes(expectedMapping.field)) {
        const headerLower = header.toLowerCase().trim();
        const expectedField = expectedMapping.field;
        
        // Auto-map based on position and header content validation
        let shouldAutoMap = false;
        
        switch (expectedField) {
          case 'weldIdNumber':
            shouldAutoMap = columnLetter === 'A' && (
              headerLower.includes('weld') && headerLower.includes('id') ||
              headerLower.includes('weld') && headerLower.includes('number') ||
              headerLower.includes('id') && headerLower.includes('number')
            );
            break;
          case 'drawingNumber':
            shouldAutoMap = columnLetter === 'D' && (
              headerLower.includes('drawing') ||
              headerLower.includes('isometric') ||
              headerLower.includes('dwg')
            );
            break;
          case 'welderStencil':
            shouldAutoMap = columnLetter === 'B' && (
              headerLower.includes('welder') ||
              headerLower.includes('stencil')
            );
            break;
          case 'testPackageNumber':
            shouldAutoMap = columnLetter === 'F' && (
              headerLower.includes('package') ||
              headerLower.includes('test') && headerLower.includes('package')
            );
            break;
          case 'testPressure':
            shouldAutoMap = columnLetter === 'G' && (
              headerLower.includes('pressure') ||
              headerLower.includes('test') && headerLower.includes('pressure')
            );
            break;
          case 'specCode':
            shouldAutoMap = columnLetter === 'J' && (
              headerLower.includes('spec') ||
              headerLower.includes('specification')
            );
            break;
          default:
            // For other fields, be more flexible with auto-mapping
            shouldAutoMap = headerLower.includes(expectedField.toLowerCase()) ||
              (expectedMapping.label.toLowerCase().includes(headerLower) && headerLower.length > 2);
        }
        
        if (shouldAutoMap) {
          autoMappings[columnLetter] = expectedField;
          mapped.add(columnLetter);
        }
      }
    });

    if (Object.keys(autoMappings).length !== Object.keys(mappings).length) {
      onMappingChange(autoMappings);
      setAutoMappedColumns(mapped);
    }
  }, [parsedData.headers]);

  // Validation status for each column
  const getColumnValidationStatus = (columnLetter: string): { status: 'valid' | 'warning' | 'error'; message?: string } => {
    const mapping = mappings[columnLetter];
    const expectedMapping = WELD_LOG_COLUMN_MAPPING[columnLetter as keyof typeof WELD_LOG_COLUMN_MAPPING];
    
    if (expectedMapping.required && !mapping) {
      return { status: 'error', message: 'Required field not mapped' };
    }
    
    if (mapping && expectedMapping.field !== mapping && expectedMapping.required) {
      return { status: 'warning', message: 'Different field mapped than expected' };
    }
    
    return { status: 'valid' };
  };

  // Overall validation status
  const overallValidation = useMemo(() => {
    const requiredFields = ['weldIdNumber', 'drawingNumber'];
    const mappedFields = Object.values(mappings).filter(Boolean);
    const missingRequired = requiredFields.filter(field => !mappedFields.includes(field));
    
    return {
      isValid: missingRequired.length === 0,
      missingRequired,
      mappedCount: mappedFields.length,
      totalColumns: parsedData.headers.length
    };
  }, [mappings, parsedData.headers.length]);

  const handleColumnMappingChange = (columnLetter: string, fieldValue: string) => {
    const newMappings = { ...mappings };
    
    // Remove any existing mapping to this field value
    Object.keys(newMappings).forEach(key => {
      if (newMappings[key] === fieldValue && key !== columnLetter) {
        delete newMappings[key];
      }
    });
    
    // Set new mapping or remove if empty
    if (fieldValue) {
      newMappings[columnLetter] = fieldValue;
    } else {
      delete newMappings[columnLetter];
    }
    
    onMappingChange(newMappings);
  };

  // Get first 10 rows for preview
  const previewRows = parsedData.rows.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* File Info Header */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="h-6 w-6 text-primary" />
          <div>
            <p className="font-medium">{parsedData.metadata?.filename || 'WELD LOG.xlsx'}</p>
            <p className="text-sm text-muted-foreground">
              {parsedData.headers.length} columns • {parsedData.metadata?.totalRows || parsedData.rows.length} rows
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {autoMappedColumns.size > 0 && (
            <Badge status="info" className="gap-1">
              <Sparkles className="h-3 w-3" />
              {autoMappedColumns.size} auto-mapped
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
        </div>
      </div>

      {/* Column Mapping Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Table2 className="h-5 w-5" />
            Column Mapping
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Map Excel columns (A-AA) to field weld data fields. Required fields are highlighted.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Required Fields Alert */}
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription>
                <strong>Required Fields:</strong> Weld ID (Column A) and Drawing Number (Column D) must be mapped for successful import.
              </AlertDescription>
            </Alert>

            {/* Mapping Grid3x3 */}
            <div className="grid gap-3">
              <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                <div>Excel Column</div>
                <div>Header</div>
                <div>Mapped Field</div>
                <div>Status</div>
              </div>
              
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {parsedData.headers.slice(0, 27).map((header, index) => {
                    const columnLetter = getColumnLetter(index);
                    const expectedMapping = WELD_LOG_COLUMN_MAPPING[columnLetter as keyof typeof WELD_LOG_COLUMN_MAPPING];
                    const validationStatus = getColumnValidationStatus(columnLetter);
                    const currentMapping = mappings[columnLetter] || '';
                    const isAutoMapped = autoMappedColumns.has(columnLetter);
                    
                    return (
                      <div key={columnLetter} className="grid grid-cols-4 gap-4 items-center p-2 rounded-lg hover:bg-muted/50">
                        {/* Column Letter */}
                        <div className="font-mono font-medium">
                          {columnLetter}
                          {expectedMapping.required && (
                            <Badge status="error" className="ml-2 text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        
                        {/* Header */}
                        <div className="text-sm">
                          <p className="truncate" title={header}>{header}</p>
                          {expectedMapping.field && (
                            <p className="text-xs text-muted-foreground">
                              Expected: {expectedMapping.label}
                            </p>
                          )}
                        </div>
                        
                        {/* Field Mapping */}
                        <div>
                          <Select
                            value={currentMapping}
                            onValueChange={(value) => handleColumnMappingChange(columnLetter, value)}
                          >
                            <SelectTrigger className={cn(
                              "w-full",
                              validationStatus.status === 'error' && "border-destructive",
                              validationStatus.status === 'warning' && "border-orange-400"
                            )}>
                              <SelectValue placeholder="Select field" />
                            </SelectTrigger>
                            <SelectContent>
                              {FIELD_OPTIONS.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex items-center gap-2">
                                    {option.required && (
                                      <span className="text-destructive">*</span>
                                    )}
                                    {option.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Status */}
                        <div className="flex items-center gap-2">
                          {validationStatus.status === 'valid' && currentMapping && (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              {isAutoMapped && (
                                <Badge status="info" className="text-xs gap-1">
                                  <Sparkles className="h-2 w-2" />
                                  Auto
                                </Badge>
                              )}
                            </div>
                          )}
                          {validationStatus.status === 'warning' && (
                            <AlertTriangle className="h-4 w-4 text-orange-500" title={validationStatus.message} />
                          )}
                          {validationStatus.status === 'error' && (
                            <AlertCircle className="h-4 w-4 text-destructive" title={validationStatus.message} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Section */}
      {showPreview && previewRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Data Preview (First 10 Rows)
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Preview of how your data will be imported with current mappings
            </p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <div className="min-w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      {Object.entries(mappings).map(([columnLetter, fieldName]) => (
                        <TableHead key={columnLetter} className="min-w-32">
                          <div className="space-y-1">
                            <div className="font-medium">{fieldName}</div>
                            <div className="text-xs text-muted-foreground">Column {columnLetter}</div>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-sm">{index + 1}</TableCell>
                        {Object.entries(mappings).map(([columnLetter, fieldName]) => {
                          const columnIndex = columnLetter === 'AA' ? 26 : columnLetter.charCodeAt(0) - 65;
                          const header = parsedData.headers[columnIndex];
                          const value = row[header];
                          
                          return (
                            <TableCell key={columnLetter} className="max-w-40">
                              <div className="truncate" title={String(value || '')}>
                                {value || <span className="text-muted-foreground">—</span>}
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Validation Results */}
      {validationResults && !validationResults.isValid && (
        <Alert variant="error">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div><strong>Validation Errors:</strong></div>
              <ul className="list-disc list-inside space-y-1">
                {validationResults.errors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Overall Status */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {overallValidation.isValid ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-destructive" />
            )}
            <span className="font-medium">
              {overallValidation.isValid ? 'Ready for Import' : 'Mapping Required'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {overallValidation.mappedCount} of {overallValidation.totalColumns} columns mapped
            {!overallValidation.isValid && overallValidation.missingRequired.length > 0 && (
              <span className="text-destructive">
                • Missing: {overallValidation.missingRequired.join(', ')}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={onContinue}
          disabled={!overallValidation.isValid}
          className="gap-2"
        >
          Continue to Validation
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}