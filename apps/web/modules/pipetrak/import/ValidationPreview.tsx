"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import { Alert, AlertDescription, AlertTitle } from "@ui/components/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { Progress } from "@ui/components/progress";
import { Checkbox } from "@ui/components/checkbox";
import { Label } from "@ui/components/label";
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
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  FileSpreadsheet,
  AlertTriangle,
  ArrowRight,
  Download
} from "lucide-react";

interface ValidationPreviewProps {
  file: File;
  mappings: Record<string, string>;
  validation: ValidationResult;
  importType: "components" | "field_welds";
  onConfirm: () => void;
  onBack: () => void;
}

interface ValidationResult {
  isValid: boolean;
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  preview: PreviewRow[];
  options?: ImportOptions;
}

interface ValidationError {
  row: number;
  field: string;
  value: any;
  message: string;
  severity: "error" | "warning";
}

interface ValidationWarning {
  row: number;
  field: string;
  message: string;
}

interface PreviewRow {
  rowNumber: number;
  data: Record<string, any>;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ImportOptions {
  skipErrors: boolean;
  updateExisting: boolean;
  createMissingDrawings: boolean;
  dryRun: boolean;
}

export function ValidationPreview({
  file,
  mappings,
  validation,
  importType,
  onConfirm,
  onBack
}: ValidationPreviewProps) {
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    skipErrors: true,
    updateExisting: true,
    createMissingDrawings: false,
    dryRun: false
  });

  const [selectedTab, setSelectedTab] = useState<"summary" | "preview" | "errors">("summary");

  // Debug logging
  React.useEffect(() => {
    console.log("ValidationPreview - importType:", importType);
    console.log("ValidationPreview - validation.preview sample data:", validation.preview.slice(0, 1));
    if (validation.preview.length > 0) {
      console.log("ValidationPreview - first row data keys:", Object.keys(validation.preview[0].data));
      console.log("ValidationPreview - first row sample data:", validation.preview[0].data);
    }
  }, [importType, validation]);

  const errorRate = validation.totalRows > 0 
    ? ((validation.errorRows / validation.totalRows) * 100).toFixed(1)
    : "0";

  const successRate = validation.totalRows > 0
    ? ((validation.validRows / validation.totalRows) * 100).toFixed(1)
    : "0";

  const canImport = validation.isValid || (importOptions.skipErrors && validation.validRows > 0);

  const handleOptionChange = (option: keyof ImportOptions) => {
    setImportOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const downloadErrorReport = () => {
    // Create CSV content
    const headers = ["Row", "Field", "Value", "Error Message"];
    const rows = validation.errors.map(error => [
      error.row,
      error.field,
      error.value || "",
      error.message
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    // Download file
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `import-errors-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Rows</p>
                <p className="text-2xl font-bold">{validation.totalRows}</p>
              </div>
              <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valid Rows</p>
                <p className="text-2xl font-bold text-green-600">{validation.validRows}</p>
                <p className="text-xs text-muted-foreground">{successRate}%</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold text-orange-600">{validation.warningRows}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Errors</p>
                <p className="text-2xl font-bold text-red-600">{validation.errorRows}</p>
                <p className="text-xs text-muted-foreground">{errorRate}%</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Validation Status Alert */}
      {validation.isValid ? (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-900">Validation Successful</AlertTitle>
          <AlertDescription className="text-green-700">
            All {validation.totalRows} rows passed validation and are ready to import.
          </AlertDescription>
        </Alert>
      ) : validation.validRows > 0 ? (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-900">Partial Validation</AlertTitle>
          <AlertDescription className="text-orange-700">
            {validation.validRows} of {validation.totalRows} rows are valid. 
            You can skip error rows and import valid data only.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Validation Failed</AlertTitle>
          <AlertDescription>
            No valid rows found. Please review the errors and fix your data.
          </AlertDescription>
        </Alert>
      )}

      {/* Content Tabs */}
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="preview">
            Preview 
            <Badge variant="secondary" className="ml-2">
              {Math.min(10, validation.preview.length)}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="errors">
            Errors
            {validation.errors.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {validation.errors.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Options</CardTitle>
              <CardDescription>
                Configure how the import should handle various scenarios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="skipErrors"
                  checked={importOptions.skipErrors}
                  onCheckedChange={() => handleOptionChange("skipErrors")}
                />
                <Label htmlFor="skipErrors" className="cursor-pointer">
                  Skip rows with errors and import valid rows only
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="updateExisting"
                  checked={importOptions.updateExisting}
                  onCheckedChange={() => handleOptionChange("updateExisting")}
                />
                <Label htmlFor="updateExisting" className="cursor-pointer">
                  Update existing components if found
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="createMissingDrawings"
                  checked={importOptions.createMissingDrawings}
                  onCheckedChange={() => handleOptionChange("createMissingDrawings")}
                />
                <Label htmlFor="createMissingDrawings" className="cursor-pointer">
                  Automatically create missing drawing references
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dryRun"
                  checked={importOptions.dryRun}
                  onCheckedChange={() => handleOptionChange("dryRun")}
                />
                <Label htmlFor="dryRun" className="cursor-pointer">
                  Dry run (preview only, don't actually import)
                </Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Data Preview</CardTitle>
              <CardDescription>
                First 10 rows of your import data after mapping
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Row</TableHead>
                      {importType === "field_welds" ? (
                        <>
                          <TableHead>Weld ID</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Drawing ID</TableHead>
                          <TableHead>Weld Size</TableHead>
                          <TableHead>Schedule</TableHead>
                          <TableHead>Base Metal</TableHead>
                          <TableHead>X-ray %</TableHead>
                          <TableHead>PWHT</TableHead>
                          <TableHead>NDE Types</TableHead>
                          <TableHead className="w-20">Status</TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead>Component ID</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Drawing ID</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Area</TableHead>
                          <TableHead>System</TableHead>
                          <TableHead className="w-20">Status</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validation.preview.slice(0, 10).map((row) => (
                      <TableRow key={row.rowNumber}>
                        <TableCell className="font-mono text-xs">
                          {row.rowNumber}
                        </TableCell>
                        {importType === "field_welds" ? (
                          <>
                            <TableCell className="font-mono text-sm">
                              {row.data.componentId}
                            </TableCell>
                            <TableCell className="text-sm">
                              {row.data.type ? (
                                <Badge variant="outline" className="font-mono text-xs">
                                  {row.data.type}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {row.data.drawingId}
                            </TableCell>
                            <TableCell className="text-sm">
                              {row.data.weldSize || row.data.size || "-"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {row.data.schedule || "-"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {row.data.baseMetal || row.data.material || "-"}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {row.data.xrayPercent ? `${row.data.xrayPercent}%` : "-"}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {row.data.pwhtRequired === true ? "Yes" : 
                               row.data.pwhtRequired === false ? "No" : 
                               typeof row.data.pwhtRequired === "string" ? row.data.pwhtRequired : "-"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {Array.isArray(row.data.ndeTypes) ? row.data.ndeTypes.join(", ") : 
                               typeof row.data.ndeTypes === "string" ? row.data.ndeTypes : "-"}
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="font-mono text-sm">
                              {row.data.componentId}
                            </TableCell>
                            <TableCell className="text-sm">
                              {row.data.type ? (
                                <Badge variant="outline" className="font-mono text-xs">
                                  {row.data.type}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {row.data.totalQuantity || 1}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {row.data.drawingId}
                            </TableCell>
                            <TableCell className="text-sm">
                              {row.data.description}
                            </TableCell>
                            <TableCell className="text-sm">
                              {row.data.area}
                            </TableCell>
                            <TableCell className="text-sm">
                              {row.data.system}
                            </TableCell>
                          </>
                        )}
                        <TableCell>
                          {row.errors.length > 0 ? (
                            <Badge variant="destructive" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              Error
                            </Badge>
                          ) : row.warnings.length > 0 ? (
                            <Badge variant="secondary" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Warning
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Valid
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors">
          <Card>
            <CardHeader>
              <CardTitle>Validation Issues</CardTitle>
              <CardDescription>
                Review errors and warnings before importing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Errors Section */}
              {validation.errors.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <h4 className="font-medium text-red-600">Errors ({validation.errors.length})</h4>
                  </div>
                  <ScrollArea className="h-[300px] w-full border rounded">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">Row</TableHead>
                          <TableHead>Field</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>Error Message</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validation.errors.map((error, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono text-xs">
                              {error.row}
                            </TableCell>
                            <TableCell className="font-medium">
                              {error.field}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {error.value || "(empty)"}
                            </TableCell>
                            <TableCell className="text-sm text-red-600">
                              {error.message}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}

              {/* Warnings Section */}
              {validation.warnings.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <h4 className="font-medium text-orange-600">Warnings ({validation.warnings.length})</h4>
                  </div>
                  <ScrollArea className="h-[300px] w-full border rounded">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">Row</TableHead>
                          <TableHead>Field</TableHead>
                          <TableHead>Warning Message</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validation.warnings.map((warning, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono text-xs">
                              {warning.row}
                            </TableCell>
                            <TableCell className="font-medium">
                              {warning.field}
                            </TableCell>
                            <TableCell className="text-sm text-orange-600">
                              {warning.message}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}

              {/* No Issues */}
              {validation.errors.length === 0 && validation.warnings.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-muted-foreground">No validation issues found</p>
                </div>
              )}

              {/* Download Error Report */}
              {validation.errors.length > 0 && (
                <div className="pt-4 border-t">
                  <Button variant="outline" onClick={downloadErrorReport}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Error Report
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onBack}>
          Back to Mapping
        </Button>
        <div className="flex gap-2">
          {importOptions.dryRun && (
            <Badge variant="secondary" className="self-center">
              Dry Run Mode
            </Badge>
          )}
          <Button 
            onClick={onConfirm}
            disabled={!canImport}
          >
            {importOptions.dryRun ? "Run Dry Import" : "Start Import"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}