import { http, HttpResponse } from "msw";
import {
	mockSimpleTree,
	mockDrawingDetail,
	mockFlatDrawings,
	mockComponentCounts,
} from "../__fixtures__/drawings";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const drawingHandlers = [
	// GET /api/pipetrak/drawings/project/:projectId/hierarchy
	http.get(
		`${BASE_URL}/api/pipetrak/drawings/project/:projectId/hierarchy`,
		({ params }) => {
			const { projectId } = params;

			// Simulate access denied for specific project
			if (projectId === "unauthorized") {
				return HttpResponse.json(
					{ error: "Project not found or access denied" },
					{ status: 403 },
				);
			}

			// Simulate empty project
			if (projectId === "empty") {
				return HttpResponse.json({
					data: [],
					metadata: {
						totalDrawings: 0,
						rootDrawings: 0,
					},
				});
			}

			// Return mock tree data
			return HttpResponse.json({
				data: mockSimpleTree,
				metadata: {
					totalDrawings: 4,
					rootDrawings: 2,
				},
			});
		},
	),

	// GET /api/pipetrak/drawings/:drawingId/details
	http.get(
		`${BASE_URL}/api/pipetrak/drawings/:drawingId/details`,
		({ params, request }) => {
			const { drawingId } = params;
			const url = new URL(request.url);
			const page = Number.parseInt(url.searchParams.get("page") || "1");
			const limit = Number.parseInt(
				url.searchParams.get("limit") || "50",
			);
			const status = url.searchParams.get("status");
			const search = url.searchParams.get("search");

			// Simulate not found
			if (drawingId === "not-found") {
				return HttpResponse.json(
					{ error: "Drawing not found or access denied" },
					{ status: 403 },
				);
			}

			// Generate mock components
			const totalComponents = 125;
			const components = Array.from({ length: limit }, (_, i) => ({
				id: `comp-${(page - 1) * limit + i + 1}`,
				projectId: "p1",
				drawingId: drawingId as string,
				componentId: `COMP-${String((page - 1) * limit + i + 1).padStart(3, "0")}`,
				displayId: `COMP-${String((page - 1) * limit + i + 1).padStart(3, "0")}-1`,
				type: ["Valve", "Pipe", "Fitting", "Instrument"][i % 4],
				status:
					status ||
					["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "ON_HOLD"][
						i % 4
					],
				completionPercent: (i % 4) * 25,
				workflowType: "MILESTONE_DISCRETE",
				milestoneTemplateId: "mt1",
				createdAt: new Date("2024-01-01"),
				updatedAt: new Date("2024-01-15"),
				milestones: [
					{
						id: `milestone-${i}-1`,
						milestoneName: "Receive",
						isCompleted: i % 4 >= 1,
						weight: 25,
					},
					{
						id: `milestone-${i}-2`,
						milestoneName: "Install",
						isCompleted: i % 4 >= 2,
						weight: 50,
					},
					{
						id: `milestone-${i}-3`,
						milestoneName: "Test",
						isCompleted: i % 4 >= 3,
						weight: 25,
					},
				],
				milestoneTemplate: {
					id: "mt1",
					name: "Standard",
				},
			})).filter((comp) => {
				// Apply search filter
				if (search) {
					return comp.componentId
						.toLowerCase()
						.includes(search.toLowerCase());
				}
				return true;
			});

			return HttpResponse.json({
				drawing: mockDrawingDetail,
				components: components.slice(0, limit),
				pagination: {
					page,
					limit,
					total: totalComponents,
					totalPages: Math.ceil(totalComponents / limit),
				},
			});
		},
	),

	// GET /api/pipetrak/drawings/project/:projectId/search
	http.get(
		`${BASE_URL}/api/pipetrak/drawings/project/:projectId/search`,
		({ request }) => {
			const url = new URL(request.url);
			const query = url.searchParams.get("q");
			const limit = Number.parseInt(
				url.searchParams.get("limit") || "20",
			);

			// Validate query length
			if (!query || query.length < 2) {
				return HttpResponse.json(
					{ error: "Search query must be at least 2 characters" },
					{ status: 400 },
				);
			}

			// Generate search results
			const searchResults = mockFlatDrawings
				.filter(
					(drawing) =>
						drawing.number
							.toLowerCase()
							.includes(query.toLowerCase()) ||
						drawing.title
							.toLowerCase()
							.includes(query.toLowerCase()),
				)
				.slice(0, limit)
				.map((drawing) => ({
					id: drawing.id,
					number: drawing.number,
					title: drawing.title,
					revision: drawing.revision,
					parentId: drawing.parentId,
					componentCount: Math.floor(Math.random() * 50),
					breadcrumb: drawing.parentId
						? [
								{
									id: "d1",
									number: "P&ID-001",
									title: "Main Process Flow",
								},
							]
						: [],
				}));

			return HttpResponse.json({ results: searchResults });
		},
	),

	// GET /api/pipetrak/drawings/project/:projectId (existing endpoint)
	http.get(
		`${BASE_URL}/api/pipetrak/drawings/project/:projectId`,
		({ params }) => {
			const { projectId } = params;

			if (projectId === "error") {
				return HttpResponse.json(
					{ error: "Failed to fetch drawings" },
					{ status: 500 },
				);
			}

			return HttpResponse.json(
				mockFlatDrawings.map((d) => ({
					...d,
					_count: { components: 10 },
					parent: null,
					children: [],
				})),
			);
		},
	),

	// POST /api/pipetrak/drawings (create drawing)
	http.post(`${BASE_URL}/api/pipetrak/drawings`, async ({ request }) => {
		const body = (await request.json()) as any;

		// Validate required fields
		if (!body.projectId || !body.number || !body.title) {
			return HttpResponse.json(
				{ error: "Invalid input", details: [] },
				{ status: 400 },
			);
		}

		// Return created drawing
		return HttpResponse.json(
			{
				id: `d-${Date.now()}`,
				...body,
				createdAt: new Date(),
				updatedAt: new Date(),
				parent: null,
				_count: { components: 0 },
			},
			{ status: 201 },
		);
	}),
];

// Error simulation handlers
export const errorHandlers = [
	// Network error simulation
	http.get(
		`${BASE_URL}/api/pipetrak/drawings/project/:projectId/hierarchy`,
		() => {
			return HttpResponse.error();
		},
	),

	// Timeout simulation
	http.get(
		`${BASE_URL}/api/pipetrak/drawings/:drawingId/details`,
		async () => {
			await new Promise((resolve) => setTimeout(resolve, 60000)); // 60 second delay
			return HttpResponse.json({});
		},
	),

	// Server error simulation
	http.get(
		`${BASE_URL}/api/pipetrak/drawings/project/:projectId/search`,
		() => {
			return HttpResponse.json(
				{ error: "Internal server error" },
				{ status: 500 },
			);
		},
	),
];

// Performance testing handlers (large datasets)
export const performanceHandlers = [
	// Large hierarchy (500+ drawings)
	http.get(
		`${BASE_URL}/api/pipetrak/drawings/project/large/hierarchy`,
		() => {
			const largeTree = Array.from({ length: 100 }, (_, i) => ({
				id: `root-${i}`,
				projectId: "large",
				number: `DWG-${String(i + 1).padStart(3, "0")}`,
				title: `Drawing ${i + 1}`,
				parentId: null,
				createdAt: new Date("2024-01-01"),
				updatedAt: new Date("2024-01-01"),
				componentCount: mockComponentCounts.inProgress,
				children: Array.from({ length: 5 }, (_, j) => ({
					id: `child-${i}-${j}`,
					projectId: "large",
					number: `DWG-${String(i + 1).padStart(3, "0")}-${j + 1}`,
					title: `Detail ${j + 1}`,
					parentId: `root-${i}`,
					createdAt: new Date("2024-01-02"),
					updatedAt: new Date("2024-01-02"),
					componentCount: mockComponentCounts.allNotStarted,
					children: [],
				})),
			}));

			return HttpResponse.json({
				data: largeTree,
				metadata: {
					totalDrawings: 600,
					rootDrawings: 100,
				},
			});
		},
	),

	// Large component list (1000+ components)
	http.get(
		`${BASE_URL}/api/pipetrak/drawings/large/details`,
		({ request }) => {
			const url = new URL(request.url);
			const page = Number.parseInt(url.searchParams.get("page") || "1");
			const limit = Number.parseInt(
				url.searchParams.get("limit") || "50",
			);

			const totalComponents = 1000;
			const components = Array.from({ length: limit }, (_, i) => ({
				id: `comp-${(page - 1) * limit + i + 1}`,
				projectId: "large",
				drawingId: "large",
				componentId: `COMP-${String((page - 1) * limit + i + 1).padStart(4, "0")}`,
				type: "Component",
				status: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"][i % 3],
				completionPercent: (i % 3) * 50,
				workflowType: "MILESTONE_DISCRETE",
				createdAt: new Date("2024-01-01"),
				updatedAt: new Date("2024-01-01"),
			}));

			return HttpResponse.json({
				drawing: mockDrawingDetail,
				components,
				pagination: {
					page,
					limit,
					total: totalComponents,
					totalPages: Math.ceil(totalComponents / limit),
				},
			});
		},
	),
];

// Combine all handlers for use in tests
export const allDrawingHandlers = [...drawingHandlers, ...performanceHandlers];
