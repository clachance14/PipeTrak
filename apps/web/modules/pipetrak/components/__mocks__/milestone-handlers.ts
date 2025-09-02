import { http, HttpResponse, delay } from "msw";
import {
	mockMilestones,
	mockMilestoneStats,
	testScenarios,
	performanceTestData,
} from "../__fixtures__/milestones";
import type { ComponentMilestone } from "../../types";

const API_BASE = "http://localhost:3000/api/pipetrak";

// In-memory state for testing
const milestoneState = new Map<string, ComponentMilestone>();
const transactionHistory = new Map<string, any>();
const conflictState = new Map<
	string,
	{ local: ComponentMilestone; remote: ComponentMilestone }
>();

// Initialize state
mockMilestones.forEach((milestone) => {
	milestoneState.set(milestone.id, { ...milestone });
});

export const milestoneHandlers = [
	// Get milestones for a component
	http.get(
		`${API_BASE}/milestones/component/:componentId`,
		async ({ params, request }) => {
			const url = new URL(request.url);
			const performanceMode = url.searchParams.get("performance");

			if (performanceMode === "slow") {
				await delay(performanceTestData.delays.slow);
			} else if (performanceMode === "timeout") {
				await delay(performanceTestData.delays.timeout);
				return new HttpResponse(null, { status: 408 });
			}

			const componentMilestones = Array.from(milestoneState.values())
				.filter((m) => m.componentId === params.componentId)
				.sort((a, b) => a.milestoneOrder - b.milestoneOrder);

			return HttpResponse.json(componentMilestones);
		},
	),

	// Update single milestone
	http.patch(`${API_BASE}/milestones/:id`, async ({ params, request }) => {
		const milestoneId = params.id as string;
		const updates = (await request.json()) as any;
		const url = new URL(request.url);
		const testMode = url.searchParams.get("test");

		// Handle different test scenarios
		if (testMode === "network-error") {
			return new HttpResponse(null, { status: 500 });
		}

		if (testMode === "conflict") {
			// Simulate conflict scenario
			const conflicted = testScenarios.conflictedMilestone;
			conflictState.set(milestoneId, conflicted);
			return HttpResponse.json(conflicted.remote, { status: 409 });
		}

		if (testMode === "slow") {
			await delay(performanceTestData.delays.slow);
		}

		const existingMilestone = milestoneState.get(milestoneId);
		if (!existingMilestone) {
			return HttpResponse.json(
				{
					error: "Milestone not found",
					code: "MILESTONE_NOT_FOUND",
				},
				{ status: 404 },
			);
		}

		// Apply updates based on workflow type and field
		const updatedMilestone = { ...existingMilestone };
		const now = new Date();

		if ("isCompleted" in updates) {
			updatedMilestone.isCompleted = updates.isCompleted;
			updatedMilestone.completedAt = updates.isCompleted ? now : null;
			updatedMilestone.completedBy = updates.isCompleted
				? "test-user"
				: null;
		}

		if ("percentageValue" in updates) {
			updatedMilestone.percentageComplete = updates.percentageValue;
			updatedMilestone.isCompleted = updates.percentageValue >= 100;
			updatedMilestone.completedAt = updatedMilestone.isCompleted
				? now
				: null;
			updatedMilestone.completedBy = updatedMilestone.isCompleted
				? "test-user"
				: null;
		}

		if ("quantityValue" in updates) {
			updatedMilestone.quantityComplete = updates.quantityValue;
			updatedMilestone.isCompleted =
				updates.quantityValue >= (updatedMilestone.quantityTotal || 0);
			updatedMilestone.completedAt = updatedMilestone.isCompleted
				? now
				: null;
			updatedMilestone.completedBy = updatedMilestone.isCompleted
				? "test-user"
				: null;
		}

		updatedMilestone.updatedAt = now;

		// Update state
		milestoneState.set(milestoneId, updatedMilestone);

		return HttpResponse.json(updatedMilestone);
	}),

	// Bulk update milestones
	http.post(`${API_BASE}/milestones/bulk-update`, async ({ request }) => {
		const {
			updates,
			options = {},
			metadata,
		} = (await request.json()) as any;
		const url = new URL(request.url);
		const testMode = url.searchParams.get("test");

		// Handle test scenarios
		if (testMode === "network-error") {
			return new HttpResponse(null, { status: 500 });
		}

		if (testMode === "partial-failure") {
			await delay(500);
			return HttpResponse.json({
				successful: Math.floor(updates.length * 0.8),
				failed: Math.ceil(updates.length * 0.2),
				transactionId: `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
				results: updates.map((update: any, index: number) => ({
					componentId: update.componentId,
					milestoneName: update.milestoneName,
					success: index % 5 !== 0, // 20% failure rate
					error: index % 5 === 0 ? "Simulated failure" : undefined,
					milestone:
						index % 5 !== 0
							? {
									...(milestoneState.get(
										`milestone-${index}`,
									) || {}),
									...update,
								}
							: undefined,
				})),
			});
		}

		if (testMode === "slow") {
			await delay(performanceTestData.delays.slow);
		}

		// Validation only mode
		if (options.validateOnly) {
			return HttpResponse.json({
				valid: updates.length,
				invalid: 0,
				transactionId: `validate_${Date.now()}`,
				validation: {
					validUpdates: updates.map((u: any) => ({
						componentId: u.componentId,
						milestoneName: u.milestoneName,
					})),
					invalidUpdates: [],
				},
			});
		}

		const transactionId =
			metadata?.transactionId ||
			`bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

		// Process updates in batches
		const batchSize = options.batchSize || 50;
		const results = [];
		const batches = [];

		for (let i = 0; i < updates.length; i += batchSize) {
			batches.push(updates.slice(i, i + batchSize));
		}

		for (const batch of batches) {
			for (const update of batch) {
				try {
					// Find milestone by component and name (simplified lookup)
					const milestone = Array.from(milestoneState.values()).find(
						(m) =>
							m.componentId === update.componentId &&
							m.milestoneName === update.milestoneName,
					);

					if (!milestone) {
						results.push({
							componentId: update.componentId,
							milestoneName: update.milestoneName,
							success: false,
							error: "Milestone not found",
						});
						continue;
					}

					// Apply update
					const updatedMilestone = { ...milestone };
					const now = new Date();

					if (update.workflowType === "MILESTONE_DISCRETE") {
						updatedMilestone.isCompleted = update.value as boolean;
						updatedMilestone.completedAt = update.value
							? now
							: null;
					} else if (update.workflowType === "MILESTONE_PERCENTAGE") {
						updatedMilestone.percentageComplete =
							update.value as number;
						updatedMilestone.isCompleted =
							(update.value as number) >= 100;
					} else if (update.workflowType === "MILESTONE_QUANTITY") {
						updatedMilestone.quantityComplete =
							update.value as number;
						updatedMilestone.isCompleted =
							(update.value as number) >=
							(milestone.quantityTotal || 0);
					}

					updatedMilestone.updatedAt = now;
					milestoneState.set(milestone.id, updatedMilestone);

					results.push({
						componentId: update.componentId,
						milestoneName: update.milestoneName,
						success: true,
						milestone: updatedMilestone,
					});
				} catch (error) {
					results.push({
						componentId: update.componentId,
						milestoneName: update.milestoneName,
						success: false,
						error: "Processing error",
					});
				}
			}

			// Add small delay between batches for realism
			if (batches.length > 1) {
				await delay(100);
			}
		}

		const successful = results.filter((r) => r.success).length;
		const failed = results.filter((r) => !r.success).length;

		// Store transaction for undo testing
		transactionHistory.set(transactionId, {
			updates: results.filter((r) => r.success),
			timestamp: Date.now(),
		});

		return HttpResponse.json({
			successful,
			failed,
			transactionId,
			results: results.map((r) => ({
				componentId: r.componentId,
				milestoneName: r.milestoneName,
				success: r.success || false,
				error: r.error,
				milestone: r.success ? r.milestone : undefined,
			})),
		});
	}),

	// Preview bulk update
	http.post(`${API_BASE}/milestones/preview-bulk`, async ({ request }) => {
		const { updates } = (await request.json()) as any;

		await delay(200); // Realistic preview delay

		const preview = updates.map((update: any) => {
			const milestone = Array.from(milestoneState.values()).find(
				(m) =>
					m.componentId === update.componentId &&
					m.milestoneName === update.milestoneName,
			);

			if (!milestone) {
				return {
					componentId: update.componentId,
					milestoneName: update.milestoneName,
					error: "Milestone not found",
				};
			}

			const currentValues = {
				isCompleted: milestone.isCompleted,
				percentageComplete: milestone.percentageComplete,
				quantityComplete: milestone.quantityComplete,
				completedAt: milestone.completedAt,
				completedBy: milestone.completedBy,
			};

			// Simulate new values based on update type
			const newValues = { ...currentValues };
			if (update.workflowType === "MILESTONE_DISCRETE") {
				newValues.isCompleted = update.value as boolean;
				newValues.completedAt = update.value ? new Date() : null;
			} else if (update.workflowType === "MILESTONE_PERCENTAGE") {
				newValues.percentageComplete = update.value as number;
				newValues.isCompleted = (update.value as number) >= 100;
			} else if (update.workflowType === "MILESTONE_QUANTITY") {
				newValues.quantityComplete = update.value as number;
				newValues.isCompleted =
					(update.value as number) >= (milestone.quantityTotal || 0);
			}

			return {
				componentId: update.componentId,
				milestoneName: update.milestoneName,
				currentValues,
				newValues,
				hasChanges:
					JSON.stringify(currentValues) !== JSON.stringify(newValues),
			};
		});

		const validUpdates = preview.filter((p: any) => !p.error).length;
		const invalidUpdates = preview.filter((p: any) => p.error).length;

		return HttpResponse.json({
			totalUpdates: updates.length,
			validUpdates,
			invalidUpdates,
			preview: preview.filter((p: any) => !p.error),
			invalid: preview
				.filter((p: any) => p.error)
				.map((p: any) => ({
					componentId: p.componentId,
					milestoneName: p.milestoneName,
					error: p.error,
				})),
		});
	}),

	// Sync offline operations
	http.post(`${API_BASE}/milestones/sync`, async ({ request }) => {
		const { operations } = (await request.json()) as any;
		const url = new URL(request.url);
		const testMode = url.searchParams.get("test");

		if (testMode === "network-error") {
			return new HttpResponse(null, { status: 500 });
		}

		await delay(300); // Realistic sync delay

		const results = operations.map((operation: any, index: number) => {
			const success = testMode !== "partial-failure" || index % 3 !== 0;

			return {
				operationId: operation.id,
				success,
				error: success ? undefined : "Sync error",
				result: success
					? { id: `synced-${operation.id}`, ...operation.data }
					: undefined,
			};
		});

		const successful = results.filter((r) => r.success).length;
		const failed = results.filter((r) => !r.success).length;

		return HttpResponse.json({
			syncTimestamp: new Date().toISOString(),
			operationsProcessed: operations.length,
			successful,
			failed,
			results,
		});
	}),

	// Get recent updates
	http.get(
		`${API_BASE}/milestones/recent/:projectId`,
		async ({ params, request }) => {
			const url = new URL(request.url);
			const limit = Number.parseInt(
				url.searchParams.get("limit") || "50",
			);
			const offset = Number.parseInt(
				url.searchParams.get("offset") || "0",
			);

			await delay(200);

			// Generate mock audit log entries
			const recentUpdates = Array.from(milestoneState.values())
				.filter((m) => m.updatedAt)
				.sort(
					(a, b) =>
						new Date(b.updatedAt).getTime() -
						new Date(a.updatedAt).getTime(),
				)
				.slice(offset, offset + limit)
				.map((milestone) => ({
					id: `audit-${milestone.id}`,
					projectId: params.projectId,
					entityType: "component_milestone",
					entityId: milestone.id,
					action: "UPDATE",
					createdAt: milestone.updatedAt,
					user: {
						id: "test-user",
						name: "Test User",
						email: "test@pipetrak.co",
					},
					milestone: {
						id: milestone.id,
						name: milestone.milestoneName,
						component: {
							id: milestone.componentId,
							componentId: milestone.componentId,
							type: "Test Component",
							drawing: {
								number: "DWG-001",
								title: "Test Drawing",
							},
						},
					},
				}));

			return HttpResponse.json({
				updates: recentUpdates,
				pagination: {
					limit,
					offset,
					hasMore: recentUpdates.length === limit,
				},
			});
		},
	),

	// Update presence
	http.post(
		`${API_BASE}/milestones/presence/:projectId`,
		async ({ request }) => {
			const body = (await request.json()) as any;

			return HttpResponse.json({
				success: true,
				message: "Presence updated",
				timestamp: new Date().toISOString(),
			});
		},
	),

	// Resolve conflict
	http.post(
		`${API_BASE}/milestones/resolve-conflict`,
		async ({ request }) => {
			const { milestoneId, resolution } = (await request.json()) as any;

			await delay(300);

			const milestone = milestoneState.get(milestoneId);
			if (!milestone) {
				return HttpResponse.json(
					{
						code: "ACCESS_DENIED",
						message: "Milestone not found",
					},
					{ status: 403 },
				);
			}

			let updatedMilestone = { ...milestone };

			switch (resolution.strategy) {
				case "accept_server":
					// Keep current values
					break;
				case "accept_client":
					updatedMilestone = {
						...milestone,
						...resolution.clientVersion,
					};
					break;
				case "custom":
					updatedMilestone = {
						...milestone,
						...resolution.customValues,
					};
					break;
			}

			updatedMilestone.updatedAt = new Date();
			milestoneState.set(milestoneId, updatedMilestone);

			return HttpResponse.json({
				success: true,
				milestone: updatedMilestone,
				resolution: resolution.strategy,
				timestamp: new Date().toISOString(),
			});
		},
	),

	// Undo bulk operation
	http.post(
		`${API_BASE}/milestones/undo/:transactionId`,
		async ({ params }) => {
			const transactionId = params.transactionId as string;

			await delay(500); // Undo takes time

			const transaction = transactionHistory.get(transactionId);
			if (!transaction) {
				return HttpResponse.json(
					{
						code: "TRANSACTION_NOT_FOUND",
						message: "Transaction not found or cannot be undone",
					},
					{ status: 404 },
				);
			}

			// Simulate undo by reverting changes
			const undoResults = transaction.updates.map((update: any) => {
				const milestone = milestoneState.get(update.milestone?.id);
				if (milestone) {
					// Revert to previous state (simplified)
					const reverted = {
						...milestone,
						isCompleted: !milestone.isCompleted,
						updatedAt: new Date(),
					};
					milestoneState.set(milestone.id, reverted);

					return {
						milestoneId: milestone.id,
						success: true,
						reverted: ["isCompleted", "updatedAt"],
					};
				}

				return {
					milestoneId: update.milestone?.id || "unknown",
					success: false,
					error: "Milestone not found",
				};
			});

			const successful = undoResults.filter((r) => r.success).length;
			const failed = undoResults.filter((r) => !r.success).length;

			// Remove transaction from history
			transactionHistory.delete(transactionId);

			return HttpResponse.json({
				success: true,
				transactionId,
				undone: successful,
				failed,
				results: undoResults,
				timestamp: new Date().toISOString(),
			});
		},
	),

	// Get milestone statistics
	http.get(`${API_BASE}/milestones/stats/:projectId`, async ({ params }) => {
		await delay(400);

		return HttpResponse.json(mockMilestoneStats);
	}),
];

// Error handlers for testing error scenarios
export const milestoneErrorHandlers = [
	http.get(`${API_BASE}/milestones/component/:componentId`, () => {
		return new HttpResponse(null, { status: 500 });
	}),

	http.patch(`${API_BASE}/milestones/:id`, () => {
		return HttpResponse.json(
			{
				code: "INTERNAL_ERROR",
				message: "Failed to update milestone",
			},
			{ status: 500 },
		);
	}),

	http.post(`${API_BASE}/milestones/bulk-update`, () => {
		return HttpResponse.json(
			{
				code: "INTERNAL_ERROR",
				message: "Failed to update milestones",
			},
			{ status: 500 },
		);
	}),
];

// Delay handlers for testing loading states
export const milestoneDelayHandlers = [
	http.get(`${API_BASE}/milestones/component/:componentId`, async () => {
		await delay(2000);
		return HttpResponse.json(mockMilestones);
	}),

	http.post(`${API_BASE}/milestones/bulk-update`, async ({ request }) => {
		await delay(3000);
		const { updates } = (await request.json()) as any;
		return HttpResponse.json({
			successful: updates.length,
			failed: 0,
			transactionId: `slow_${Date.now()}`,
			results: updates.map((u: any) => ({ ...u, success: true })),
		});
	}),
];

// Reset state function for testing
export function resetMilestoneState() {
	milestoneState.clear();
	transactionHistory.clear();
	conflictState.clear();

	mockMilestones.forEach((milestone) => {
		milestoneState.set(milestone.id, { ...milestone });
	});
}

export { milestoneState, transactionHistory, conflictState };
