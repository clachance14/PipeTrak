"use server";

import type { Component, ComponentWithMilestones } from "../../types";
import { getServerApiClient } from "@shared/lib/server";
import { headers } from "next/headers";

// Server actions for components

export async function getComponents(
	projectId: string,
): Promise<ComponentWithMilestones[]> {
	try {
		const apiClient = await getServerApiClient();
		const response = await apiClient.pipetrak.components.$get({
			query: { projectId, limit: "10000" },
		});

		if (!response.ok) {
			console.error("Failed to fetch components");
			return [];
		}

		const data = await response.json();

		// Transform the data to include drawingNumber for display
		const components = data.data.map((comp: any) => ({
			...comp,
			drawingNumber: comp.drawing?.number || comp.drawingId || "-",
			description:
				comp.description ||
				`${comp.type || ""} ${comp.spec || ""} ${comp.size || ""}`.trim() ||
				"-",
		}));

		return components;
	} catch (error) {
		console.error("Error fetching components:", error);
		return [];
	}
}

export async function updateComponentMilestone(
	_componentId: string,
	milestoneId: string,
	updates: {
		isCompleted?: boolean;
		percentageValue?: number;
		quantityValue?: number;
	},
): Promise<void> {
	try {
		// Use direct fetch as a workaround for the typed client issue
		const headersList = await headers();
		const baseUrl =
			process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

		const response = await fetch(
			`${baseUrl}/api/pipetrak/milestones/${milestoneId}`,
			{
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Cookie: headersList.get("cookie") || "",
				},
				body: JSON.stringify(updates),
			},
		);

		if (!response.ok) {
			const errorText = await response.text();
			console.error("Failed to update milestone:", errorText);

			// Parse error message for better user feedback
			let errorMessage = `Failed to update milestone: ${response.status}`;
			try {
				const errorData = JSON.parse(errorText);
				if (errorData.error) {
					errorMessage = errorData.error;

					// Add helpful context for common errors
					if (
						errorData.error.includes("not a member of organization")
					) {
						errorMessage +=
							". Please contact your administrator to be added to the organization.";
					}
				}
			} catch (e) {
				// If error text is not JSON, use the status code message
			}

			throw new Error(errorMessage);
		}
	} catch (error) {
		console.error("Error updating milestone:", error);
		throw error;
	}
}

export async function getComponentDetails(
	componentId: string,
): Promise<ComponentWithMilestones | null> {
	try {
		const apiClient = await getServerApiClient();
		const response = await apiClient.pipetrak.components[":id"].$get({
			param: { id: componentId },
		});

		if (!response.ok) {
			console.error("Failed to fetch component details");
			return null;
		}

		const data = await response.json();

		// Transform the data to include drawingNumber for display
		return ({
			...data,
			drawingNumber: data.drawing?.number || data.drawingId || "-",
			description:
				data.description ||
				`${data.type || ""} ${data.spec || ""} ${data.size || ""}`.trim() ||
				"-",
			milestones: data.milestones?.map((milestone: any) => ({
				...milestone,
				completedAt: milestone.completedAt ? new Date(milestone.completedAt) : null,
				createdAt: new Date(milestone.createdAt),
				updatedAt: new Date(milestone.updatedAt),
			})) || [],
		} as any);
	} catch (error) {
		console.error("Error fetching component details:", error);
		return null;
	}
}

// Alias for backwards compatibility
export const getComponent = getComponentDetails;

export async function bulkUpdateComponents(
	componentIds: string[],
	updates: Partial<Component>,
): Promise<void> {
	try {
		const apiClient = await getServerApiClient();
		const response = await (apiClient as any).pipetrak.components.bulk.$patch({
			json: { componentIds, updates },
		});

		if (!response.ok) {
			throw new Error("Failed to bulk update components");
		}
	} catch (error) {
		console.error("Error bulk updating components:", error);
		throw error;
	}
}

export async function exportComponents(
	projectId: string,
	format: "csv" | "excel" = "csv",
): Promise<Blob> {
	try {
		const apiClient = await getServerApiClient();
		const response = await (apiClient as any).pipetrak.components.export.$get({
			query: { projectId, format },
		});

		if (!response.ok) {
			throw new Error("Failed to export components");
		}

		return await response.blob();
	} catch (error) {
		console.error("Error exporting components:", error);
		throw error;
	}
}
