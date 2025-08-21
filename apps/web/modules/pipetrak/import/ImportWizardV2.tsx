'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/card';
import { Button } from '@ui/components/button';
import { Alert, AlertDescription } from '@ui/components/alert';
import { Progress } from '@ui/components/progress';
import { CheckCircle, AlertTriangle, Upload, FileSpreadsheet } from 'lucide-react';

interface ImportPreviewResult {
  preview: true;
  totalRows: number;
  typeMappings: {
    valve: number;
    support: number;
    gasket: number;
    flange: number;
    fitting: number;
    instrument: number;
    pipe: number;
    spool: number;
    fieldWeld: number;
    misc: number;
  };
  unknownTypes: string[];
  estimatedInstances: number;
}

interface ImportResult {
  success: boolean;
  imported: number;
  summary: {
    rows: number;
    instances: number;
  };
}

interface ImportWizardV2Props {
  projectId: string;
}

type WizardStep = 'upload' | 'preview' | 'importing' | 'results';

export function ImportWizardV2({ projectId }: ImportWizardV2Props) {
  const [step, setStep] = useState<WizardStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handlePreview = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const fileBuffer = await file.arrayBuffer();
      const base64Buffer = Buffer.from(fileBuffer).toString('base64');

      const response = await fetch('/api/pipetrak/import/components-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          fileData: { buffer: base64Buffer },
          preview: true
        })
      });

      if (!response.ok) {
        throw new Error(`Import failed: ${response.statusText}`);
      }

      const data = await response.json() as ImportPreviewResult;
      setPreview(data);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setStep('importing');
    setIsLoading(true);
    setError(null);

    try {
      const fileBuffer = await file.arrayBuffer();
      const base64Buffer = Buffer.from(fileBuffer).toString('base64');

      const response = await fetch('/api/pipetrak/import/components-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          fileData: { buffer: base64Buffer },
          preview: false
        })
      });

      if (!response.ok) {
        throw new Error(`Import failed: ${response.statusText}`);
      }

      const data = await response.json() as ImportResult;
      setImportResult(data);
      setStep('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setStep('preview'); // Go back to preview on error
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setStep('upload');
    setFile(null);
    setPreview(null);
    setImportResult(null);
    setError(null);
    setIsLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Component Import</h1>
        <p className="text-muted-foreground mt-2">
          Import piping components from Excel files with smart type mapping
        </p>
      </div>

      {/* Step 1: File Upload */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Excel File
            </CardTitle>
            <CardDescription>
              Select an Excel file containing component data. Supports .xlsx format.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <div className="space-y-2">
                  <div className="text-lg font-medium">Drop your Excel file here</div>
                  <div className="text-sm text-muted-foreground">
                    or click to browse files
                  </div>
                </div>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              {file && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{file.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                    <Button onClick={handlePreview} disabled={isLoading}>
                      {isLoading ? 'Analyzing...' : 'Analyze File'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Preview */}
      {step === 'preview' && preview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Import Preview
            </CardTitle>
            <CardDescription>
              Review the analysis before importing components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {preview.totalRows}
                  </div>
                  <div className="text-sm text-blue-600">Excel Rows</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {preview.estimatedInstances}
                  </div>
                  <div className="text-sm text-green-600">Component Instances</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {Object.values(preview.typeMappings).reduce((a, b) => a + b, 0)}
                  </div>
                  <div className="text-sm text-purple-600">Component Types</div>
                </div>
              </div>

              {/* Type Breakdown */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Component Type Mapping</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {Object.entries(preview.typeMappings).map(([type, count]) => {
                    if (count === 0) return null;
                    return (
                      <div key={type} className="p-3 bg-muted/50 rounded-lg text-center">
                        <div className="font-bold text-lg">{count}</div>
                        <div className="text-sm capitalize">
                          {type === 'fieldWeld' ? 'Field Welds' : type + 's'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Unknown Types Warning */}
              {preview.unknownTypes.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Unknown types found:</strong> {preview.unknownTypes.join(', ')} 
                    <br />
                    These will be imported as "MISC" type.
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button onClick={reset} variant="outline">
                  Change File
                </Button>
                <Button onClick={handleImport} size="lg">
                  Import {preview.estimatedInstances} Components
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Importing */}
      {step === 'importing' && (
        <Card>
          <CardHeader>
            <CardTitle>Importing Components...</CardTitle>
            <CardDescription>
              Please wait while we process your components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={undefined} className="w-full" />
              <div className="text-center text-muted-foreground">
                Creating components and assigning milestone templates...
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Results */}
      {step === 'results' && importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Import Complete!
            </CardTitle>
            <CardDescription>
              Your components have been successfully imported
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="p-6 bg-green-50 rounded-lg">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {importResult.imported}
                  </div>
                  <div className="text-green-600">Components Created</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-xl font-semibold">{importResult.summary.rows}</div>
                  <div className="text-muted-foreground">Excel Rows Processed</div>
                </div>
                <div>
                  <div className="text-xl font-semibold">{importResult.summary.instances}</div>
                  <div className="text-muted-foreground">Component Instances</div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Button asChild>
                  <a href={`/app/pipetrak/${projectId}/components`}>
                    View Components
                  </a>
                </Button>
                <Button onClick={reset} variant="outline">
                  Import Another File
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}