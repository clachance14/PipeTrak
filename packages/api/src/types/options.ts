export interface ImportOptions {
  validateOnly?: boolean;
  atomic?: boolean;
  generateIds?: boolean;
  rollbackOnError?: boolean;
  skipDuplicates?: boolean;
  updateExisting?: boolean;
}

export interface ExportOptions {
  includeMilestones?: boolean;
  includeAuditTrail?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  showDeltas?: boolean;
}

export interface MilestoneOptions {
  replaceExisting?: boolean;
  preserveCompleted?: boolean;
}