/**
 * MSW (Mock Service Worker) handlers for dashboard API endpoints
 * Used in unit and integration tests to mock Supabase RPC calls
 */

import { http, HttpResponse } from "msw";
import {
	smallDashboardData,
	mediumDashboardMetrics,
	largeDashboardMetrics,
	emptyDashboardData,
	allCompletedMetrics,
	allStalledMetrics,
	createErrorResponse,
	generateRecentActivity,
	simulateApiDelay,
	largeAreaSystemMatrix,
} from "../__fixtures__/dashboard-data";

// Base URL for Supabase REST API
const SUPABASE_URL =
	process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
const API_BASE = `${SUPABASE_URL}/rest/v1/rpc`;

// Error simulation flags (can be set in tests)
let shouldSimulateError = false;
let errorMessage = "Dashboard API Error";
let shouldSimulateSlowResponse = false;
let responseDelayMs = 2000;

// Test control functions
export const dashboardMockControls = {
	simulateError: (message = "Dashboard API Error") => {
		shouldSimulateError = true;
		errorMessage = message;
	},
	simulateSlowResponse: (delayMs = 2000) => {
		shouldSimulateSlowResponse = true;
		responseDelayMs = delayMs;
	},
	reset: () => {
		shouldSimulateError = false;
		shouldSimulateSlowResponse = false;
		errorMessage = "Dashboard API Error";
		responseDelayMs = 2000;
	},
};

// Helper to simulate different project scenarios
function getProjectScenario(projectId: string) {
	switch (projectId) {
		case "empty-project":
			return "empty";
		case "small-project":
			return "small";
		case "medium-project":
			return "medium";
		case "large-project":
			return "large";
		case "completed-project":
			return "completed";
		case "stalled-project":
			return "stalled";
		case "error-project":
			return "error";
		default:
			return "small"; // Default to small dataset
	}
}

export const dashboardHandlers = [
	// Dashboard Metrics RPC
	http.post(`${API_BASE}/get_dashboard_metrics`, async ({ request }) => {
		if (shouldSimulateSlowResponse) {
			await simulateApiDelay(responseDelayMs, responseDelayMs);
		}

		if (shouldSimulateError) {
			return HttpResponse.json(createErrorResponse(errorMessage), {
				status: 500,
			});
		}

		const body = (await request.json()) as { project_id: string };
		const projectId = body.project_id;

		if (!projectId) {
			return HttpResponse.json(
				createErrorResponse("Project ID is required"),
				{ status: 400 },
			);
		}

		const scenario = getProjectScenario(projectId);
		let metrics;

		switch (scenario) {
			case "empty":
				metrics = emptyDashboardData.metrics;
				break;
			case "small":
				metrics = smallDashboardData.metrics;
				break;
			case "medium":
				metrics = mediumDashboardMetrics;
				break;
			case "large":
				metrics = largeDashboardMetrics;
				break;
			case "completed":
				metrics = allCompletedMetrics;
				break;
			case "stalled":
				metrics = allStalledMetrics;
				break;
			case "error":
				return HttpResponse.json(
					createErrorResponse("Project not found"),
					{ status: 404 },
				);
			default:
				metrics = smallDashboardData.metrics;
		}

		return HttpResponse.json(metrics);
	}),

	// Area System Matrix RPC
	http.post(`${API_BASE}/get_area_system_matrix`, async ({ request }) => {
		if (shouldSimulateSlowResponse) {
			await simulateApiDelay(responseDelayMs, responseDelayMs);
		}

		if (shouldSimulateError) {
			return HttpResponse.json(createErrorResponse(errorMessage), {
				status: 500,
			});
		}

		const body = (await request.json()) as { project_id: string };
		const projectId = body.project_id;

		if (!projectId) {
			return HttpResponse.json(
				createErrorResponse("Project ID is required"),
				{ status: 400 },
			);
		}

		const scenario = getProjectScenario(projectId);
		let matrix;

		switch (scenario) {
			case "empty":
				matrix = emptyDashboardData.areaSystemMatrix;
				break;
			case "large":
				matrix = largeAreaSystemMatrix;
				break;
			case "error":
				return HttpResponse.json(
					createErrorResponse("Project not found"),
					{ status: 404 },
				);
			default:
				matrix = smallDashboardData.areaSystemMatrix;
		}

		return HttpResponse.json(matrix);
	}),

	// Drawing Rollups RPC
	http.post(`${API_BASE}/get_drawing_rollups`, async ({ request }) => {
		if (shouldSimulateSlowResponse) {
			await simulateApiDelay(responseDelayMs, responseDelayMs);
		}

		if (shouldSimulateError) {
			return HttpResponse.json(createErrorResponse(errorMessage), {
				status: 500,
			});
		}

		const body = (await request.json()) as { project_id: string };
		const projectId = body.project_id;

		if (!projectId) {
			return HttpResponse.json(
				createErrorResponse("Project ID is required"),
				{ status: 400 },
			);
		}

		const scenario = getProjectScenario(projectId);
		let drawings;

		switch (scenario) {
			case "empty":
				drawings = emptyDashboardData.drawingRollups;
				break;
			case "error":
				return HttpResponse.json(
					createErrorResponse("Project not found"),
					{ status: 404 },
				);
			default:
				drawings = smallDashboardData.drawingRollups;
		}

		return HttpResponse.json(drawings);
	}),

	// Test Package Readiness RPC
	http.post(`${API_BASE}/get_test_package_readiness`, async ({ request }) => {
		if (shouldSimulateSlowResponse) {
			await simulateApiDelay(responseDelayMs, responseDelayMs);
		}

		if (shouldSimulateError) {
			return HttpResponse.json(createErrorResponse(errorMessage), {
				status: 500,
			});
		}

		const body = (await request.json()) as { project_id: string };
		const projectId = body.project_id;

		if (!projectId) {
			return HttpResponse.json(
				createErrorResponse("Project ID is required"),
				{ status: 400 },
			);
		}

		const scenario = getProjectScenario(projectId);
		let packages;

		switch (scenario) {
			case "empty":
				packages = emptyDashboardData.testPackageReadiness;
				break;
			case "error":
				return HttpResponse.json(
					createErrorResponse("Project not found"),
					{ status: 404 },
				);
			default:
				packages = smallDashboardData.testPackageReadiness;
		}

		return HttpResponse.json(packages);
	}),

	// Recent Activity RPC
	http.post(`${API_BASE}/get_recent_activity`, async ({ request }) => {
		if (shouldSimulateSlowResponse) {
			await simulateApiDelay(responseDelayMs, responseDelayMs);
		}

		if (shouldSimulateError) {
			return HttpResponse.json(createErrorResponse(errorMessage), {
				status: 500,
			});
		}

		const body = (await request.json()) as {
			project_id: string;
			activity_limit?: number;
		};
		const projectId = body.project_id;
		const limit = body.activity_limit || 50;

		if (!projectId) {
			return HttpResponse.json(
				createErrorResponse("Project ID is required"),
				{ status: 400 },
			);
		}

		const scenario = getProjectScenario(projectId);
		let activity;

		switch (scenario) {
			case "empty":
				activity = emptyDashboardData.recentActivity;
				break;
			case "large":
				activity = generateRecentActivity(limit);
				break;
			case "error":
				return HttpResponse.json(
					createErrorResponse("Project not found"),
					{ status: 404 },
				);
			default:
				activity = smallDashboardData.recentActivity;
		}

		return HttpResponse.json(activity);
	}),

	// Project details (for context)
	http.get(`${SUPABASE_URL}/rest/v1/Project`, ({ request }) => {
		const url = new URL(request.url);
		const select = url.searchParams.get("select");
		const projectId = url.searchParams.get("id");

		if (!projectId) {
			return HttpResponse.json([], { status: 200 });
		}

		const scenario = getProjectScenario(projectId);
		if (scenario === "error") {
			return HttpResponse.json([], { status: 200 });
		}

		const project =
			scenario === "empty"
				? emptyDashboardData.project
				: smallDashboardData.project;

		return HttpResponse.json([project]);
	}),

	// Supabase auth session mock
	http.get(`${SUPABASE_URL}/auth/v1/user`, () => {
		return HttpResponse.json({
			id: "test-user-id",
			email: "test@pipetrak.com",
			user_metadata: {
				name: "Test User",
			},
		});
	}),

	// Generic RPC error handler for unknown functions
	http.post(`${API_BASE}/:functionName`, ({ params }) => {
		return HttpResponse.json(
			createErrorResponse(`Unknown RPC function: ${params.functionName}`),
			{ status: 404 },
		);
	}),
];

// Specialized handlers for different test scenarios
export const dashboardErrorHandlers = [
	...dashboardHandlers.map((handler) => {
		// Override all handlers to return errors
		if (handler.info?.path?.includes("/rpc/")) {
			return http.post(handler.info.path, () => {
				return HttpResponse.json(
					createErrorResponse("Database connection failed"),
					{ status: 500 },
				);
			});
		}
		return handler;
	}),
];

export const dashboardSlowHandlers = [
	...dashboardHandlers.map((handler) => {
		// Override all handlers to simulate slow responses
		if (handler.info?.path?.includes("/rpc/")) {
			return http.post(handler.info.path, async ({ request }) => {
				await simulateApiDelay(3000, 5000); // 3-5 second delay

				const body = (await request.json()) as { project_id: string };
				const projectId = body.project_id;
				const scenario = getProjectScenario(projectId);

				// Return appropriate data based on scenario
				switch (scenario) {
					case "empty":
						return HttpResponse.json(emptyDashboardData.metrics);
					default:
						return HttpResponse.json(smallDashboardData.metrics);
				}
			});
		}
		return handler;
	}),
];

// Handler for testing network failures
export const dashboardNetworkErrorHandlers = [
	http.post(`${API_BASE}/*`, () => {
		return HttpResponse.error();
	}),
];

// Handler for testing authentication failures
export const dashboardAuthErrorHandlers = [
	http.post(`${API_BASE}/*`, () => {
		return HttpResponse.json(
			{ error: "Authentication required" },
			{ status: 401 },
		);
	}),
	http.get(`${SUPABASE_URL}/auth/v1/user`, () => {
		return HttpResponse.json({ error: "Invalid session" }, { status: 401 });
	}),
];

// Utility to create custom project data
export function createProjectHandlers(projectId: string, customData: any) {
	return [
		http.post(`${API_BASE}/get_dashboard_metrics`, async ({ request }) => {
			const body = (await request.json()) as { project_id: string };
			if (body.project_id === projectId) {
				return HttpResponse.json(
					customData.metrics || smallDashboardData.metrics,
				);
			}
			return HttpResponse.json(smallDashboardData.metrics);
		}),
		// Add more handlers as needed for other RPC functions
	];
}

export default dashboardHandlers;
