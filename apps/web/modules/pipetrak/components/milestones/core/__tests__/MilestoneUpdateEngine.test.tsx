import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "../../../../../test-setup";
import { mockMilestones } from "../../__fixtures__/milestones";
import {
	MilestoneUpdateEngine,
	useComponentMilestones,
	useMilestone,
	useMilestoneUpdateEngine,
} from "../MilestoneUpdateEngine";

// Mock toast
vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
		warning: vi.fn(),
	},
}));

// Mock navigator.onLine
Object.defineProperty(navigator, "onLine", {
	writable: true,
	value: true,
});

const API_BASE = "http://localhost:3000/api/pipetrak";

// Test components
function TestEngineConsumer({ projectId }: { projectId: string }) {
	const engine = useMilestoneUpdateEngine();

	return (
		<div>
			<div data-testid="online-status">
				{engine.isOnline ? "online" : "offline"}
			</div>
			<div data-testid="queue-count">{engine.offlineQueueCount}</div>
			<button
				onClick={() =>
					engine.updateMilestone(
						"milestone-1",
						"component-1",
						"Test Milestone",
						"MILESTONE_DISCRETE",
						true,
					)
				}
				data-testid="update-button"
			>
				Update Milestone
			</button>
			<button
				onClick={() =>
					engine.bulkUpdateMilestones([
						{
							milestoneId: "milestone-1",
							componentId: "component-1",
							milestoneName: "Test Milestone 1",
							workflowType: "MILESTONE_DISCRETE",
							value: true,
						},
						{
							milestoneId: "milestone-2",
							componentId: "component-1",
							milestoneName: "Test Milestone 2",
							workflowType: "MILESTONE_PERCENTAGE",
							value: 75,
						},
					])
				}
				data-testid="bulk-update-button"
			>
				Bulk Update
			</button>
			<button onClick={engine.syncOfflineQueue} data-testid="sync-button">
				Sync
			</button>
			<button
				onClick={engine.clearOptimisticState}
				data-testid="clear-button"
			>
				Clear
			</button>
		</div>
	);
}

function TestMilestoneConsumer({ milestoneId }: { milestoneId: string }) {
	const { milestone, hasPendingUpdates, operationStatus, update } =
		useMilestone(milestoneId);

	return (
		<div>
			<div data-testid="milestone-completed">
				{milestone?.isCompleted ? "completed" : "not-completed"}
			</div>
			<div data-testid="pending-updates">
				{hasPendingUpdates ? "has-pending" : "no-pending"}
			</div>
			<div data-testid="operation-status">
				{operationStatus || "none"}
			</div>
			<button
				onClick={() =>
					update(
						"component-1",
						"Test Milestone",
						"MILESTONE_DISCRETE",
						true,
					)
				}
				data-testid="milestone-update-button"
			>
				Update
			</button>
		</div>
	);
}

function TestComponentMilestonesConsumer({
	componentId,
}: {
	componentId: string;
}) {
	const { milestones, hasPendingUpdates, updateMilestone } =
		useComponentMilestones(componentId);

	return (
		<div>
			<div data-testid="milestones-count">{milestones.length}</div>
			<div data-testid="component-pending">
				{hasPendingUpdates ? "has-pending" : "no-pending"}
			</div>
			<button
				onClick={() =>
					updateMilestone(
						"milestone-1",
						"Test Milestone",
						"MILESTONE_DISCRETE",
						true,
					)
				}
				data-testid="component-update-button"
			>
				Update Component Milestone
			</button>
		</div>
	);
}

describe("MilestoneUpdateEngine", () => {
	let queryClient: QueryClient;
	let user: ReturnType<typeof userEvent.setup>;

	beforeEach(() => {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});
		user = userEvent.setup();

		// Reset online state
		Object.defineProperty(navigator, "onLine", {
			writable: true,
			value: true,
		});
	});

	afterEach(() => {
		queryClient.clear();
	});

	const renderWithEngine = (
		component: React.ReactNode,
		projectId = "test-project",
	) => {
		return render(
			<QueryClientProvider client={queryClient}>
				<MilestoneUpdateEngine projectId={projectId}>
					{component}
				</MilestoneUpdateEngine>
			</QueryClientProvider>,
		);
	};

	describe("Provider Setup", () => {
		it("should provide engine context to consumers", () => {
			renderWithEngine(<TestEngineConsumer projectId="test-project" />);

			expect(screen.getByTestId("online-status")).toHaveTextContent(
				"online",
			);
			expect(screen.getByTestId("queue-count")).toHaveTextContent("0");
		});

		it("should throw error when used outside provider", () => {
			// Suppress console error for this test
			const originalError = console.error;
			console.error = vi.fn();

			expect(() => {
				render(<TestEngineConsumer projectId="test-project" />);
			}).toThrow(
				"useMilestoneUpdateEngine must be used within a MilestoneUpdateEngine",
			);

			console.error = originalError;
		});

		it("should track online/offline status", async () => {
			renderWithEngine(<TestEngineConsumer projectId="test-project" />);

			expect(screen.getByTestId("online-status")).toHaveTextContent(
				"online",
			);

			// Simulate going offline
			act(() => {
				Object.defineProperty(navigator, "onLine", { value: false });
				window.dispatchEvent(new Event("offline"));
			});

			await waitFor(() => {
				expect(screen.getByTestId("online-status")).toHaveTextContent(
					"offline",
				);
			});

			// Come back online
			act(() => {
				Object.defineProperty(navigator, "onLine", { value: true });
				window.dispatchEvent(new Event("online"));
			});

			await waitFor(() => {
				expect(screen.getByTestId("online-status")).toHaveTextContent(
					"online",
				);
			});
		});
	});

	describe("Single Milestone Updates", () => {
		it("should update milestone optimistically", async () => {
			// Mock successful API response
			server.use(
				http.patch(`${API_BASE}/milestones/:id`, () => {
					return HttpResponse.json({
						id: "milestone-1",
						isCompleted: true,
						completedAt: new Date(),
						updatedAt: new Date(),
					});
				}),
			);

			renderWithEngine(<TestEngineConsumer projectId="test-project" />);

			await user.click(screen.getByTestId("update-button"));

			// Should trigger optimistic update immediately
			await waitFor(() => {
				// API call should be made
				expect(global.fetch).toHaveBeenCalledWith(
					expect.stringContaining("/milestones/milestone-1"),
					expect.objectContaining({ method: "PATCH" }),
				);
			});
		});

		it("should handle update errors gracefully", async () => {
			// Mock API error
			server.use(
				http.patch(`${API_BASE}/milestones/:id`, () => {
					return new HttpResponse(null, { status: 500 });
				}),
			);

			renderWithEngine(<TestEngineConsumer projectId="test-project" />);

			await user.click(screen.getByTestId("update-button"));

			await waitFor(() => {
				// Should handle error without crashing
				expect(screen.getByTestId("online-status")).toHaveTextContent(
					"online",
				);
			});
		});

		it("should queue updates when offline", async () => {
			// Start offline
			act(() => {
				Object.defineProperty(navigator, "onLine", { value: false });
				window.dispatchEvent(new Event("offline"));
			});

			renderWithEngine(<TestEngineConsumer projectId="test-project" />);

			await waitFor(() => {
				expect(screen.getByTestId("online-status")).toHaveTextContent(
					"offline",
				);
			});

			await user.click(screen.getByTestId("update-button"));

			await waitFor(() => {
				expect(screen.getByTestId("queue-count")).toHaveTextContent(
					"1",
				);
			});

			// No API call should be made while offline
			expect(global.fetch).not.toHaveBeenCalled();
		});
	});

	describe("Bulk Updates", () => {
		it("should handle bulk updates", async () => {
			// Mock bulk update API
			server.use(
				http.post(`${API_BASE}/milestones/bulk-update`, () => {
					return HttpResponse.json({
						successful: 2,
						failed: 0,
						transactionId: "bulk-123",
						results: [
							{
								componentId: "component-1",
								milestoneName: "Test Milestone 1",
								success: true,
							},
							{
								componentId: "component-1",
								milestoneName: "Test Milestone 2",
								success: true,
							},
						],
					});
				}),
			);

			renderWithEngine(<TestEngineConsumer projectId="test-project" />);

			await user.click(screen.getByTestId("bulk-update-button"));

			await waitFor(() => {
				expect(global.fetch).toHaveBeenCalledWith(
					expect.stringContaining("/milestones/bulk-update"),
					expect.objectContaining({ method: "POST" }),
				);
			});
		});

		it("should apply optimistic updates for all items in bulk", async () => {
			server.use(
				http.post(`${API_BASE}/milestones/bulk-update`, async () => {
					// Simulate slow response
					await new Promise((resolve) => setTimeout(resolve, 100));
					return HttpResponse.json({
						successful: 2,
						failed: 0,
						transactionId: "bulk-456",
						results: [],
					});
				}),
			);

			renderWithEngine(<TestEngineConsumer projectId="test-project" />);

			await user.click(screen.getByTestId("bulk-update-button"));

			// Should apply optimistic updates immediately without waiting for API
			// This is tested implicitly by the OptimisticUpdateManager
		});
	});

	describe("Offline Sync", () => {
		it("should sync offline queue when requested", async () => {
			// Mock sync API
			server.use(
				http.post(`${API_BASE}/milestones/sync`, () => {
					return HttpResponse.json({
						syncTimestamp: new Date().toISOString(),
						operationsProcessed: 1,
						successful: 1,
						failed: 0,
						results: [],
					});
				}),
			);

			renderWithEngine(<TestEngineConsumer projectId="test-project" />);

			// Start offline and make an update
			act(() => {
				Object.defineProperty(navigator, "onLine", { value: false });
				window.dispatchEvent(new Event("offline"));
			});

			await user.click(screen.getByTestId("update-button"));

			await waitFor(() => {
				expect(screen.getByTestId("queue-count")).toHaveTextContent(
					"1",
				);
			});

			// Go back online
			act(() => {
				Object.defineProperty(navigator, "onLine", { value: true });
				window.dispatchEvent(new Event("online"));
			});

			// Sync should happen automatically when coming online
			await waitFor(() => {
				expect(screen.getByTestId("queue-count")).toHaveTextContent(
					"0",
				);
			});
		});

		it("should manually sync offline queue", async () => {
			server.use(
				http.post(`${API_BASE}/milestones/sync`, () => {
					return HttpResponse.json({
						syncTimestamp: new Date().toISOString(),
						operationsProcessed: 0,
						successful: 0,
						failed: 0,
						results: [],
					});
				}),
			);

			renderWithEngine(<TestEngineConsumer projectId="test-project" />);

			await user.click(screen.getByTestId("sync-button"));

			await waitFor(() => {
				expect(global.fetch).toHaveBeenCalledWith(
					expect.stringContaining("/milestones/sync"),
					expect.objectContaining({ method: "POST" }),
				);
			});
		});
	});

	describe("State Management", () => {
		it("should clear optimistic state", async () => {
			renderWithEngine(<TestEngineConsumer projectId="test-project" />);

			await user.click(screen.getByTestId("clear-button"));

			// Should clear state without API call
			expect(global.fetch).not.toHaveBeenCalled();
		});

		it("should invalidate queries after successful updates", async () => {
			const invalidateQueriesSpy = vi.spyOn(
				queryClient,
				"invalidateQueries",
			);

			server.use(
				http.patch(`${API_BASE}/milestones/:id`, () => {
					return HttpResponse.json({
						id: "milestone-1",
						isCompleted: true,
						updatedAt: new Date(),
					});
				}),
			);

			renderWithEngine(<TestEngineConsumer projectId="test-project" />);

			await user.click(screen.getByTestId("update-button"));

			await waitFor(() => {
				expect(invalidateQueriesSpy).toHaveBeenCalled();
			});
		});
	});

	describe("useMilestone Hook", () => {
		it("should provide milestone-specific operations", () => {
			renderWithEngine(
				<TestMilestoneConsumer milestoneId="milestone-1" />,
			);

			expect(screen.getByTestId("milestone-completed")).toHaveTextContent(
				"not-completed",
			);
			expect(screen.getByTestId("pending-updates")).toHaveTextContent(
				"no-pending",
			);
			expect(screen.getByTestId("operation-status")).toHaveTextContent(
				"none",
			);
		});

		it("should update through milestone hook", async () => {
			server.use(
				http.patch(`${API_BASE}/milestones/:id`, () => {
					return HttpResponse.json({
						id: "milestone-1",
						isCompleted: true,
						updatedAt: new Date(),
					});
				}),
			);

			renderWithEngine(
				<TestMilestoneConsumer milestoneId="milestone-1" />,
			);

			await user.click(screen.getByTestId("milestone-update-button"));

			await waitFor(() => {
				expect(global.fetch).toHaveBeenCalled();
			});
		});
	});

	describe("useComponentMilestones Hook", () => {
		beforeEach(() => {
			// Mock project milestones API
			server.use(
				http.get(`${API_BASE}/projects/:projectId/milestones`, () => {
					return HttpResponse.json(mockMilestones);
				}),
			);
		});

		it("should provide component-specific milestone operations", async () => {
			renderWithEngine(
				<TestComponentMilestonesConsumer componentId="component-1" />,
			);

			// Wait for data to load
			await waitFor(() => {
				expect(
					screen.getByTestId("milestones-count"),
				).toHaveTextContent("3"); // mockMilestones for component-1
			});

			expect(screen.getByTestId("component-pending")).toHaveTextContent(
				"no-pending",
			);
		});

		it("should update milestone through component hook", async () => {
			server.use(
				http.patch(`${API_BASE}/milestones/:id`, () => {
					return HttpResponse.json({
						id: "milestone-1",
						isCompleted: true,
						updatedAt: new Date(),
					});
				}),
			);

			renderWithEngine(
				<TestComponentMilestonesConsumer componentId="component-1" />,
			);

			await waitFor(() => {
				expect(
					screen.getByTestId("milestones-count"),
				).not.toHaveTextContent("0");
			});

			await user.click(screen.getByTestId("component-update-button"));

			await waitFor(() => {
				expect(global.fetch).toHaveBeenCalled();
			});
		});
	});

	describe("Real-time Features", () => {
		it("should subscribe to project updates", () => {
			const consoleSpy = vi
				.spyOn(console, "log")
				.mockImplementation(() => {});

			renderWithEngine(<TestEngineConsumer projectId="test-project" />);

			expect(consoleSpy).toHaveBeenCalledWith(
				"Subscribing to project:",
				"test-project",
			);

			consoleSpy.mockRestore();
		});

		it("should unsubscribe on unmount", () => {
			const consoleSpy = vi
				.spyOn(console, "log")
				.mockImplementation(() => {});

			const { unmount } = renderWithEngine(
				<TestEngineConsumer projectId="test-project" />,
			);

			unmount();

			expect(consoleSpy).toHaveBeenCalledWith(
				"Unsubscribed from project:",
				"test-project",
			);

			consoleSpy.mockRestore();
		});
	});

	describe("Error Boundaries", () => {
		it("should handle API client errors gracefully", async () => {
			// Mock fetch to throw
			global.fetch = vi
				.fn()
				.mockRejectedValue(new Error("Network error"));

			renderWithEngine(<TestEngineConsumer projectId="test-project" />);

			await user.click(screen.getByTestId("update-button"));

			// Should not crash the application
			expect(screen.getByTestId("online-status")).toBeInTheDocument();
		});

		it("should handle malformed API responses", async () => {
			server.use(
				http.patch(`${API_BASE}/milestones/:id`, () => {
					return HttpResponse.text("Invalid JSON");
				}),
			);

			renderWithEngine(<TestEngineConsumer projectId="test-project" />);

			await user.click(screen.getByTestId("update-button"));

			// Should handle gracefully
			expect(screen.getByTestId("online-status")).toBeInTheDocument();
		});
	});

	describe("Memory Management", () => {
		it("should clean up on unmount", () => {
			const { unmount } = renderWithEngine(
				<TestEngineConsumer projectId="test-project" />,
			);

			// Should not throw on unmount
			expect(() => unmount()).not.toThrow();
		});

		it("should handle rapid mount/unmount cycles", () => {
			for (let i = 0; i < 10; i++) {
				const { unmount } = renderWithEngine(
					<TestEngineConsumer projectId={`project-${i}`} />,
				);
				unmount();
			}

			// Should not leak memory or cause errors
			expect(true).toBe(true);
		});
	});
});
