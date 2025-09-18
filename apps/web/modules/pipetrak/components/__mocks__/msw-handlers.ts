import { HttpResponse, http } from "msw";
import {
	generateMockComponents,
	mockComponents,
	mockProject,
} from "../__fixtures__/components";
import {
	milestoneDelayHandlers,
	milestoneErrorHandlers,
	milestoneHandlers,
} from "./milestone-handlers";

const API_BASE = "http://localhost:3000/api/pipetrak";

export const handlers = [
	// Include milestone handlers
	...milestoneHandlers,

	// Get components
	http.get(`${API_BASE}/components`, ({ request }) => {
		const url = new URL(request.url);
		const projectId = url.searchParams.get("projectId");
		const limit = Number.parseInt(url.searchParams.get("limit") || "100");
		const offset = Number.parseInt(url.searchParams.get("offset") || "0");
		const search = url.searchParams.get("search");
		const area = url.searchParams.get("area");
		const system = url.searchParams.get("system");
		const status = url.searchParams.get("status");

		let components =
			projectId === "large-dataset"
				? generateMockComponents(10000)
				: mockComponents;

		// Apply filters
		if (search) {
			const searchLower = search.toLowerCase();
			components = components.filter(
				(c) =>
					c.componentId.toLowerCase().includes(searchLower) ||
					c.type?.toLowerCase().includes(searchLower) ||
					c.description?.toLowerCase().includes(searchLower),
			);
		}

		if (area && area !== "all") {
			components = components.filter((c) => c.area === area);
		}

		if (system && system !== "all") {
			components = components.filter((c) => c.system === system);
		}

		if (status && status !== "all") {
			components = components.filter((c) => c.status === status);
		}

		// Apply pagination
		const paginatedComponents = components.slice(offset, offset + limit);

		return HttpResponse.json(paginatedComponents);
	}),

	// Get single component
	http.get(`${API_BASE}/components/:id`, ({ params }) => {
		const component = mockComponents.find((c) => c.id === params.id);

		if (!component) {
			return new HttpResponse(null, { status: 404 });
		}

		return HttpResponse.json(component);
	}),

	// Update component
	http.patch(`${API_BASE}/components/:id`, async ({ params, request }) => {
		const updates = await request.json();
		const component = mockComponents.find((c) => c.id === params.id);

		if (!component) {
			return new HttpResponse(null, { status: 404 });
		}

		// Simulate update
		const updated = {
			...component,
			...(updates && typeof updates === "object" ? updates : {}),
			updatedAt: new Date(),
		};

		return HttpResponse.json(updated);
	}),

	// Bulk update components
	http.patch(`${API_BASE}/components/bulk`, async ({ request }) => {
		const { componentIds, updates } = (await request.json()) as any;

		const updatedComponents = mockComponents
			.filter((c) => componentIds.includes(c.id))
			.map((c) => ({
				...c,
				...(updates && typeof updates === "object" ? updates : {}),
				updatedAt: new Date(),
			}));

		return HttpResponse.json({
			updated: updatedComponents.length,
			components: updatedComponents,
		});
	}),

	// Update milestone
	http.patch(`${API_BASE}/milestones/:id`, async ({ params, request }) => {
		const updates = await request.json();

		// Simulate milestone update
		return HttpResponse.json({
			id: params.id,
			...(updates && typeof updates === "object" ? updates : {}),
			updatedAt: new Date(),
		});
	}),

	// Export components
	http.get(`${API_BASE}/components/export`, ({ request }) => {
		const url = new URL(request.url);
		const format = url.searchParams.get("format") || "csv";

		if (format === "csv") {
			const csv =
				"componentId,type,status,progress\n" +
				mockComponents
					.map(
						(c) =>
							`${c.componentId},${c.type},${c.status},${c.completionPercent}`,
					)
					.join("\n");

			return new HttpResponse(csv, {
				headers: {
					"Content-Type": "text/csv",
					"Content-Disposition":
						'attachment; filename="components.csv"',
				},
			});
		}

		return HttpResponse.json(
			{ error: "Unsupported format" },
			{ status: 400 },
		);
	}),

	// Get project
	http.get(`${API_BASE}/projects/:id`, ({ params }) => {
		if (params.id === mockProject.id) {
			return HttpResponse.json(mockProject);
		}

		return new HttpResponse(null, { status: 404 });
	}),
];

// Error handlers for testing error scenarios
export const errorHandlers = [
	...milestoneErrorHandlers,

	http.get(`${API_BASE}/components`, () => {
		return new HttpResponse(null, { status: 500 });
	}),

	http.patch(`${API_BASE}/components/:id`, () => {
		return new HttpResponse(null, { status: 500 });
	}),

	http.patch(`${API_BASE}/components/bulk`, () => {
		return new HttpResponse(null, { status: 500 });
	}),
];

// Network delay handlers for testing loading states
export const delayHandlers = [
	...milestoneDelayHandlers,

	http.get(`${API_BASE}/components`, async () => {
		await new Promise((resolve) => setTimeout(resolve, 2000));
		return HttpResponse.json(mockComponents);
	}),
];
