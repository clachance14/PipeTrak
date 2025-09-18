import type {
	Drawing,
	DrawingComponentCount,
	DrawingTreeNode,
} from "../../types";

// Sample component counts for different statuses
export const mockComponentCounts: Record<string, DrawingComponentCount> = {
	empty: {
		total: 0,
		notStarted: 0,
		inProgress: 0,
		completed: 0,
		onHold: 0,
	},
	allNotStarted: {
		total: 10,
		notStarted: 10,
		inProgress: 0,
		completed: 0,
		onHold: 0,
	},
	inProgress: {
		total: 25,
		notStarted: 10,
		inProgress: 10,
		completed: 5,
		onHold: 0,
	},
	mostlyComplete: {
		total: 50,
		notStarted: 2,
		inProgress: 3,
		completed: 43,
		onHold: 2,
	},
	allComplete: {
		total: 15,
		notStarted: 0,
		inProgress: 0,
		completed: 15,
		onHold: 0,
	},
};

// Simple flat drawing list
export const mockFlatDrawings: Drawing[] = [
	{
		id: "d1",
		projectId: "p1",
		number: "P&ID-001",
		title: "Main Process Flow",
		revision: "A",
		parentId: null,
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-15"),
	},
	{
		id: "d2",
		projectId: "p1",
		number: "P&ID-001-A",
		title: "Process Flow Detail A",
		parentId: "d1",
		createdAt: new Date("2024-01-02"),
		updatedAt: new Date("2024-01-16"),
	},
	{
		id: "d3",
		projectId: "p1",
		number: "P&ID-001-B",
		title: "Process Flow Detail B",
		parentId: "d1",
		createdAt: new Date("2024-01-03"),
		updatedAt: new Date("2024-01-17"),
	},
	{
		id: "d4",
		projectId: "p1",
		number: "P&ID-002",
		title: "Secondary Process",
		revision: "B",
		parentId: null,
		createdAt: new Date("2024-01-04"),
		updatedAt: new Date("2024-01-18"),
	},
	{
		id: "d5",
		projectId: "p1",
		number: "P&ID-001-A-1",
		title: "Sub Detail A1",
		parentId: "d2",
		createdAt: new Date("2024-01-05"),
		updatedAt: new Date("2024-01-19"),
	},
];

// Simple tree structure (2 levels)
export const mockSimpleTree: DrawingTreeNode[] = [
	{
		id: "d1",
		projectId: "p1",
		number: "P&ID-001",
		title: "Main Process Flow",
		revision: "A",
		parentId: null,
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-15"),
		componentCount: mockComponentCounts.inProgress,
		children: [
			{
				id: "d2",
				projectId: "p1",
				number: "P&ID-001-A",
				title: "Process Flow Detail A",
				parentId: "d1",
				createdAt: new Date("2024-01-02"),
				updatedAt: new Date("2024-01-16"),
				componentCount: mockComponentCounts.allNotStarted,
				children: [],
			},
			{
				id: "d3",
				projectId: "p1",
				number: "P&ID-001-B",
				title: "Process Flow Detail B",
				parentId: "d1",
				createdAt: new Date("2024-01-03"),
				updatedAt: new Date("2024-01-17"),
				componentCount: mockComponentCounts.mostlyComplete,
				children: [],
			},
		],
	},
	{
		id: "d4",
		projectId: "p1",
		number: "P&ID-002",
		title: "Secondary Process",
		revision: "B",
		parentId: null,
		createdAt: new Date("2024-01-04"),
		updatedAt: new Date("2024-01-18"),
		componentCount: mockComponentCounts.allComplete,
		children: [],
	},
];

// Deep nested tree (5 levels)
export const mockDeepTree: DrawingTreeNode[] = [
	{
		id: "d1",
		projectId: "p1",
		number: "AREA-01",
		title: "Area 1 Overview",
		parentId: null,
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-01"),
		componentCount: mockComponentCounts.inProgress,
		children: [
			{
				id: "d2",
				projectId: "p1",
				number: "AREA-01-UNIT-01",
				title: "Unit 1",
				parentId: "d1",
				createdAt: new Date("2024-01-02"),
				updatedAt: new Date("2024-01-02"),
				componentCount: mockComponentCounts.inProgress,
				children: [
					{
						id: "d3",
						projectId: "p1",
						number: "AREA-01-UNIT-01-SYS-01",
						title: "System 1",
						parentId: "d2",
						createdAt: new Date("2024-01-03"),
						updatedAt: new Date("2024-01-03"),
						componentCount: mockComponentCounts.allNotStarted,
						children: [
							{
								id: "d4",
								projectId: "p1",
								number: "AREA-01-UNIT-01-SYS-01-SUB-01",
								title: "Subsystem 1",
								parentId: "d3",
								createdAt: new Date("2024-01-04"),
								updatedAt: new Date("2024-01-04"),
								componentCount:
									mockComponentCounts.allNotStarted,
								children: [
									{
										id: "d5",
										projectId: "p1",
										number: "AREA-01-UNIT-01-SYS-01-SUB-01-DET-01",
										title: "Detail 1",
										parentId: "d4",
										createdAt: new Date("2024-01-05"),
										updatedAt: new Date("2024-01-05"),
										componentCount:
											mockComponentCounts.empty,
										children: [],
									},
								],
							},
						],
					},
				],
			},
		],
	},
];

// Large tree with many siblings (for performance testing)
export const mockLargeTree: DrawingTreeNode[] = Array.from(
	{ length: 50 },
	(_, i) => ({
		id: `root-${i}`,
		projectId: "p1",
		number: `DWG-${String(i + 1).padStart(3, "0")}`,
		title: `Drawing ${i + 1}`,
		parentId: null,
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-01"),
		componentCount: mockComponentCounts.inProgress,
		children: Array.from({ length: 10 }, (_, j) => ({
			id: `child-${i}-${j}`,
			projectId: "p1",
			number: `DWG-${String(i + 1).padStart(3, "0")}-${String(j + 1).padStart(2, "0")}`,
			title: `Drawing ${i + 1} Detail ${j + 1}`,
			parentId: `root-${i}`,
			createdAt: new Date("2024-01-02"),
			updatedAt: new Date("2024-01-02"),
			componentCount:
				j % 3 === 0
					? mockComponentCounts.allComplete
					: mockComponentCounts.inProgress,
			children: [],
		})),
	}),
);

// Empty tree
export const mockEmptyTree: DrawingTreeNode[] = [];

// Tree with orphaned nodes (missing parents)
export const mockOrphanedDrawings: Drawing[] = [
	{
		id: "d1",
		projectId: "p1",
		number: "DWG-001",
		title: "Root Drawing",
		parentId: null,
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-01"),
	},
	{
		id: "d2",
		projectId: "p1",
		number: "DWG-002",
		title: "Orphaned Child",
		parentId: "missing-parent", // Parent doesn't exist
		createdAt: new Date("2024-01-02"),
		updatedAt: new Date("2024-01-02"),
	},
	{
		id: "d3",
		projectId: "p1",
		number: "DWG-001-A",
		title: "Valid Child",
		parentId: "d1",
		createdAt: new Date("2024-01-03"),
		updatedAt: new Date("2024-01-03"),
	},
];

// Drawing detail with components
export const mockDrawingDetail = {
	id: "d1",
	projectId: "p1",
	number: "P&ID-001",
	title: "Main Process Flow",
	revision: "A",
	parentId: null,
	filePath: "/drawings/P&ID-001.pdf",
	fileUrl: "https://example.com/drawings/P&ID-001.pdf",
	createdAt: new Date("2024-01-01"),
	updatedAt: new Date("2024-01-15"),
	project: {
		id: "p1",
		jobName: "Test Project",
		jobNumber: "JOB-001",
		organizationId: "org1",
	},
	parent: null,
	children: [
		{
			id: "d2",
			number: "P&ID-001-A",
			title: "Process Flow Detail A",
			_count: { components: 10 },
		},
		{
			id: "d3",
			number: "P&ID-001-B",
			title: "Process Flow Detail B",
			_count: { components: 25 },
		},
	],
};
