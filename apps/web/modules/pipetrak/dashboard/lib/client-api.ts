"use client";

import type {
	ComponentFileFilters,
	ComponentWithMilestones,
} from "../../types";

/**
 * Client-side API functions for dashboard
 */

/**
 * Fetch dashboard components from API
 */
export async function fetchDashboardComponentsClient(
	projectId: string,
	filters: ComponentFileFilters = {},
	limit = 100,
	offset = 0,
): Promise<{ components: ComponentWithMilestones[]; total: number }> {
	try {
		// Build query params
		const params = new URLSearchParams({
			projectId,
			limit: limit.toString(),
			offset: offset.toString(),
		});

		// Add filters to params
		if (filters.area?.length) params.set("area", filters.area.join(","));
		if (filters.system?.length)
			params.set("system", filters.system.join(","));
		if (filters.status?.length)
			params.set("status", filters.status.join(","));
		if (filters.testPackage?.length)
			params.set("testPackage", filters.testPackage.join(","));
		if (filters.drawing?.length)
			params.set("drawing", filters.drawing.join(","));
		if (filters.search) params.set("search", filters.search);

		const response = await fetch(
			`/api/pipetrak/dashboard/components?${params}`,
		);

		if (!response.ok) {
			throw new Error(
				`Failed to fetch components: ${response.statusText}`,
			);
		}

		return await response.json();
	} catch (error) {
		console.error(
			"[Client API] Error fetching dashboard components:",
			error,
		);
		return { components: [], total: 0 };
	}
}
