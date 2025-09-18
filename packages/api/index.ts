export * from "./src/app";

// Re-export import system types for stable top-level consumption
export type {
    ComponentImportData,
    ComponentInstanceData,
    ImportPreviewResult,
    ImportResult,
    MappingStats,
    MilestoneDefinition,
    MilestoneTemplate,
    ImportProgress,
} from "./src/lib/import/types";

// Re-export field weld column detection types and functions
export type {
    ColumnMappings,
    ColumnDetectionResult,
} from "./src/lib/import/field-weld-column-detector";

export {
    COLUMN_PATTERNS,
    ESSENTIAL_FIELDS,
    HIGH_PRIORITY_FIELDS,
    autoDetectColumns,
    getFieldDisplayName,
    getFieldPatterns,
    validateDetectionResult,
    generateMappingSummary,
} from "./src/lib/import/field-weld-column-detector";
