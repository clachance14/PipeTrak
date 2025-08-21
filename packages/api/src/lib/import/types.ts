// Types for the import system

export interface MappingStats {
  total: number;
  mapped: Map<string, number>;
  unknown: string[];
}

export interface ComponentImportData {
  projectId: string;
  drawingId: string;
  componentId: string;
  type: string;
  spec?: string;
  size?: string;
  description?: string;
  material?: string;
  area?: string;
  system?: string;
  notes?: string;
  quantity: number;
}

export interface ComponentInstanceData extends Omit<ComponentImportData, 'quantity'> {
  instanceNumber: number;
  totalInstancesOnDrawing: number;
  displayId: string;
  milestoneTemplateId: string;
  workflowType: 'MILESTONE_DISCRETE';
  status: 'NOT_STARTED';
  completionPercent: 0;
}

export interface ImportPreviewResult {
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

export interface ImportResult {
  success: boolean;
  imported: number;
  summary: {
    rows: number;
    groupedComponents?: number;
    instances: number;
    skipped?: number;
    mappings: MappingStats;
  };
}

export interface MilestoneDefinition {
  name: string;
  weight: number;
  order: number;
}

export interface MilestoneTemplate {
  id: string;
  name: string;
  milestones: MilestoneDefinition[];
}