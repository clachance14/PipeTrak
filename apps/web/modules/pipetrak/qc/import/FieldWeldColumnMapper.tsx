"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { Alert, AlertDescription } from "@ui/components/alert";
import {
  FileSpreadsheet,
  AlertCircle,
  Check,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Eye,
  Settings,
  MapPin
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
import {
  autoDetectColumns,
  getFieldDisplayName,
  validateDetectionResult,
  generateMappingSummary,
  ESSENTIAL_FIELDS,
  HIGH_PRIORITY_FIELDS,
  type ColumnDetectionResult,
  type ColumnMappings,
} from "@repo/api";

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
  /** Current column mappings (index -> field) */
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
 * Available field options for manual mapping
 */
const FIELD_OPTIONS = [
  { value: '', label: '-- Not Mapped --' },
  { value: 'weldIdNumber', label: 'Weld ID Number', essential: true },
  { value: 'drawingNumber', label: 'Drawing Number', essential: true },
  { value: 'specCode', label: 'Spec Code', priority: true },
  { value: 'xrayPercentage', label: 'X-Ray Percentage', priority: true },
  { value: 'weldSize', label: 'Weld Size', priority: true },
  { value: 'schedule', label: 'Schedule', priority: true },
  { value: 'weldType', label: 'Weld Type', priority: true },
  { value: 'baseMetal', label: 'Base Metal', priority: true },
  { value: 'welderStencil', label: 'Welder Stencil' },
  { value: 'testPackageNumber', label: 'Test Package Number' },
  { value: 'testPressure', label: 'Test Pressure' },
  { value: 'pmiRequired', label: 'PMI Required (Boolean)' },
  { value: 'pwhtRequired', label: 'PWHT Required (Boolean)' },
  { value: 'pmiCompleteDate', label: 'PMI Complete Date' },
  { value: 'dateWelded', label: 'Date Welded' },
  { value: 'comments', label: 'Comments' },
] as const;

const convertMappingsToDetectionFormat = (mappings: Record<string, string>): ColumnMappings => {
  const result: ColumnMappings = {};
  Object.entries(mappings).forEach(([indexStr, field]) => {
    if (field) {
      result[Number(indexStr)] = field;
    }
  });
  return result;
};

const convertDetectionToMappingsFormat = (
  detectionMappings: ColumnMappings,
): Record<string, string> => {
  const result: Record<string, string> = {};
  Object.entries(detectionMappings).forEach(([indexStr, field]) => {
    result[indexStr] = field;
  });
  return result;
};

export function FieldWeldColumnMapper({
  parsedData,
  mappings,
  onMappingChange,
  onContinue,
  onBack,
  validationResults
}: FieldWeldColumnMapperProps) {
  const [detectionResult, setDetectionResult] = useState<ColumnDetectionResult | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [manualOverrides, setManualOverrides] = useState<Set<number>>(new Set());
  const hasInitialMappingsRef = useRef(Object.values(mappings).some(Boolean));

  useEffect(() => {
    hasInitialMappingsRef.current = Object.values(mappings).some(Boolean);
  }, [mappings]);

  // Auto-detect columns on first load
  useEffect(() => {
    if (parsedData.headers.length > 0) {
      const result = autoDetectColumns(parsedData.headers);
      setDetectionResult(result);

      // Only auto-apply if we don't have existing mappings
      if (!hasInitialMappingsRef.current) {
        const newMappings = convertDetectionToMappingsFormat(result.mappings);
        onMappingChange(newMappings);
      }
    }
  }, [onMappingChange, parsedData.headers]);

  // Update detection result when mappings change manually
  useEffect(() => {
    if (detectionResult && Object.keys(mappings).length > 0) {
      const updatedMappings = convertMappingsToDetectionFormat(mappings);
      const updatedResult = {
        ...detectionResult,
        mappings: updatedMappings,
      };
      setDetectionResult(updatedResult);
    }
  }, [detectionResult, mappings]);

  // Validation status
  const validationStatus = useMemo(() => {
    if (!detectionResult) return null;
    return validateDetectionResult(detectionResult);
  }, [detectionResult]);

  // Mapping summary
  const mappingSummary = useMemo(() => {
    if (!detectionResult) return null;
    return generateMappingSummary(detectionResult, parsedData.headers);
  }, [detectionResult, parsedData.headers]);

  const handleColumnMappingChange = (columnIndex: number, fieldValue: string) => {
    const newMappings = { ...mappings };

    // Remove any existing mapping to this field value
    Object.keys(newMappings).forEach(key => {
      if (newMappings[key] === fieldValue && Number(key) !== columnIndex) {
        delete newMappings[key];
      }
    });

    // Set new mapping or remove if empty
    if (fieldValue) {
      newMappings[columnIndex.toString()] = fieldValue;
      setManualOverrides(prev => new Set([...prev, columnIndex]));
    } else {
      delete newMappings[columnIndex.toString()];
      setManualOverrides(prev => {
        const newSet = new Set(prev);
        newSet.delete(columnIndex);
        return newSet;
      });
    }

    onMappingChange(newMappings);
  };

  const getColumnLetter = (index: number): string => {
    let columnIndex = index;
    let result = "";

    while (columnIndex >= 0) {
      const remainder = columnIndex % 26;
      result = String.fromCharCode(65 + remainder) + result;
      columnIndex = Math.floor(columnIndex / 26) - 1;
    }

    return result;
  };

  const getFieldPriority = (field: string): 'essential' | 'priority' | 'optional' => {
    if (ESSENTIAL_FIELDS.includes(field as any)) return 'essential';
    if (HIGH_PRIORITY_FIELDS.includes(field as any)) return 'priority';
    return 'optional';
  };

  const isFieldMapped = (field: string): boolean => {
    return Object.values(mappings).includes(field);
  };

  // Get first 10 rows for preview
  const previewRows = parsedData.rows.slice(0, 10);

  if (!detectionResult) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-2">
          <Settings className="h-8 w-8 animate-pulse text-primary mx-auto" />
          <p className="text-muted-foreground">Analyzing column headers...</p>
        </div>
      </div>
    );
  }

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
          <Badge status="info" className="gap-1">
            <Settings className="h-3 w-3" />
            Smart Detection
          </Badge>
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

      {/* Auto-Detection Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Auto-Detection Results
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Smart column detection found {mappingSummary?.mapped.length || 0} matching fields
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Validation Status */}
            {validationStatus && (
              <Alert
                className={cn(
                  "border-2",
                  validationStatus.status === 'ready' && "border-green-200 bg-green-50",
                  validationStatus.status === 'warning' && "border-orange-200 bg-orange-50",
                  validationStatus.status === 'error' && "border-red-200 bg-red-50"
                )}
              >
                {validationStatus.status === 'ready' && <Check className="h-4 w-4 text-green-600" />}
                {validationStatus.status === 'warning' && <AlertTriangle className="h-4 w-4 text-orange-600" />}
                {validationStatus.status === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">{validationStatus.message}</p>
                    {validationStatus.recommendations.length > 0 && (
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {validationStatus.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Field Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-700">
                  {detectionResult.essentialFields.found.length}
                </div>
                <div className="text-sm text-green-600">Essential Fields</div>
                <div className="text-xs text-muted-foreground">
                  of {ESSENTIAL_FIELDS.length} required
                </div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-700">
                  {detectionResult.optionalFields.found.length}
                </div>
                <div className="text-sm text-blue-600">Optional Fields</div>
                <div className="text-xs text-muted-foreground">additional data</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-gray-700">
                  {mappingSummary?.unmapped.length || 0}
                </div>
                <div className="text-sm text-gray-600">Unmapped</div>
                <div className="text-xs text-muted-foreground">will be skipped</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Column Mapping Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Column Mapping
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Review and adjust the automatically detected field mappings below
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Mapping Grid */}
            <div className="grid gap-3">
              <div className="grid grid-cols-5 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                <div>Column</div>
                <div>Header</div>
                <div>Mapped Field</div>
                <div>Priority</div>
                <div>Status</div>
              </div>

              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {parsedData.headers.map((header, index) => {
                    const columnLetter = getColumnLetter(index);
                    const currentMapping = mappings[index.toString()] || '';
                    const priority = currentMapping ? getFieldPriority(currentMapping) : 'optional';
                    const isManualOverride = manualOverrides.has(index);
                    const isAutoDetected = !isManualOverride && currentMapping;

                    return (
                      <div key={index} className="grid grid-cols-5 gap-4 items-center p-3 rounded-lg hover:bg-muted/50 border">
                        {/* Column Letter/Number */}
                        <div className="font-mono font-medium text-sm">
                          {columnLetter}
                        </div>

                        {/* Header */}
                        <div className="text-sm">
                          <p className="truncate font-medium" title={header}>{header}</p>
                          {currentMapping && (
                            <p className="text-xs text-muted-foreground">
                              Maps to: {getFieldDisplayName(currentMapping)}
                            </p>
                          )}
                        </div>

                        {/* Field Mapping */}
                        <div>
                          <Select
                            value={currentMapping}
                            onValueChange={(value) => handleColumnMappingChange(index, value)}
                          >
                            <SelectTrigger className={cn(
                              "w-full",
                              priority === 'essential' && currentMapping && "border-green-400 bg-green-50",
                              priority === 'priority' && currentMapping && "border-blue-400 bg-blue-50"
                            )}>
                              <SelectValue placeholder="Select field" />
                            </SelectTrigger>
                            <SelectContent>
                              {FIELD_OPTIONS.map(option => {
                                const isAlreadyMapped = Boolean(option.value && isFieldMapped(option.value) && currentMapping !== option.value);
                                return (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                    disabled={isAlreadyMapped}
                                  >
                                    <div className="flex items-center gap-2">
                                      {"essential" in option && option.essential && (
                                        <span className="text-red-500 font-bold">*</span>
                                      )}
                                      {"priority" in option && option.priority && !("essential" in option && option.essential) && (
                                        <span className="text-blue-500">•</span>
                                      )}
                                      <span className={cn(isAlreadyMapped && "text-muted-foreground")}>
                                        {option.label}
                                      </span>
                                      {isAlreadyMapped && (
                                        <span className="text-xs text-muted-foreground">(mapped)</span>
                                      )}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Priority Badge */}
                        <div>
                          {priority === 'essential' && (
                            <Badge status="error" className="text-xs">Essential</Badge>
                          )}
                          {priority === 'priority' && (
                            <Badge status="warning" className="text-xs">Priority</Badge>
                          )}
                          {priority === 'optional' && currentMapping && (
                            <Badge status="info" className="text-xs">Optional</Badge>
                          )}
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-2">
                          {currentMapping && (
                            <div className="flex items-center gap-1">
                              <Check className="h-4 w-4 text-green-600" />
                              {isAutoDetected && (
                                <Badge status="info" className="text-xs gap-1">
                                  <Settings className="h-2 w-2" />
                                  Auto
                                </Badge>
                              )}
                              {isManualOverride && (
                                <Badge status="default" className="text-xs">
                                  Manual
                                </Badge>
                              )}
                            </div>
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
                      {Object.entries(mappings)
                        .filter(([_, fieldName]) => fieldName)
                        .map(([columnIndex, fieldName]) => (
                        <TableHead key={columnIndex} className="min-w-32">
                          <div className="space-y-1">
                            <div className="font-medium">{getFieldDisplayName(fieldName)}</div>
                            <div className="text-xs text-muted-foreground">
                              Col {getColumnLetter(Number(columnIndex))}
                            </div>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-sm">{index + 1}</TableCell>
                        {Object.entries(mappings)
                          .filter(([_, fieldName]) => fieldName)
                          .map(([columnIndex, _fieldName]) => {
                          const header = parsedData.headers[Number(columnIndex)];
                          const value = row[header];

                          return (
                            <TableCell key={columnIndex} className="max-w-40">
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
            {validationStatus?.canProceed ? (
              <Check className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-destructive" />
            )}
            <span className="font-medium">
              {validationStatus?.canProceed ? 'Ready for Import' : 'Mapping Required'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {mappingSummary?.summary}
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
          disabled={!validationStatus?.canProceed}
          className="gap-2"
        >
          Continue to Validation
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
