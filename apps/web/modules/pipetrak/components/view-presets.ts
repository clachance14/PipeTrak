import type { VisibilityState, ColumnSizingState, ColumnOrderState } from "@tanstack/react-table";

export interface ViewPreset {
  id: string;
  name: string;
  description: string;
  icon?: string;
  columnVisibility: VisibilityState;
  columnSizing: ColumnSizingState;
  columnOrder: ColumnOrderState;
  isDefault?: boolean;
}

// Field View - Optimized for field workers updating milestones
export const FIELD_VIEW_PRESET: ViewPreset = {
  id: "field",
  name: "Field View",
  description: "Essential columns for field updates with prominent milestone display",
  icon: "hardhat",
  isDefault: true,
  columnVisibility: {
    select: true,
    drawingNumber: false, // Hidden in groups since it's shown in header
    componentId: true,
    instance: true,
    type: true, // Show type column as primary descriptor
    size: true, // Show size column for component identification
    spec: false,
    material: false,
    description: false, // Hide description since we're using type
    area: true,
    system: true,
    testPackage: false,
    status: true,
    completionPercent: false, // Hidden to save space
    milestones: true,
  },
  columnSizing: {
    select: 40,
    componentId: 180, // Reduced from 200
    instance: 100,
    type: 200, // Size for type column
    size: 80, // Size column width
    area: 80, // Reduced from 100
    system: 100, // Reduced from 120
    status: 100, // Reduced from 120
    milestones: 280, // Reduced from 350 but still prominent
  },
  columnOrder: [
    "select",
    "componentId",
    "instance",
    "type", // Type instead of description
    "size", // Size for component identification
    "area",
    "system",
    "milestones", // Milestones prominently positioned
    "status",
  ],
};

// Technical View - All component specifications visible
export const TECHNICAL_VIEW_PRESET: ViewPreset = {
  id: "technical",
  name: "Technical View",
  description: "Complete technical specifications and all data columns",
  icon: "wrench",
  columnVisibility: {
    select: true,
    drawingNumber: false, // Removed drawing column
    componentId: true,
    instance: true,
    type: true,
    size: true,
    spec: true,
    material: true,
    description: false, // Hide description since we're using type
    area: true,
    system: true,
    testPackage: true,
    status: true,
    completionPercent: true,
    milestones: true,
  },
  columnSizing: {
    select: 50,
    componentId: 250,
    instance: 100,
    type: 200,
    size: 80,
    spec: 100,
    material: 100,
    area: 100,
    system: 120,
    testPackage: 120,
    status: 120,
    completionPercent: 120,
    milestones: 250,
  },
  columnOrder: [
    "select",
    "componentId",
    "instance",
    "type",
    "size",
    "spec",
    "material",
    "area",
    "system",
    "testPackage",
    "milestones",
    "status",
    "completionPercent",
  ],
};

// Manager View - Progress overview and high-level tracking
export const MANAGER_VIEW_PRESET: ViewPreset = {
  id: "manager",
  name: "Manager View",
  description: "Progress overview with status and area/system grouping",
  icon: "chart",
  columnVisibility: {
    select: true,
    drawingNumber: false, // Removed drawing column
    componentId: true,
    instance: true,
    type: true, // Show type column
    size: false,
    spec: false,
    material: false,
    description: false, // Hide description since we're using type
    area: true,
    system: true,
    testPackage: true,
    status: true,
    completionPercent: true,
    milestones: true,
  },
  columnSizing: {
    select: 50,
    componentId: 200,
    instance: 100,
    type: 250, // Size for type column
    area: 120,
    system: 120,
    testPackage: 120,
    status: 140,
    completionPercent: 140,
    milestones: 200,
  },
  columnOrder: [
    "select",
    "componentId",
    "instance",
    "type", // Type instead of description
    "area",
    "system",
    "testPackage",
    "status",
    "completionPercent",
    "milestones",
  ],
};

// Compact View - Maximum density for Excel-like editing
export const COMPACT_VIEW_PRESET: ViewPreset = {
  id: "compact",
  name: "Compact View",
  description: "Maximum data density for bulk operations",
  icon: "table",
  columnVisibility: {
    select: true,
    drawingNumber: false, // Removed drawing column
    componentId: true,
    instance: true,
    type: true,
    size: true,
    spec: false,
    material: false,
    description: false, // Hide description since we're using type
    area: true,
    system: false,
    testPackage: false,
    status: true,
    completionPercent: false,
    milestones: false,
  },
  columnSizing: {
    select: 40,
    componentId: 180,
    instance: 100,
    type: 150,
    size: 60,
    area: 80,
    status: 100,
  },
  columnOrder: [
    "select",
    "componentId",
    "instance",
    "type",
    "size",
    "area",
    "status",
  ],
};

export const VIEW_PRESETS = [
  FIELD_VIEW_PRESET,
  TECHNICAL_VIEW_PRESET,
  MANAGER_VIEW_PRESET,
  COMPACT_VIEW_PRESET,
];

export function getPresetById(id: string): ViewPreset | undefined {
  return VIEW_PRESETS.find(preset => preset.id === id);
}

export function getDefaultPreset(): ViewPreset {
  return VIEW_PRESETS.find(preset => preset.isDefault) || FIELD_VIEW_PRESET;
}

// Helper to apply preset to table
export function applyViewPreset(
  preset: ViewPreset,
  setColumnVisibility: (visibility: VisibilityState) => void,
  setColumnSizing: (sizing: ColumnSizingState) => void,
  setColumnOrder: (order: ColumnOrderState) => void
) {
  setColumnVisibility(preset.columnVisibility);
  setColumnSizing(preset.columnSizing);
  setColumnOrder(preset.columnOrder);
  
  // Save preset selection to localStorage
  localStorage.setItem('pipetrak-active-preset', preset.id);
}

// Get the last used preset from localStorage
export function getSavedPreset(): ViewPreset {
  if (typeof window === 'undefined') return getDefaultPreset();
  
  const savedPresetId = localStorage.getItem('pipetrak-active-preset');
  if (savedPresetId) {
    const preset = getPresetById(savedPresetId);
    if (preset) return preset;
  }
  
  return getDefaultPreset();
}