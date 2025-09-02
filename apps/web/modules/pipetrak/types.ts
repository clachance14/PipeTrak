// Core component types matching Prisma schema
export interface Component {
	id: string;
	projectId: string;
	componentId: string; // Unique identifier from field
	weldId?: string | null; // Weld ID for FIELD_WELD components (links to FieldWeld.weldIdNumber)
	type?: string | null;
	spec?: string | null;
	size?: string | null;
	material?: string | null;
	area?: string | null;
	system?: string | null;
	subSystem?: string | null;
	testPackage?: string | null;
	workflowType: WorkflowType;
	status: ComponentStatus;
	completionPercent: number;
	totalQuantity?: number | null;
	quantityUnit?: string | null;
	totalLength?: number | null;
	lengthUnit?: string | null;
	drawingId?: string | null;
	milestoneTemplateId?: string | null;
	installerUserId?: string | null;
	installedAt?: Date | null; // legacy field name in some fixtures
	installationDate?: Date | null; // aligns with DB schema and UI usage
	createdAt: Date;
	updatedAt: Date;
	milestones?: ComponentMilestone[];
	drawing?: Drawing;
	milestoneTemplate?: MilestoneTemplate;
	project?: Project;
}

export interface ComponentMilestone {
	id: string;
	componentId: string;
	milestoneOrder: number;
	milestoneName: string;
	isCompleted: boolean;
	percentageComplete?: number | null;
	quantityComplete?: number | null;
	quantityTotal?: number | null;
	completedAt?: Date | null;
	completedBy?: string | null;
	createdAt: Date;
	updatedAt: Date;
	component?: Component;
	// Additional fields for UI rendering
	weight: number; // ROC weight (0-100) from database
	sequenceNumber?: number;
	totalInWorkflow?: number;
	unit?: string | null;
	dependencies?: string[];
}

export interface MilestoneTemplate {
	id: string;
	projectId: string;
	name: string;
	description?: string | null;
	milestones: any; // JSON array of milestone definitions
	isDefault: boolean;
	createdAt: Date;
	updatedAt: Date;
	project?: Project;
	components?: Component[];
}

export interface Drawing {
	id: string;
	projectId: string;
	number: string;
	title: string;
	description?: string | null;
	revision?: string | null;
	parentId?: string | null;
	filePath?: string | null;
	fileUrl?: string | null;
	createdAt: Date;
	updatedAt: Date;
	project?: Project;
	components?: Component[];
	children?: Drawing[];
	parent?: Drawing;
	// Enhanced fields for navigation
	level?: number;
	path?: string[];
	componentCount?: DrawingComponentCount;
	isExpanded?: boolean; // UI state
}

export interface DrawingComponentCount {
	total: number;
	notStarted: number;
	inProgress: number;
	completed: number;
	onHold: number;
}

export interface DrawingTreeNode extends Drawing {
	children: DrawingTreeNode[];
	componentCount: DrawingComponentCount;
}

export interface DrawingSearchResult {
	id: string;
	number: string;
	title: string;
	revision?: string;
	parentId?: string;
	componentCount: number;
	breadcrumb: { id: string; number: string; title: string }[];
}

export interface DrawingNavigationState {
	selectedDrawingId?: string;
	expandedDrawingIds: Set<string>;
	searchQuery: string;
	searchResults: DrawingSearchResult[];
	isSearching: boolean;
}

export interface Project {
	id: string;
	organizationId: string;
	name: string;
	description?: string | null;
	status: ProjectStatus;
	location?: string | null;
	startDate?: Date | null;
	targetDate?: Date | null;
	createdAt: Date;
	updatedAt: Date;
	createdBy: string;
	creator?: any;
	organization?: any;
	drawings?: Drawing[];
	components?: Component[];
	milestoneTemplates?: MilestoneTemplate[];
	importJobs?: ImportJob[];
	auditLogs?: AuditLog[];
}

// Enums
export enum ComponentStatus {
	NOT_STARTED = "NOT_STARTED",
	IN_PROGRESS = "IN_PROGRESS",
	COMPLETED = "COMPLETED",
	ON_HOLD = "ON_HOLD",
}

export enum WorkflowType {
	MILESTONE_DISCRETE = "MILESTONE_DISCRETE",
	MILESTONE_PERCENTAGE = "MILESTONE_PERCENTAGE",
	MILESTONE_QUANTITY = "MILESTONE_QUANTITY",
}

export enum ProjectStatus {
	ACTIVE = "ACTIVE",
	ON_HOLD = "ON_HOLD",
	COMPLETED = "COMPLETED",
	CANCELLED = "CANCELLED",
}

export enum ImportJobStatus {
	PENDING = "PENDING",
	PROCESSING = "PROCESSING",
	COMPLETED = "COMPLETED",
	FAILED = "FAILED",
}

// Import job types
export interface ImportJob {
	id: string;
	projectId: string;
	fileName: string;
	status: ImportJobStatus;
	data: any; // JSON data
	result?: any | null; // JSON result
	errorMessage?: string | null;
	userId: string;
	createdAt: Date;
	processedAt?: Date | null;
	completedAt?: Date | null;
	project?: Project;
	user?: any;
}

export interface AuditLog {
	id: string;
	projectId: string;
	userId?: string | null;
	entityType: string;
	entityId: string;
	action: AuditAction;
	oldValue?: any | null;
	newValue?: any | null;
	timestamp: Date;
	componentId?: string | null;
	project?: Project;
	user?: any;
	component?: Component;
}

export enum AuditAction {
	CREATE = "CREATE",
	UPDATE = "UPDATE",
	DELETE = "DELETE",
}

export enum MilestoneStatus {
	NOT_STARTED = "NOT_STARTED",
	IN_PROGRESS = "IN_PROGRESS",
	COMPLETED = "COMPLETED",
}

export interface ImportError {
	row: number;
	column: string;
	message: string;
}

// Extended types with relations
export interface ComponentWithMilestones extends Component {
	milestones: ComponentMilestone[];
	drawing?: Drawing;
	milestoneTemplate?: MilestoneTemplate;
	description?: string | null;
	drawingNumber?: string | null; // For display purposes
	instanceNumber?: number; // Instance number on drawing
	totalInstancesOnDrawing?: number; // Total instances on drawing
	displayId?: string | null; // Generated display ID
}

// Table column type for DataTable
export interface TableColumn {
	key: string;
	label: string;
	type?: "text" | "number" | "date" | "status" | "progress" | "boolean";
	width?: string;
	sortable?: boolean;
	editable?: boolean;
}

export interface ImportPreview {
	headers: string[];
	rows: Record<string, any>[];
	totalRows: number;
	validRows: number;
	errorRows: number;
	errors: ImportError[];
}

// API response types
export interface ApiResponse<T = any> {
	data?: T;
	error?: string;
	message?: string;
}

export interface PaginatedResponse<T> {
	data: T[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

// Filter and search types
export interface ComponentFilters {
	discipline?: string[];
	area?: string[];
	drawingId?: string;
	milestoneStatus?: MilestoneStatus[];
	search?: string;
}

// Progress and ROC calculation types
export interface ComponentProgress {
	componentId: string;
	totalMilestones: number;
	completedMilestones: number;
	progressPercentage: number;
	rocValue: number; // Weighted ROC value
}

export interface ProjectSummary {
	totalComponents: number;
	completedComponents: number;
	overallProgress: number;
	totalROC: number;
	averageROC: number;
	disciplineBreakdown: Record<string, ComponentProgress[]>;
	areaBreakdown: Record<string, ComponentProgress[]>;
}

// UI state types
export interface LoadingState {
	isLoading: boolean;
	message?: string;
}

export interface ErrorState {
	hasError: boolean;
	message?: string;
	details?: string;
}

export interface SuccessState {
	isSuccess: boolean;
	message?: string;
}

// Form types
export interface BulkEditPayload {
	componentIds: string[];
	updates: {
		milestoneUpdates?: {
			milestoneDefinitionId: string;
			status: MilestoneStatus;
			completedAt?: Date;
		}[];
	};
}

export interface ComponentFormData {
	componentNumber: string;
	description: string;
	discipline: string;
	area: string;
	drawingId: string;
}
