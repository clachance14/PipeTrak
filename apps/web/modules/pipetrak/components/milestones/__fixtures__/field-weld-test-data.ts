import { randomUUID } from "crypto";

// Field weld component test fixtures
export interface FieldWeldTestComponent {
	id: string;
	componentId: string;
	displayId: string;
	type: "FIELD_WELD";
	workflowType: "MILESTONE_DISCRETE";
	projectId: string;
	status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
	completionPercent: number;
	milestones: FieldWeldMilestone[];
}

export interface FieldWeldMilestone {
	id: string;
	componentId: string;
	milestoneName: string;
	milestoneOrder: number;
	isCompleted: boolean;
	completedAt: string | null;
	completedBy: string | null;
	welderId: string | null;
	effectiveDate: string | null;
	comments: string | null;
	weight: number;
}

export interface WelderTestData {
	id: string;
	name: string;
	stencil: string;
	active: boolean;
	weldCount: number;
	projectId: string;
	createdAt: string;
	updatedAt: string;
}

export interface FieldWeldRecord {
	id: string;
	weldIdNumber: string;
	componentId: string;
	projectId: string;
	welderId: string | null;
	dateWelded: string | null;
	comments: string | null;
	status: "PENDING_FITUP" | "READY_FOR_WELD" | "IN_PROGRESS" | "COMPLETED";
	createdAt: string;
	updatedAt: string;
}

// Base test data
export const mockFieldWeldComponents: FieldWeldTestComponent[] = [
	{
		id: "comp-fw-001",
		componentId: "FW-001-001",
		displayId: "FW-001-001",
		type: "FIELD_WELD",
		workflowType: "MILESTONE_DISCRETE",
		projectId: "test-project-001",
		status: "IN_PROGRESS",
		completionPercent: 33,
		milestones: [
			{
				id: "milestone-fw-001-fit",
				componentId: "comp-fw-001",
				milestoneName: "Fit-up Ready",
				milestoneOrder: 1,
				isCompleted: true,
				completedAt: new Date("2025-01-10T10:00:00Z").toISOString(),
				completedBy: "user-001",
				welderId: null,
				effectiveDate: "2025-01-10",
				comments: null,
				weight: 20,
			},
			{
				id: "milestone-fw-001-weld",
				componentId: "comp-fw-001",
				milestoneName: "Weld",
				milestoneOrder: 2,
				isCompleted: false,
				completedAt: null,
				completedBy: null,
				welderId: null,
				effectiveDate: null,
				comments: null,
				weight: 60,
			},
			{
				id: "milestone-fw-001-qc",
				componentId: "comp-fw-001",
				milestoneName: "QC Inspection",
				milestoneOrder: 3,
				isCompleted: false,
				completedAt: null,
				completedBy: null,
				welderId: null,
				effectiveDate: null,
				comments: null,
				weight: 20,
			},
		],
	},
	{
		id: "comp-fw-002",
		componentId: "FW-002-001",
		displayId: "FW-002-001",
		type: "FIELD_WELD",
		workflowType: "MILESTONE_DISCRETE",
		projectId: "test-project-001",
		status: "NOT_STARTED",
		completionPercent: 0,
		milestones: [
			{
				id: "milestone-fw-002-fit",
				componentId: "comp-fw-002",
				milestoneName: "Fit-up Ready",
				milestoneOrder: 1,
				isCompleted: false,
				completedAt: null,
				completedBy: null,
				welderId: null,
				effectiveDate: null,
				comments: null,
				weight: 20,
			},
			{
				id: "milestone-fw-002-weld",
				componentId: "comp-fw-002",
				milestoneName: "Weld",
				milestoneOrder: 2,
				isCompleted: false,
				completedAt: null,
				completedBy: null,
				welderId: null,
				effectiveDate: null,
				comments: null,
				weight: 60,
			},
		],
	},
	{
		id: "comp-fw-003",
		componentId: "FW-003-001",
		displayId: "FW-003-001",
		type: "FIELD_WELD",
		workflowType: "MILESTONE_DISCRETE",
		projectId: "test-project-001",
		status: "COMPLETED",
		completionPercent: 100,
		milestones: [
			{
				id: "milestone-fw-003-fit",
				componentId: "comp-fw-003",
				milestoneName: "Fit-up Ready",
				milestoneOrder: 1,
				isCompleted: true,
				completedAt: new Date("2025-01-08T10:00:00Z").toISOString(),
				completedBy: "user-001",
				welderId: null,
				effectiveDate: "2025-01-08",
				comments: null,
				weight: 20,
			},
			{
				id: "milestone-fw-003-weld",
				componentId: "comp-fw-003",
				milestoneName: "Weld",
				milestoneOrder: 2,
				isCompleted: true,
				completedAt: new Date("2025-01-09T14:30:00Z").toISOString(),
				completedBy: "user-001",
				welderId: "welder-001",
				effectiveDate: "2025-01-09",
				comments: "Field weld completed successfully",
				weight: 60,
			},
			{
				id: "milestone-fw-003-qc",
				componentId: "comp-fw-003",
				milestoneName: "QC Inspection",
				milestoneOrder: 3,
				isCompleted: true,
				completedAt: new Date("2025-01-10T09:15:00Z").toISOString(),
				completedBy: "user-002",
				welderId: null,
				effectiveDate: "2025-01-10",
				comments: "QC inspection passed",
				weight: 20,
			},
		],
	},
];

export const mockWeldersForTesting: WelderTestData[] = [
	{
		id: "welder-001",
		name: "John Smith",
		stencil: "JS-001",
		active: true,
		weldCount: 15,
		projectId: "test-project-001",
		createdAt: "2025-01-01T08:00:00Z",
		updatedAt: "2025-01-15T14:30:00Z",
	},
	{
		id: "welder-002",
		name: "Sarah Johnson",
		stencil: "SJ-002",
		active: true,
		weldCount: 23,
		projectId: "test-project-001",
		createdAt: "2025-01-02T08:00:00Z",
		updatedAt: "2025-01-15T11:45:00Z",
	},
	{
		id: "welder-003",
		name: "Mike Wilson",
		stencil: "MW-003",
		active: false,
		weldCount: 8,
		projectId: "test-project-001",
		createdAt: "2025-01-03T08:00:00Z",
		updatedAt: "2025-01-12T16:20:00Z",
	},
	{
		id: "welder-004",
		name: "Lisa Davis",
		stencil: "LD-004",
		active: true,
		weldCount: 0,
		projectId: "test-project-001",
		createdAt: "2025-01-15T09:30:00Z",
		updatedAt: "2025-01-15T09:30:00Z",
	},
	{
		id: "welder-005",
		name: "Robert Brown",
		stencil: "RB-005",
		active: true,
		weldCount: 31,
		projectId: "test-project-001",
		createdAt: "2024-12-15T08:00:00Z",
		updatedAt: "2025-01-14T17:10:00Z",
	},
];

export const mockFieldWeldRecords: FieldWeldRecord[] = [
	{
		id: "field-weld-001",
		weldIdNumber: "FW-001-001",
		componentId: "comp-fw-001",
		projectId: "test-project-001",
		welderId: null,
		dateWelded: null,
		comments: null,
		status: "READY_FOR_WELD",
		createdAt: "2025-01-10T10:00:00Z",
		updatedAt: "2025-01-10T10:00:00Z",
	},
	{
		id: "field-weld-002",
		weldIdNumber: "FW-002-001",
		componentId: "comp-fw-002",
		projectId: "test-project-001",
		welderId: null,
		dateWelded: null,
		comments: null,
		status: "PENDING_FITUP",
		createdAt: "2025-01-05T14:00:00Z",
		updatedAt: "2025-01-05T14:00:00Z",
	},
	{
		id: "field-weld-003",
		weldIdNumber: "FW-003-001",
		componentId: "comp-fw-003",
		projectId: "test-project-001",
		welderId: "welder-001",
		dateWelded: "2025-01-09T14:30:00Z",
		comments: "Field weld completed successfully",
		status: "COMPLETED",
		createdAt: "2025-01-08T10:00:00Z",
		updatedAt: "2025-01-09T14:30:00Z",
	},
];

// Generator functions for test scenarios
export function generateFieldWeldComponent(
	options: {
		projectId?: string;
		componentId?: string;
		type?: "FIELD_WELD";
		status?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
		milestoneCompleted?: boolean;
		weldCompleted?: boolean;
	} = {},
): FieldWeldTestComponent {
	const id = randomUUID();
	const componentId = options.componentId || `FW-${randomUUID().slice(0, 8)}`;
	const projectId = options.projectId || "test-project-001";

	const fitUpMilestone: FieldWeldMilestone = {
		id: randomUUID(),
		componentId: id,
		milestoneName: "Fit-up Ready",
		milestoneOrder: 1,
		isCompleted: options.milestoneCompleted ?? true,
		completedAt: options.milestoneCompleted
			? new Date().toISOString()
			: null,
		completedBy: options.milestoneCompleted ? "user-001" : null,
		welderId: null,
		effectiveDate: options.milestoneCompleted
			? new Date().toISOString().split("T")[0]
			: null,
		comments: null,
		weight: 20,
	};

	const weldMilestone: FieldWeldMilestone = {
		id: randomUUID(),
		componentId: id,
		milestoneName: "Weld",
		milestoneOrder: 2,
		isCompleted: options.weldCompleted ?? false,
		completedAt: options.weldCompleted ? new Date().toISOString() : null,
		completedBy: options.weldCompleted ? "user-001" : null,
		welderId: options.weldCompleted ? "welder-001" : null,
		effectiveDate: options.weldCompleted
			? new Date().toISOString().split("T")[0]
			: null,
		comments: options.weldCompleted ? "Weld completed successfully" : null,
		weight: 60,
	};

	const qcMilestone: FieldWeldMilestone = {
		id: randomUUID(),
		componentId: id,
		milestoneName: "QC Inspection",
		milestoneOrder: 3,
		isCompleted: options.status === "COMPLETED",
		completedAt:
			options.status === "COMPLETED" ? new Date().toISOString() : null,
		completedBy: options.status === "COMPLETED" ? "user-002" : null,
		welderId: null,
		effectiveDate:
			options.status === "COMPLETED"
				? new Date().toISOString().split("T")[0]
				: null,
		comments:
			options.status === "COMPLETED" ? "QC inspection passed" : null,
		weight: 20,
	};

	const completionPercent =
		options.status === "COMPLETED"
			? 100
			: options.weldCompleted
				? 80
				: options.milestoneCompleted
					? 20
					: 0;

	return {
		id,
		componentId,
		displayId: componentId,
		type: "FIELD_WELD",
		workflowType: "MILESTONE_DISCRETE",
		projectId,
		status:
			options.status ||
			(options.weldCompleted
				? "IN_PROGRESS"
				: options.milestoneCompleted
					? "IN_PROGRESS"
					: "NOT_STARTED"),
		completionPercent,
		milestones: [fitUpMilestone, weldMilestone, qcMilestone],
	};
}

export function generateWelder(
	options: {
		projectId?: string;
		name?: string;
		stencil?: string;
		active?: boolean;
		weldCount?: number;
	} = {},
): WelderTestData {
	const id = randomUUID();
	const firstName = options.name?.split(" ")[0] || "Test";
	const lastName = options.name?.split(" ")[1] || "Welder";
	const initials = firstName[0] + lastName[0];
	const number = Math.floor(Math.random() * 999) + 1;

	return {
		id,
		name: options.name || `${firstName} ${lastName}`,
		stencil:
			options.stencil || `${initials}-${String(number).padStart(3, "0")}`,
		active: options.active ?? true,
		weldCount: options.weldCount ?? Math.floor(Math.random() * 20),
		projectId: options.projectId || "test-project-001",
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};
}

export function generateFieldWeldRecord(
	component: FieldWeldTestComponent,
	options: {
		welderId?: string;
		dateWelded?: string;
		comments?: string;
		status?:
			| "PENDING_FITUP"
			| "READY_FOR_WELD"
			| "IN_PROGRESS"
			| "COMPLETED";
	} = {},
): FieldWeldRecord {
	const weldMilestone = component.milestones.find(
		(m) => m.milestoneName === "Weld",
	);
	const fitUpMilestone = component.milestones.find(
		(m) => m.milestoneName === "Fit-up Ready",
	);

	const status =
		options.status ||
		(weldMilestone?.isCompleted
			? "COMPLETED"
			: fitUpMilestone?.isCompleted
				? "READY_FOR_WELD"
				: "PENDING_FITUP");

	return {
		id: randomUUID(),
		weldIdNumber: component.componentId,
		componentId: component.id,
		projectId: component.projectId,
		welderId: options.welderId || weldMilestone?.welderId || null,
		dateWelded: options.dateWelded || weldMilestone?.effectiveDate || null,
		comments: options.comments || weldMilestone?.comments || null,
		status,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};
}

// Test scenarios
export const testScenarios = {
	// Ready for weld (prerequisites complete)
	readyForWeld: () =>
		generateFieldWeldComponent({
			milestoneCompleted: true,
			weldCompleted: false,
		}),

	// Not ready (prerequisites incomplete)
	notReady: () =>
		generateFieldWeldComponent({
			milestoneCompleted: false,
			weldCompleted: false,
		}),

	// Completed weld
	completedWeld: () =>
		generateFieldWeldComponent({
			milestoneCompleted: true,
			weldCompleted: true,
			status: "IN_PROGRESS",
		}),

	// Fully completed component
	fullyCompleted: () =>
		generateFieldWeldComponent({
			milestoneCompleted: true,
			weldCompleted: true,
			status: "COMPLETED",
		}),

	// Active welders only
	activeWelders: () => mockWeldersForTesting.filter((w) => w.active),

	// No welders available
	noWelders: () => [],

	// Large number of welders (for performance testing)
	manyWelders: (count = 100) => {
		return Array.from({ length: count }, (_, i) =>
			generateWelder({
				name: `Test Welder ${i + 1}`,
				stencil: `TW-${String(i + 1).padStart(3, "0")}`,
				active: Math.random() > 0.2, // 80% active
			}),
		);
	},

	// Various stencil formats for edge case testing
	welderStencilVariations: [
		generateWelder({ stencil: "JS-001" }), // Standard format
		generateWelder({ stencil: "AB123" }), // No hyphen
		generateWelder({ stencil: "X-1" }), // Single letter
		generateWelder({ stencil: "ABC-123" }), // Multiple letters
		generateWelder({ stencil: "123" }), // Numbers only
	],
};

// Form validation test data
export const validationTestData = {
	validWelderSubmission: {
		welderId: "welder-001",
		dateWelded: new Date(),
		comments: "Test weld completion",
	},

	invalidSubmissions: [
		{
			// Missing welder
			welderId: "",
			dateWelded: new Date(),
			comments: "Test comment",
			expectedError: "Please select a welder.",
		},
		{
			// Missing date
			welderId: "welder-001",
			dateWelded: null,
			comments: "Test comment",
			expectedError: "Please select the date welded.",
		},
		{
			// Comments too long
			welderId: "welder-001",
			dateWelded: new Date(),
			comments: "a".repeat(501),
			expectedError: "Comments cannot exceed 500 characters.",
		},
	],

	edgeCases: {
		maxLengthComments: "a".repeat(500),
		whitespaceOnlyComments: "   ",
		specialCharacterComments: "Test with émojis 🔥 and spécial chars!",
		pastDate: new Date("2020-01-01"),
		futureDate: new Date("2030-12-31"),
		today: new Date(),
	},
};

// Performance test data
export const performanceTestData = {
	// Generate components for stress testing
	generateLargeComponentSet: (count = 1000) => {
		return Array.from({ length: count }, (_, i) =>
			generateFieldWeldComponent({
				componentId: `FW-${String(i + 1).padStart(6, "0")}`,
				milestoneCompleted: Math.random() > 0.5,
				weldCompleted: Math.random() > 0.7,
			}),
		);
	},

	// Concurrent operation scenarios
	concurrentUpdates: [
		{
			welderId: "welder-001",
			dateWelded: new Date(),
			comments: "First concurrent update",
		},
		{
			welderId: "welder-002",
			dateWelded: new Date(),
			comments: "Second concurrent update",
		},
	],
};

// API mock response helpers
export const mockApiResponses = {
	// Successful milestone update
	milestoneUpdateSuccess: (
		milestone: FieldWeldMilestone,
		welderData: any,
	) => ({
		id: milestone.id,
		componentId: milestone.componentId,
		milestoneName: milestone.milestoneName,
		isCompleted: true,
		completedAt: new Date().toISOString(),
		completedBy: "test-user",
		welderId: welderData.welderId,
		effectiveDate: welderData.dateWelded.toISOString().split("T")[0],
		comments: welderData.comments,
		milestoneOrder: milestone.milestoneOrder,
		weight: milestone.weight,
	}),

	// API error responses
	invalidWelderError: {
		error: "Invalid welder ID",
		message: "Welder not found or not active",
		code: "INVALID_WELDER",
	},

	validationError: {
		error: "Validation error",
		message: "Invalid request data",
		code: "VALIDATION_ERROR",
		details: [
			"effectiveDate must be a valid date",
			"comments must not exceed 500 characters",
		],
	},

	networkError: {
		error: "Network error",
		message: "Unable to connect to server",
		code: "NETWORK_ERROR",
	},

	// QC field weld responses
	fieldWeldUpdateSuccess: (fieldWeld: FieldWeldRecord, welderData: any) => ({
		id: fieldWeld.id,
		weldIdNumber: fieldWeld.weldIdNumber,
		componentId: fieldWeld.componentId,
		projectId: fieldWeld.projectId,
		welderId: welderData.welderId,
		dateWelded: welderData.dateWelded.toISOString(),
		comments: welderData.comments,
		status: "COMPLETED",
		updatedAt: new Date().toISOString(),
	}),

	// Empty welder list
	noWelders: [],

	// Loading state
	weldersLoading: { loading: true },
};

// Accessibility test helpers
export const accessibilityTestData = {
	// Required ARIA attributes for modal
	expectedAriaAttributes: {
		modal: ["role", "aria-labelledby", "aria-describedby"],
		form: ["aria-label"],
		select: ["aria-label", "aria-required"],
		textarea: ["aria-label"],
		button: ["aria-label"],
		alert: ["role", "aria-live"],
	},

	// Keyboard navigation sequences
	keyboardNavigation: [
		"Tab", // Focus date button
		"Tab", // Focus welder select
		"Tab", // Focus comments field
		"Tab", // Focus cancel button
		"Tab", // Focus submit button
		"Escape", // Close modal
	],

	// Screen reader announcements
	expectedAnnouncements: {
		modalOpen: "Complete Weld Milestone dialog",
		validationErrors: "Alert: Please select a welder.",
		success: "Weld milestone completed",
	},
};

// Mobile test configurations
export const mobileTestConfig = {
	viewports: [
		{ width: 375, height: 667, name: "iPhone SE" },
		{ width: 414, height: 896, name: "iPhone 11 Pro" },
		{ width: 768, height: 1024, name: "iPad" },
		{ width: 360, height: 640, name: "Android Phone" },
	],

	touchTargetMinimum: 44, // pixels

	expectedMobileBehaviors: {
		modalMaxWidth: 400,
		stackedButtons: true,
		largerInputFields: true,
		simplifiedNavigation: true,
	},
};

// Export all test utilities
export type {
	FieldWeldTestComponent,
	FieldWeldMilestone,
	WelderTestData,
	FieldWeldRecord,
};
