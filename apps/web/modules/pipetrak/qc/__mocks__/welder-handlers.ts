import { HttpResponse, http } from "msw";
import { mockFieldWelds, mockWelders } from "../__fixtures__/welders";
import type {
	CreateWelderData,
	UpdateWelderData,
	Welder,
} from "../hooks/useWelders";

const API_BASE = "http://localhost:3000/api/pipetrak";

// Track created welders for test consistency
let welderDatabase = [...mockWelders];
let nextWelderId = welderDatabase.length + 1;

// Helper to find welder by stencil (for uniqueness validation)
const findWelderByStencil = (stencil: string, excludeId?: string) => {
	return welderDatabase.find(
		(w) =>
			w.stencil.toLowerCase() === stencil.toLowerCase() &&
			w.id !== excludeId,
	);
};

export const welderHandlers = [
	// Get welders with filtering
	http.get(`${API_BASE}/welders`, ({ request }) => {
		const url = new URL(request.url);
		const projectId = url.searchParams.get("projectId");
		const active = url.searchParams.get("active");
		const search = url.searchParams.get("search");

		if (!projectId) {
			return HttpResponse.json(
				{ error: "Project ID is required" },
				{ status: 400 },
			);
		}

		let welders = welderDatabase.filter((w) => w.projectId === projectId);

		// FileFilter by active status
		if (active !== null) {
			const isActive = active === "true";
			welders = welders.filter((w) => w.active === isActive);
		}

		// FileFilter by search term (stencil or name)
		if (search) {
			const searchLower = search.toLowerCase();
			welders = welders.filter(
				(w) =>
					w.stencil.toLowerCase().includes(searchLower) ||
					w.name.toLowerCase().includes(searchLower),
			);
		}

		// Sort by stencil for consistency
		welders.sort((a, b) => a.stencil.localeCompare(b.stencil));

		return HttpResponse.json({ welders });
	}),

	// Get single welder
	http.get(`${API_BASE}/welders/:id`, ({ params }) => {
		const welder = welderDatabase.find((w) => w.id === params.id);

		if (!welder) {
			return HttpResponse.json(
				{ error: "Welder not found" },
				{ status: 404 },
			);
		}

		return HttpResponse.json({ welder });
	}),

	// Create welder
	http.post(`${API_BASE}/welders`, async ({ request }) => {
		const data = (await request.json()) as CreateWelderData;

		// Validate required fields
		if (!data.stencil?.trim()) {
			return HttpResponse.json(
				{ error: "Stencil is required" },
				{ status: 400 },
			);
		}

		if (!data.name?.trim()) {
			return HttpResponse.json(
				{ error: "Name is required" },
				{ status: 400 },
			);
		}

		if (!data.projectId) {
			return HttpResponse.json(
				{ error: "Project ID is required" },
				{ status: 400 },
			);
		}

		// Validate stencil format (letters, numbers, and hyphens)
		if (!/^[A-Za-z0-9-]+$/.test(data.stencil)) {
			return HttpResponse.json(
				{
					error: "Stencil must contain only letters, numbers, and hyphens",
				},
				{ status: 400 },
			);
		}

		// Validate name length
		if (data.name.trim().length < 2) {
			return HttpResponse.json(
				{ error: "Name must be at least 2 characters" },
				{ status: 400 },
			);
		}

		// Check for stencil uniqueness (global check)
		const existingWelder = findWelderByStencil(data.stencil);
		if (existingWelder) {
			return HttpResponse.json(
				{ error: "A welder with this stencil already exists" },
				{ status: 409 },
			);
		}

		// Create new welder
		const newWelder: Welder = {
			id: `welder-${String(nextWelderId++).padStart(3, "0")}`,
			projectId: data.projectId,
			stencil: data.stencil.trim().toUpperCase(),
			name: data.name.trim(),
			active: data.active ?? true,
			weldCount: 0,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		welderDatabase.push(newWelder);

		return HttpResponse.json(
			{ welder: newWelder, message: "Welder created successfully" },
			{ status: 201 },
		);
	}),

	// Update welder
	http.put(`${API_BASE}/welders/:id`, async ({ params, request }) => {
		const data = (await request.json()) as UpdateWelderData;
		const welderId = params.id as string;

		const welderIndex = welderDatabase.findIndex((w) => w.id === welderId);
		if (welderIndex === -1) {
			return HttpResponse.json(
				{ error: "Welder not found" },
				{ status: 404 },
			);
		}

		const welder = welderDatabase[welderIndex];

		// Validate name if provided
		if (data.name !== undefined) {
			if (!data.name?.trim()) {
				return HttpResponse.json(
					{ error: "Name is required" },
					{ status: 400 },
				);
			}

			if (data.name.trim().length < 2) {
				return HttpResponse.json(
					{ error: "Name must be at least 2 characters" },
					{ status: 400 },
				);
			}
		}

		// Update welder
		const updatedWelder: Welder = {
			...welder,
			...(data.name !== undefined && { name: data.name.trim() }),
			...(data.active !== undefined && { active: data.active }),
			updatedAt: new Date().toISOString(),
		};

		welderDatabase[welderIndex] = updatedWelder;

		return HttpResponse.json({
			welder: updatedWelder,
			message: "Welder updated successfully",
		});
	}),

	// Delete/deactivate welder
	http.delete(`${API_BASE}/welders/:id`, ({ params }) => {
		const welderId = params.id as string;
		const welderIndex = welderDatabase.findIndex((w) => w.id === welderId);

		if (welderIndex === -1) {
			return HttpResponse.json(
				{ error: "Welder not found" },
				{ status: 404 },
			);
		}

		const welder = welderDatabase[welderIndex];

		// If welder has associated welds, deactivate instead of delete
		if (welder.weldCount > 0) {
			welderDatabase[welderIndex] = {
				...welder,
				active: false,
				updatedAt: new Date().toISOString(),
			};

			return HttpResponse.json({
				message: `Welder "${welder.name}" has been deactivated due to associated welds`,
				deactivated: true,
			});
		}

		// Hard delete if no associated welds
		welderDatabase.splice(welderIndex, 1);

		return HttpResponse.json({
			message: `Welder "${welder.name}" has been deleted`,
			deleted: true,
		});
	}),

	// Get welder statistics
	http.get(`${API_BASE}/welders/:id/stats`, ({ params }) => {
		const welder = welderDatabase.find((w) => w.id === params.id);

		if (!welder) {
			return HttpResponse.json(
				{ error: "Welder not found" },
				{ status: 404 },
			);
		}

		// Mock statistics
		const stats = {
			totalWelds: welder.weldCount,
			weldTypes: {
				BW: Math.floor(welder.weldCount * 0.6),
				SW: Math.floor(welder.weldCount * 0.3),
				FW: Math.floor(welder.weldCount * 0.1),
			},
			lastWeldDate:
				welder.weldCount > 0 ? new Date().toISOString() : null,
			averageWeldsPerDay: welder.weldCount > 0 ? 2.5 : 0,
		};

		return HttpResponse.json(stats);
	}),

	// Field welds endpoints (for integration testing)
	http.get(`${API_BASE}/field-welds`, ({ request }) => {
		const url = new URL(request.url);
		const projectId = url.searchParams.get("projectId");
		const welderId = url.searchParams.get("welderId");

		let welds = mockFieldWelds.filter((w) => w.projectId === projectId);

		if (welderId) {
			welds = welds.filter((w) => w.welderId === welderId);
		}

		return HttpResponse.json({ welds });
	}),

	// Create field weld (for integration testing)
	http.post(`${API_BASE}/field-welds`, async ({ request }) => {
		const data = (await request.json()) as any;

		// Validate welder is provided and exists
		if (!data.welderId) {
			return HttpResponse.json(
				{ error: "Welder selection is required" },
				{ status: 400 },
			);
		}

		const welder = welderDatabase.find((w) => w.id === data.welderId);
		if (!welder) {
			return HttpResponse.json(
				{ error: "Selected welder not found" },
				{ status: 400 },
			);
		}

		if (!welder.active) {
			return HttpResponse.json(
				{ error: "Cannot assign welds to inactive welders" },
				{ status: 400 },
			);
		}

		// Create field weld
		const newWeld = {
			id: `weld-${Date.now()}`,
			...data,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		// Update welder's weld count
		const welderIndex = welderDatabase.findIndex(
			(w) => w.id === data.welderId,
		);
		if (welderIndex !== -1) {
			welderDatabase[welderIndex] = {
				...welderDatabase[welderIndex],
				weldCount: welderDatabase[welderIndex].weldCount + 1,
				updatedAt: new Date().toISOString(),
			};
		}

		return HttpResponse.json(
			{ weld: newWeld, message: "Field weld created successfully" },
			{ status: 201 },
		);
	}),
];

// Error handlers for testing error scenarios
export const welderErrorHandlers = [
	http.get(`${API_BASE}/welders`, () => {
		return HttpResponse.json(
			{ error: "Failed to fetch welders" },
			{ status: 500 },
		);
	}),

	http.post(`${API_BASE}/welders`, () => {
		return HttpResponse.json(
			{ error: "Failed to create welder" },
			{ status: 500 },
		);
	}),

	http.put(`${API_BASE}/welders/:id`, () => {
		return HttpResponse.json(
			{ error: "Failed to update welder" },
			{ status: 500 },
		);
	}),

	http.delete(`${API_BASE}/welders/:id`, () => {
		return HttpResponse.json(
			{ error: "Failed to delete welder" },
			{ status: 500 },
		);
	}),

	http.post(`${API_BASE}/field-welds`, () => {
		return HttpResponse.json(
			{ error: "Failed to create field weld" },
			{ status: 500 },
		);
	}),
];

// Network delay handlers for testing loading states
export const welderDelayHandlers = [
	http.get(`${API_BASE}/welders`, async () => {
		await new Promise((resolve) => setTimeout(resolve, 2000));
		return HttpResponse.json({ welders: mockWelders });
	}),

	http.post(`${API_BASE}/welders`, async ({ request }) => {
		await new Promise((resolve) => setTimeout(resolve, 1500));
		const data = (await request.json()) as CreateWelderData;

		const newWelder: Welder = {
			id: `welder-delayed-${Date.now()}`,
			projectId: data.projectId,
			stencil: data.stencil.trim().toUpperCase(),
			name: data.name.trim(),
			active: data.active ?? true,
			weldCount: 0,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		return HttpResponse.json(
			{ welder: newWelder, message: "Welder created successfully" },
			{ status: 201 },
		);
	}),

	http.put(`${API_BASE}/welders/:id`, async ({ params, request }) => {
		await new Promise((resolve) => setTimeout(resolve, 1000));
		const data = (await request.json()) as UpdateWelderData;

		const welder = welderDatabase.find((w) => w.id === params.id);
		if (!welder) {
			return HttpResponse.json(
				{ error: "Welder not found" },
				{ status: 404 },
			);
		}

		const updatedWelder: Welder = {
			...welder,
			...(data.name !== undefined && { name: data.name.trim() }),
			...(data.active !== undefined && { active: data.active }),
			updatedAt: new Date().toISOString(),
		};

		return HttpResponse.json({
			welder: updatedWelder,
			message: "Welder updated successfully",
		});
	}),

	http.delete(`${API_BASE}/welders/:id`, async ({ params }) => {
		await new Promise((resolve) => setTimeout(resolve, 1000));
		const welder = welderDatabase.find((w) => w.id === params.id);

		if (!welder) {
			return HttpResponse.json(
				{ error: "Welder not found" },
				{ status: 404 },
			);
		}

		return HttpResponse.json({
			message:
				welder.weldCount > 0
					? `Welder "${welder.name}" has been deactivated due to associated welds`
					: `Welder "${welder.name}" has been deleted`,
			deactivated: welder.weldCount > 0,
			deleted: welder.weldCount === 0,
		});
	}),
];

// Validation-specific handlers for testing edge cases
export const welderValidationHandlers = [
	// Test duplicate stencil scenarios
	http.post(`${API_BASE}/welders`, async ({ request }) => {
		const data = (await request.json()) as CreateWelderData;

		// Simulate specific validation scenarios
		if (data.stencil === "DUPLICATE") {
			return HttpResponse.json(
				{ error: "A welder with this stencil already exists" },
				{ status: 409 },
			);
		}

		if (data.stencil === "INVALID@123") {
			return HttpResponse.json(
				{
					error: "Stencil must contain only letters, numbers, and hyphens",
				},
				{ status: 400 },
			);
		}

		if (data.stencil === "INVALID_123") {
			return HttpResponse.json(
				{
					error: "Stencil must contain only letters, numbers, and hyphens",
				},
				{ status: 400 },
			);
		}

		if (data.name === "X") {
			return HttpResponse.json(
				{ error: "Name must be at least 2 characters" },
				{ status: 400 },
			);
		}

		// Default success for valid data
		const newWelder: Welder = {
			id: `welder-validation-${Date.now()}`,
			projectId: data.projectId,
			stencil: data.stencil.trim().toUpperCase(),
			name: data.name.trim(),
			active: data.active ?? true,
			weldCount: 0,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		return HttpResponse.json(
			{ welder: newWelder, message: "Welder created successfully" },
			{ status: 201 },
		);
	}),
];

// Reset handler for test isolation
export const resetWelderDatabase = () => {
	welderDatabase = [...mockWelders];
	nextWelderId = welderDatabase.length + 1;
};
