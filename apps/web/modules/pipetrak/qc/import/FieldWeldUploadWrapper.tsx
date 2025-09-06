"use client";

import { useState } from "react";
import { FieldWeldUpload } from "./FieldWeldUpload";

interface FieldWeldUploadWrapperProps {
  projectId: string;
  organizationSlug: string;
}

interface FieldWeldImportResult {
  success: boolean;
  imported?: number;
  created?: {
    components: number;
    fieldWelds: number;
  };
  errors?: string[];
}

export function FieldWeldUploadWrapper({
  projectId,
  organizationSlug: _organizationSlug,
}: FieldWeldUploadWrapperProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<FieldWeldImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleFileSelect = (file: File, validationResult: any) => {
    console.log("Upload successful:", { file: file.name, validationResult });
    // Reset import state when new file selected
    setImportResult(null);
    setImportError(null);
  };

  const handleFileRemove = () => {
    console.log("File removed");
    setImportResult(null);
    setImportError(null);
  };

  const handleImport = async (file: File, validationResult: any) => {
    console.log("🚀 Starting import process...");
    console.log("📁 File:", {
      name: file.name,
      size: file.size,
      type: file.type
    });
    console.log("✅ Validation result:", validationResult);

    setIsImporting(true);
    setImportError(null);

    try {
      // Convert file to base64
      console.log("🔄 Converting file to base64...");
      const fileBuffer = await file.arrayBuffer();
      const base64Buffer = Buffer.from(fileBuffer).toString('base64');
      console.log("📊 Base64 buffer length:", base64Buffer.length);

      // Prepare payload - backend will parse Excel file if validatedRows is empty
      const payload = {
        projectId,
        fileData: { buffer: base64Buffer },
        filename: file.name,
        validationData: {
          isValid: true, // Basic file validation passed on frontend
          totalRows: 0,  // Backend will determine this from Excel parsing
          validRows: 0,  // Backend will determine this from Excel parsing
          validatedRows: [] // Backend will parse Excel and populate this
        },
        options: {
          skipErrors: false,
          createMissingDrawings: true,
          dryRun: false
        }
      };

      console.log("📤 API Payload:", {
        projectId: payload.projectId,
        filename: payload.filename,
        validationData: payload.validationData,
        options: payload.options,
        fileDataSize: payload.fileData.buffer.length
      });

      // Call the field weld import API
      console.log("🌐 Calling API: /api/pipetrak/qc/field-welds/import");
      const response = await fetch('/api/pipetrak/qc/field-welds/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log("📥 API Response status:", response.status);
      console.log("📥 API Response headers:", response.headers);

      if (!response.ok) {
        const errorData = await response.text();
        console.error("❌ API Error Response:", errorData);
        throw new Error(`Import failed: ${errorData}`);
      }

      const result: FieldWeldImportResult = await response.json();
      console.log("✅ Import Response:", result);
      
      // Log detailed error information if present
      if (result.errors && result.errors.length > 0) {
        console.error("🚨 Import errors:", result.errors);
      }
      
      setImportResult(result);

      if (result.success) {
        console.log("Field weld import successful:", result);
      } else {
        console.warn("Field weld import had errors:", result.errors);
      }
    } catch (error) {
      console.error("Import error:", error);
      setImportError(error instanceof Error ? error.message : "Unknown import error");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <FieldWeldUpload
      onFileSelect={handleFileSelect}
      onFileRemove={handleFileRemove}
      onImportClick={handleImport}
      isImporting={isImporting}
      importResult={importResult || undefined}
      error={importError || undefined}
    />
  );
}