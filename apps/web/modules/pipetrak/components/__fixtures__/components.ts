import type {
	ComponentWithMilestones,
	ComponentMilestone,
	Drawing,
	Project,
} from "../../types";
import { ProjectStatus, ComponentStatus, WorkflowType } from "../../types";

export const mockProject: Project = {
	id: "test-project-id",
	organizationId: "test-org-id",
	name: "SDO Tank Construction",
	description: "Test project for SDO Tank",
	status: ProjectStatus.ACTIVE,
	location: "Houston, TX",
	startDate: new Date("2024-01-01"),
	targetDate: new Date("2024-12-31"),
	createdAt: new Date("2024-01-01"),
	updatedAt: new Date("2024-01-01"),
	createdBy: "test-user-id",
};

export const mockDrawing: Drawing = {
	id: "drawing-1",
	projectId: "test-project-id",
	number: "P-35F11",
	title: "Piping ISO for Area 401",
	revision: "A",
	parentId: null,
	createdAt: new Date("2024-01-01"),
	updatedAt: new Date("2024-01-01"),
};

export const mockMilestones: ComponentMilestone[] = [
	{
		id: "milestone-1",
		componentId: "component-1",
		milestoneOrder: 1,
		milestoneName: "Received",
		isCompleted: true,
		percentageComplete: 100,
		quantityComplete: null,
		quantityTotal: null,
		completedAt: new Date("2024-02-01"),
		completedBy: "user-1",
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-02-01"),
		weight: 5, // ROC weight for Receive milestone
	},
	{
		id: "milestone-2",
		componentId: "component-1",
		milestoneOrder: 2,
		milestoneName: "Installed",
		isCompleted: false,
		percentageComplete: 0,
		quantityComplete: null,
		quantityTotal: null,
		completedAt: null,
		completedBy: null,
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-01"),
		weight: 60, // ROC weight for Install milestone (reduced set)
	},
	{
		id: "milestone-3",
		componentId: "component-1",
		milestoneOrder: 3,
		milestoneName: "Tested",
		isCompleted: false,
		percentageComplete: 0,
		quantityComplete: null,
		quantityTotal: null,
		completedAt: null,
		completedBy: null,
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-01"),
		weight: 15, // ROC weight for Test milestone (reduced set)
	},
];

export const mockComponents: ComponentWithMilestones[] = [
	{
		id: "component-1",
		projectId: "test-project-id",
		componentId: "VALVE-401-001",
		type: "VALVE",
		spec: "CS150",
		size: '4"',
		material: "Carbon Steel",
		area: "401",
		system: "Cooling Water",
		subSystem: "Supply",
		testPackage: "TP-401-01",
		workflowType: WorkflowType.MILESTONE_DISCRETE,
		status: ComponentStatus.IN_PROGRESS,
		completionPercent: 33,
		totalQuantity: 1,
		drawingId: "drawing-1",
		drawingNumber: "P-35F11",
		description: "Gate Valve - Cooling Water Supply",
		milestoneTemplateId: "template-1",
		installerUserId: null,
		installedAt: null,
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-02-01"),
		milestones: mockMilestones,
		drawing: mockDrawing,
	},
	{
		id: "component-2",
		projectId: "test-project-id",
		componentId: "PIPE-401-002",
		type: "PIPE",
		spec: "CS150",
		size: '6"',
		material: "Carbon Steel",
		area: "401",
		system: "Cooling Water",
		subSystem: "Return",
		testPackage: "TP-401-01",
		workflowType: WorkflowType.MILESTONE_QUANTITY,
		status: ComponentStatus.NOT_STARTED,
		completionPercent: 0,
		totalQuantity: 150,
		drawingId: "drawing-1",
		drawingNumber: "P-35F11",
		description: "Pipe Spool - 150 ft",
		milestoneTemplateId: "template-1",
		installerUserId: null,
		installedAt: null,
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-01"),
		milestones: [],
		drawing: mockDrawing,
	},
	{
		id: "component-3",
		projectId: "test-project-id",
		componentId: "GASKET-401-003",
		type: "GASKET",
		spec: "RF150",
		size: '4"',
		material: "Spiral Wound",
		area: "401",
		system: "Process",
		subSystem: null,
		testPackage: "TP-401-02",
		workflowType: WorkflowType.MILESTONE_DISCRETE,
		status: ComponentStatus.COMPLETED,
		completionPercent: 100,
		totalQuantity: 1,
		drawingId: "drawing-1",
		drawingNumber: "P-35F11",
		description: "Spiral Wound Gasket",
		milestoneTemplateId: "template-1",
		installerUserId: "user-1",
		installedAt: new Date("2024-03-01"),
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-03-01"),
		milestones: mockMilestones.map((m) => ({
			...m,
			isCompleted: true,
			percentageComplete: 100,
		})),
		drawing: mockDrawing,
	},
];

// Generate large dataset for performance testing
export function generateMockComponents(
	count: number,
): ComponentWithMilestones[] {
	const components: ComponentWithMilestones[] = [];
	const areas = ["401", "402", "403", "404", "405"];
	const systems = ["Cooling Water", "Process", "Steam", "Air", "Chemical"];
	const types = [
		"VALVE",
		"PIPE",
		"GASKET",
		"FLANGE",
		"INSTRUMENT",
		"SUPPORT",
	];
	const statuses = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"];
	const workflows = [
		"MILESTONE_DISCRETE",
		"MILESTONE_PERCENTAGE",
		"MILESTONE_QUANTITY",
	];

	for (let i = 0; i < count; i++) {
		const area = areas[i % areas.length];
		const system = systems[i % systems.length];
		const type = types[i % types.length];
		const status = statuses[i % statuses.length] as any;
		const workflow = workflows[i % workflows.length] as any;
		const progress =
			status === "COMPLETED"
				? 100
				: status === "IN_PROGRESS"
					? Math.floor(Math.random() * 99)
					: 0;

		components.push({
			id: `component-${i}`,
			projectId: "test-project-id",
			componentId: `${type}-${area}-${String(i).padStart(4, "0")}`,
			type,
			spec: "CS150",
			size: ['2"', '4"', '6"', '8"'][i % 4],
			material: "Carbon Steel",
			area,
			system,
			subSystem: null,
			testPackage: `TP-${area}-${String(Math.floor(i / 10)).padStart(2, "0")}`,
			workflowType: workflow,
			status,
			completionPercent: progress,
			totalQuantity:
				workflow === "MILESTONE_QUANTITY"
					? Math.floor(Math.random() * 500) + 50
					: 1,
			drawingId: `drawing-${Math.floor(i / 20)}`,
			drawingNumber: `P-${area}F${String(Math.floor(i / 20)).padStart(2, "0")}`,
			description: `${type} - ${system} System`,
			milestoneTemplateId: "template-1",
			installerUserId: status === "COMPLETED" ? "user-1" : null,
			installedAt: status === "COMPLETED" ? new Date("2024-03-01") : null,
			createdAt: new Date("2024-01-01"),
			updatedAt: new Date("2024-03-01"),
			milestones: [],
			drawing: {
				...mockDrawing,
				id: `drawing-${Math.floor(i / 20)}`,
				number: `P-${area}F${String(Math.floor(i / 20)).padStart(2, "0")}`,
			},
		});
	}

	return components;
}

// Test data for accessibility testing
export const accessibilityTestComponent: ComponentWithMilestones = {
	...mockComponents[0],
	componentId: "ACCESSIBLE-001",
	description:
		"Component with very long description that should be truncated properly in the UI to maintain layout consistency",
	area: "999",
	system: "Very Long System Name That Should Wrap",
};
