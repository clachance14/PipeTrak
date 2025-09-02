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
	testPackage?: string;
	notes?: string;
	quantity: number;
}

// Field weld specific import data
export interface FieldWeldImportData {
	weldIdNumber: string;
	welderStencil?: string;
	drawingNumber: string;
	testPackageNumber?: string;
	testPressure?: number | string;
	specCode?: string;
	pmiRequired?: boolean;
	pwhtRequired?: boolean;
	pmiCompleteDate?: Date;
	comments?: string;
	// Additional optional fields from WELD LOG
	weldSize?: string;
	xrayPercentage?: string;
	weldType?: string;
}

// Enhanced component import data that includes field weld fields
export interface EnhancedComponentImportData extends ComponentImportData {
	// Field weld specific fields
	welderStencil?: string;
	weldIdNumber?: string;
	testPressure?: number;
	pmiRequired?: boolean;
	pwhtRequired?: boolean;
	pmiCompleteDate?: Date;

	// Instance tracking
	instanceNumber?: number;
	totalInstancesOnDrawing?: number;
	displayId?: string;
}

export interface ComponentInstanceData
	extends Omit<ComponentImportData, "quantity"> {
	instanceNumber: number;
	totalInstancesOnDrawing: number;
	displayId: string;
	milestoneTemplateId: string;
	workflowType: "MILESTONE_DISCRETE";
	status: "NOT_STARTED";
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

export interface ImportProgress {
	currentBatch: number;
	totalBatches: number;
	componentsCreated: number;
	totalComponents: number;
	milestonesCreated: number;
	percentComplete: number;
	status: string;
	timeElapsed: number;
	estimatedTimeRemaining: number;
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
	progress?: ImportProgress;
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
