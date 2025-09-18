import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { server } from "../../../../test-setup";
import {
	generateMockBulkUpdates,
	performanceTestData,
} from "../__fixtures__/milestones";
import {
	milestoneErrorHandlers,
	resetMilestoneState,
} from "../__mocks__/milestone-handlers";

const API_BASE = "http://localhost:3000/api/pipetrak";

// Helper to make authenticated requests
const makeAuthenticatedRequest = async (
	url: string,
	options: RequestInit = {},
) => {
	return fetch(url, {
		...options,
		headers: {
			"Content-Type": "application/json",
			Authorization: "Bearer test-token",
			...options.headers,
		},
	});
};

describe("Milestone API Integration Tests", () => {
	beforeEach(() => {
		resetMilestoneState();
	});

	afterEach(() => {
		server.resetHandlers();
	});

	describe("GET /milestones/component/:componentId", () => {
		it("should fetch milestones for a component", async () => {
			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/component/component-1`,
			);

			expect(response.ok).toBe(true);

			const milestones = await response.json();
			expect(Array.isArray(milestones)).toBe(true);
			expect(milestones.length).toBeGreaterThan(0);
			expect(milestones[0]).toHaveProperty("id");
			expect(milestones[0]).toHaveProperty("componentId");
			expect(milestones[0]).toHaveProperty("milestoneName");
		});

		it("should return milestones ordered by milestoneOrder", async () => {
			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/component/component-1`,
			);

			const milestones = await response.json();

			// Check ordering
			for (let i = 1; i < milestones.length; i++) {
				expect(milestones[i].milestoneOrder).toBeGreaterThanOrEqual(
					milestones[i - 1].milestoneOrder,
				);
			}
		});

		it("should handle empty component results", async () => {
			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/component/nonexistent-component`,
			);

			expect(response.ok).toBe(true);

			const milestones = await response.json();
			expect(milestones).toEqual([]);
		});

		it("should handle performance test modes", async () => {
			// Test slow response
			const slowStart = Date.now();
			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/component/component-1?performance=slow`,
			);
			const slowEnd = Date.now();

			expect(response.ok).toBe(true);
			expect(slowEnd - slowStart).toBeGreaterThan(
				performanceTestData.delays.slow - 100,
			);
		});

		it("should handle timeout scenarios", async () => {
			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/component/component-1?performance=timeout`,
			);

			expect(response.status).toBe(408);
		});
	});

	describe("PATCH /milestones/:id", () => {
		it("should update discrete milestone", async () => {
			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/milestone-1`,
				{
					method: "PATCH",
					body: JSON.stringify({ isCompleted: true }),
				},
			);

			expect(response.ok).toBe(true);

			const updated = await response.json();
			expect(updated.isCompleted).toBe(true);
			expect(updated.completedAt).toBeTruthy();
			expect(updated.completedBy).toBe("test-user");
		});

		it("should update percentage milestone", async () => {
			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/milestone-2`,
				{
					method: "PATCH",
					body: JSON.stringify({ percentageValue: 85 }),
				},
			);

			expect(response.ok).toBe(true);

			const updated = await response.json();
			expect(updated.percentageComplete).toBe(85);
			expect(updated.isCompleted).toBe(false); // 85 < 100
			expect(updated.completedAt).toBeNull();
		});

		it("should mark percentage milestone complete at 100%", async () => {
			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/milestone-2`,
				{
					method: "PATCH",
					body: JSON.stringify({ percentageValue: 100 }),
				},
			);

			const updated = await response.json();
			expect(updated.percentageComplete).toBe(100);
			expect(updated.isCompleted).toBe(true);
			expect(updated.completedAt).toBeTruthy();
		});

		it("should update quantity milestone", async () => {
			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/milestone-3`,
				{
					method: "PATCH",
					body: JSON.stringify({ quantityValue: 7 }),
				},
			);

			expect(response.ok).toBe(true);

			const updated = await response.json();
			expect(updated.quantityComplete).toBe(7);
			expect(updated.isCompleted).toBe(false); // 7 < 10 (assuming total is 10)
		});

		it("should handle not found milestone", async () => {
			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/nonexistent`,
				{
					method: "PATCH",
					body: JSON.stringify({ isCompleted: true }),
				},
			);

			expect(response.status).toBe(404);

			const error = await response.json();
			expect(error.error).toContain("not found");
		});

		it("should handle network errors", async () => {
			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/milestone-1?test=network-error`,
				{
					method: "PATCH",
					body: JSON.stringify({ isCompleted: true }),
				},
			);

			expect(response.status).toBe(500);
		});

		it("should handle conflict scenarios", async () => {
			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/milestone-1?test=conflict`,
				{
					method: "PATCH",
					body: JSON.stringify({ isCompleted: true }),
				},
			);

			expect(response.status).toBe(409);

			const conflictData = await response.json();
			expect(conflictData).toHaveProperty("isCompleted");
		});
	});

	describe("POST /milestones/bulk-update", () => {
		it("should handle successful bulk update", async () => {
			const updates = generateMockBulkUpdates(10);

			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/bulk-update`,
				{
					method: "POST",
					body: JSON.stringify({ updates }),
				},
			);

			expect(response.ok).toBe(true);

			const result = await response.json();
			expect(result.successful).toBeGreaterThan(0);
			expect(result.transactionId).toBeTruthy();
			expect(result.results).toHaveLength(updates.length);
		});

		it("should handle validation-only mode", async () => {
			const updates = generateMockBulkUpdates(5);

			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/bulk-update`,
				{
					method: "POST",
					body: JSON.stringify({
						updates,
						options: { validateOnly: true },
					}),
				},
			);

			expect(response.ok).toBe(true);

			const result = await response.json();
			expect(result.valid).toBeDefined();
			expect(result.invalid).toBeDefined();
			expect(result.transactionId).toBeTruthy();
			expect(result.validation).toBeDefined();
		});

		it("should handle partial failures", async () => {
			const updates = generateMockBulkUpdates(20);

			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/bulk-update?test=partial-failure`,
				{
					method: "POST",
					body: JSON.stringify({ updates }),
				},
			);

			expect(response.ok).toBe(true);

			const result = await response.json();
			expect(result.successful).toBeGreaterThan(0);
			expect(result.failed).toBeGreaterThan(0);
			expect(result.successful + result.failed).toBe(updates.length);
		});

		it("should handle large batch sizes", async () => {
			const updates = generateMockBulkUpdates(500);

			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/bulk-update`,
				{
					method: "POST",
					body: JSON.stringify({
						updates,
						options: { batchSize: 100 },
					}),
				},
			);

			expect(response.ok).toBe(true);

			const result = await response.json();
			expect(result.results).toHaveLength(updates.length);
		});

		it("should handle atomic mode with validation errors", async () => {
			const updates = [
				...generateMockBulkUpdates(3),
				// Add an invalid update
				{
					componentId: "nonexistent",
					milestoneName: "Invalid Milestone",
					workflowType: "MILESTONE_DISCRETE" as const,
					value: true,
				},
			];

			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/bulk-update`,
				{
					method: "POST",
					body: JSON.stringify({
						updates,
						options: { atomic: true },
					}),
				},
			);

			// Should succeed but indicate partial failure
			expect(response.ok).toBe(true);

			const result = await response.json();
			expect(result.failed).toBeGreaterThan(0);
		});

		it("should handle different workflow types in bulk", async () => {
			const updates = [
				{
					componentId: "component-1",
					milestoneName: "Design Review",
					workflowType: "MILESTONE_DISCRETE" as const,
					value: true,
				},
				{
					componentId: "component-1",
					milestoneName: "Material Procurement",
					workflowType: "MILESTONE_PERCENTAGE" as const,
					value: 75,
				},
				{
					componentId: "component-1",
					milestoneName: "Installation",
					workflowType: "MILESTONE_QUANTITY" as const,
					value: 8,
				},
			];

			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/bulk-update`,
				{
					method: "POST",
					body: JSON.stringify({ updates }),
				},
			);

			expect(response.ok).toBe(true);

			const result = await response.json();
			expect(result.successful).toBe(3);
			expect(result.failed).toBe(0);
		});

		it("should store transaction for undo operations", async () => {
			const updates = generateMockBulkUpdates(5);

			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/bulk-update`,
				{
					method: "POST",
					body: JSON.stringify({ updates }),
				},
			);

			const result = await response.json();
			const transactionId = result.transactionId;

			// Transaction should be stored and available for undo
			const undoResponse = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/undo/${transactionId}`,
				{ method: "POST" },
			);

			expect(undoResponse.ok).toBe(true);
		});
	});

	describe("POST /milestones/preview-bulk", () => {
		it("should preview bulk update changes", async () => {
			const updates = generateMockBulkUpdates(3);

			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/preview-bulk`,
				{
					method: "POST",
					body: JSON.stringify({ updates }),
				},
			);

			expect(response.ok).toBe(true);

			const result = await response.json();
			expect(result.totalUpdates).toBe(3);
			expect(result.validUpdates).toBeDefined();
			expect(result.invalidUpdates).toBeDefined();
			expect(result.preview).toBeDefined();

			if (result.preview.length > 0) {
				const previewItem = result.preview[0];
				expect(previewItem).toHaveProperty("componentId");
				expect(previewItem).toHaveProperty("milestoneName");
				expect(previewItem).toHaveProperty("currentValues");
				expect(previewItem).toHaveProperty("newValues");
				expect(previewItem).toHaveProperty("hasChanges");
			}
		});

		it("should identify changes correctly", async () => {
			const updates = [
				{
					componentId: "component-1",
					milestoneName: "Design Review",
					workflowType: "MILESTONE_DISCRETE" as const,
					value: true, // Should be different from current state
				},
			];

			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/preview-bulk`,
				{
					method: "POST",
					body: JSON.stringify({ updates }),
				},
			);

			const result = await response.json();
			expect(result.preview[0].hasChanges).toBe(true);
		});

		it("should handle invalid milestones in preview", async () => {
			const updates = [
				{
					componentId: "nonexistent",
					milestoneName: "Invalid Milestone",
					workflowType: "MILESTONE_DISCRETE" as const,
					value: true,
				},
			];

			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/preview-bulk`,
				{
					method: "POST",
					body: JSON.stringify({ updates }),
				},
			);

			expect(response.ok).toBe(true);

			const result = await response.json();
			expect(result.invalidUpdates).toBe(1);
			expect(result.invalid).toHaveLength(1);
			expect(result.invalid[0].error).toContain("not found");
		});
	});

	describe("POST /milestones/sync", () => {
		it("should sync offline operations", async () => {
			const operations = [
				{
					id: "op-1",
					type: "milestone_update",
					timestamp: new Date().toISOString(),
					data: {
						componentId: "component-1",
						milestoneName: "Design Review",
						workflowType: "MILESTONE_DISCRETE",
						value: true,
					},
				},
				{
					id: "op-2",
					type: "bulk_milestone_update",
					timestamp: new Date().toISOString(),
					data: {
						updates: generateMockBulkUpdates(2),
					},
				},
			];

			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/sync`,
				{
					method: "POST",
					body: JSON.stringify({ operations }),
				},
			);

			expect(response.ok).toBe(true);

			const result = await response.json();
			expect(result.syncTimestamp).toBeTruthy();
			expect(result.operationsProcessed).toBe(2);
			expect(result.successful).toBeGreaterThanOrEqual(0);
			expect(result.failed).toBeGreaterThanOrEqual(0);
			expect(result.results).toHaveLength(2);
		});

		it("should handle sync errors gracefully", async () => {
			const operations = [
				{
					id: "op-error",
					type: "milestone_update",
					timestamp: new Date().toISOString(),
					data: { invalid: "data" },
				},
			];

			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/sync?test=partial-failure`,
				{
					method: "POST",
					body: JSON.stringify({ operations }),
				},
			);

			expect(response.ok).toBe(true);

			const result = await response.json();
			expect(result.failed).toBeGreaterThan(0);
		});

		it("should handle empty operation queue", async () => {
			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/sync`,
				{
					method: "POST",
					body: JSON.stringify({ operations: [] }),
				},
			);

			expect(response.ok).toBe(true);

			const result = await response.json();
			expect(result.operationsProcessed).toBe(0);
			expect(result.successful).toBe(0);
			expect(result.failed).toBe(0);
		});
	});

	describe("GET /milestones/recent/:projectId", () => {
		it("should fetch recent milestone updates", async () => {
			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/recent/project-1`,
			);

			expect(response.ok).toBe(true);

			const result = await response.json();
			expect(result.updates).toBeDefined();
			expect(result.pagination).toBeDefined();
			expect(result.pagination.limit).toBe(50); // default limit
			expect(result.pagination.offset).toBe(0); // default offset
		});

		it("should support pagination", async () => {
			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/recent/project-1?limit=10&offset=5`,
			);

			expect(response.ok).toBe(true);

			const result = await response.json();
			expect(result.pagination.limit).toBe(10);
			expect(result.pagination.offset).toBe(5);
		});

		it("should include enriched milestone data", async () => {
			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/recent/project-1`,
			);

			const result = await response.json();

			if (result.updates.length > 0) {
				const update = result.updates[0];
				expect(update).toHaveProperty("user");
				expect(update).toHaveProperty("milestone");
				expect(update.milestone).toHaveProperty("component");
				expect(update.milestone.component).toHaveProperty("drawing");
			}
		});
	});

	describe("POST /milestones/presence/:projectId", () => {
		it("should update user presence", async () => {
			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/presence/project-1`,
				{
					method: "POST",
					body: JSON.stringify({
						componentId: "component-1",
						action: "editing_start",
						timestamp: new Date().toISOString(),
					}),
				},
			);

			expect(response.ok).toBe(true);

			const result = await response.json();
			expect(result.success).toBe(true);
			expect(result.message).toContain("updated");
			expect(result.timestamp).toBeTruthy();
		});

		it("should handle different presence actions", async () => {
			const actions = ["editing_start", "editing_end", "viewing"];

			for (const action of actions) {
				const response = await makeAuthenticatedRequest(
					`${API_BASE}/milestones/presence/project-1`,
					{
						method: "POST",
						body: JSON.stringify({
							componentId: "component-1",
							action,
						}),
					},
				);

				expect(response.ok).toBe(true);
			}
		});
	});

	describe("POST /milestones/resolve-conflict", () => {
		it("should resolve conflict with accept_server strategy", async () => {
			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/resolve-conflict`,
				{
					method: "POST",
					body: JSON.stringify({
						milestoneId: "milestone-1",
						resolution: {
							strategy: "accept_server",
						},
						serverVersion: { isCompleted: false },
						clientVersion: { isCompleted: true },
					}),
				},
			);

			expect(response.ok).toBe(true);

			const result = await response.json();
			expect(result.success).toBe(true);
			expect(result.resolution).toBe("accept_server");
			expect(result.milestone).toBeDefined();
		});

		it("should resolve conflict with accept_client strategy", async () => {
			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/resolve-conflict`,
				{
					method: "POST",
					body: JSON.stringify({
						milestoneId: "milestone-1",
						resolution: {
							strategy: "accept_client",
						},
						serverVersion: { isCompleted: false },
						clientVersion: { isCompleted: true },
					}),
				},
			);

			expect(response.ok).toBe(true);

			const result = await response.json();
			expect(result.resolution).toBe("accept_client");
		});

		it("should resolve conflict with custom strategy", async () => {
			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/resolve-conflict`,
				{
					method: "POST",
					body: JSON.stringify({
						milestoneId: "milestone-1",
						resolution: {
							strategy: "custom",
							customValues: {
								isCompleted: true,
								percentageComplete: 50,
							},
						},
					}),
				},
			);

			expect(response.ok).toBe(true);

			const result = await response.json();
			expect(result.resolution).toBe("custom");
		});

		it("should handle nonexistent milestone", async () => {
			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/resolve-conflict`,
				{
					method: "POST",
					body: JSON.stringify({
						milestoneId: "nonexistent",
						resolution: { strategy: "accept_server" },
					}),
				},
			);

			expect(response.status).toBe(403);
		});
	});

	describe("POST /milestones/undo/:transactionId", () => {
		it("should undo bulk operation", async () => {
			// First create a transaction
			const updates = generateMockBulkUpdates(3);
			const bulkResponse = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/bulk-update`,
				{
					method: "POST",
					body: JSON.stringify({ updates }),
				},
			);

			const bulkResult = await bulkResponse.json();
			const transactionId = bulkResult.transactionId;

			// Now undo it
			const undoResponse = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/undo/${transactionId}`,
				{ method: "POST" },
			);

			expect(undoResponse.ok).toBe(true);

			const undoResult = await undoResponse.json();
			expect(undoResult.success).toBe(true);
			expect(undoResult.transactionId).toBe(transactionId);
			expect(undoResult.undone).toBeGreaterThanOrEqual(0);
			expect(undoResult.results).toBeDefined();
		});

		it("should handle nonexistent transaction", async () => {
			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/undo/nonexistent-transaction`,
				{ method: "POST" },
			);

			expect(response.status).toBe(404);

			const error = await response.json();
			expect(error.code).toBe("TRANSACTION_NOT_FOUND");
		});
	});

	describe("GET /milestones/stats/:projectId", () => {
		it("should fetch milestone statistics", async () => {
			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/stats/project-1`,
			);

			expect(response.ok).toBe(true);

			const result = await response.json();
			expect(result.milestoneStats).toBeDefined();
			expect(result.recentUpdates).toBeDefined();

			if (result.milestoneStats.length > 0) {
				const stat = result.milestoneStats[0];
				expect(stat).toHaveProperty("milestoneName");
				expect(stat).toHaveProperty("total");
				expect(stat).toHaveProperty("completed");
				expect(stat).toHaveProperty("avgPercentage");
			}
		});
	});

	describe("Error Handling", () => {
		beforeEach(() => {
			server.use(...milestoneErrorHandlers);
		});

		it("should handle API errors gracefully", async () => {
			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/component/component-1`,
			);

			expect(response.status).toBe(500);
		});

		it("should handle bulk update errors", async () => {
			const updates = generateMockBulkUpdates(5);

			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/bulk-update`,
				{
					method: "POST",
					body: JSON.stringify({ updates }),
				},
			);

			expect(response.status).toBe(500);
		});

		it("should handle single update errors", async () => {
			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/milestone-1`,
				{
					method: "PATCH",
					body: JSON.stringify({ isCompleted: true }),
				},
			);

			expect(response.status).toBe(500);
		});
	});

	describe("Input Validation", () => {
		it("should validate bulk update input", async () => {
			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/bulk-update`,
				{
					method: "POST",
					body: JSON.stringify({ invalid: "data" }),
				},
			);

			expect(response.status).toBe(400);

			const error = await response.json();
			expect(error.code).toBe("INVALID_INPUT");
		});

		it("should validate sync input", async () => {
			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/sync`,
				{
					method: "POST",
					body: JSON.stringify({ invalid: "operations" }),
				},
			);

			expect(response.status).toBe(400);
		});

		it("should handle malformed JSON", async () => {
			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/bulk-update`,
				{
					method: "POST",
					body: "invalid json",
				},
			);

			expect(response.ok).toBe(false);
		});
	});

	describe("Performance Considerations", () => {
		it("should handle large batch sizes efficiently", async () => {
			const updates = generateMockBulkUpdates(1000);

			const startTime = Date.now();
			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/bulk-update`,
				{
					method: "POST",
					body: JSON.stringify({
						updates,
						options: { batchSize: 50 },
					}),
				},
			);
			const endTime = Date.now();

			expect(response.ok).toBe(true);

			// Should complete within reasonable time
			expect(endTime - startTime).toBeLessThan(10000); // 10 seconds

			const result = await response.json();
			expect(result.results).toHaveLength(1000);
		});

		it("should batch process updates correctly", async () => {
			const updates = generateMockBulkUpdates(150);

			const response = await makeAuthenticatedRequest(
				`${API_BASE}/milestones/bulk-update`,
				{
					method: "POST",
					body: JSON.stringify({
						updates,
						options: { batchSize: 25 }, // Should create 6 batches
					}),
				},
			);

			expect(response.ok).toBe(true);

			const result = await response.json();
			expect(result.results).toHaveLength(150);
			// All should be processed despite batching
			expect(result.successful + result.failed).toBe(150);
		});
	});
});
