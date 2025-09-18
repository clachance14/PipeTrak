"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { toast } from "sonner";
import type { ComponentMilestone, WorkflowType } from "../../../types";
import {
	type MilestoneUpdate,
	OptimisticUpdateManager,
	type UpdateCallback,
} from "./OptimisticUpdateManager";

interface MilestoneUpdateEngineContextValue {
	// State accessors
	getMilestoneState: (milestoneId: string) => ComponentMilestone | undefined;
	getAllMilestoneStates: () => Map<string, ComponentMilestone>;
	hasPendingUpdates: (milestoneId: string) => boolean;
	hasRecentSuccess: (milestoneId: string) => boolean;
	getOperationStatus: (
		milestoneId: string,
	) => "pending" | "success" | "error" | null;

	// React state-based accessors (these will trigger re-renders)
	operationStatuses: Record<string, "pending" | "success" | "error">;
	recentSuccesses: Record<string, boolean>;

	// Update methods
	updateMilestone: (
		milestoneId: string,
		componentId: string,
		milestoneName: string,
		workflowType: WorkflowType,
		value: boolean | number,
	) => Promise<void>;
	bulkUpdateMilestones: (
		updates: Array<{
			milestoneId: string;
			componentId: string;
			milestoneName: string;
			workflowType: WorkflowType;
			value: boolean | number;
		}>,
	) => Promise<void>;

	// Utility methods
	clearOptimisticState: () => void;
	syncOfflineQueue: () => Promise<void>;

	// Status
	isOnline: boolean;
	offlineQueueCount: number;

	// Real-time features
	subscribeToProject: (projectId: string) => void;
	unsubscribeFromProject: () => void;
}

const MilestoneUpdateEngineContext =
	createContext<MilestoneUpdateEngineContextValue | null>(null);

interface MilestoneUpdateEngineProps {
	projectId: string;
	children: React.ReactNode;
	components?: any[]; // Optional components with milestones to initialize
	onComponentUpdate?: (componentId: string, updates: Partial<any>) => void; // Callback when component needs updating
}

// Mock API client - in real implementation this would be the actual API client
const createApiClient = () => ({
	patch: async (url: string, data: any) => {
		const response = await fetch(`/api/pipetrak${url}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		});
		if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
		return { data: await response.json() };
	},

	post: async (url: string, data: any) => {
		const response = await fetch(`/api/pipetrak${url}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		});
		if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
		return { data: await response.json() };
	},

	get: async (url: string) => {
		const response = await fetch(`/api/pipetrak${url}`);
		if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
		return { data: await response.json() };
	},
});

// Helper function to calculate component progress from milestones
function calculateComponentProgress(
	milestones: ComponentMilestone[],
	workflowType: WorkflowType,
): number {
	if (!milestones || milestones.length === 0) return 0;

	let totalProgress = 0;
	let totalWeight = 0;

	milestones.forEach((milestone) => {
		const weight = milestone.weight || 1;
		totalWeight += weight;

		if (workflowType === "MILESTONE_DISCRETE") {
			totalProgress += milestone.isCompleted ? weight * 100 : 0;
		} else if (workflowType === "MILESTONE_PERCENTAGE") {
			totalProgress += (milestone.percentageComplete || 0) * weight;
		} else if (workflowType === "MILESTONE_QUANTITY") {
			const total = milestone.quantityTotal || 0;
			const completed = milestone.quantityComplete || 0;
			const percent = total > 0 ? (completed / total) * 100 : 0;
			totalProgress += percent * weight;
		}
	});

	return totalWeight > 0 ? Math.round(totalProgress / totalWeight) : 0;
}

// Helper function to determine component status from milestones
function determineComponentStatus(milestones: ComponentMilestone[]): string {
	if (!milestones || milestones.length === 0) return "NOT_STARTED";

	const allCompleted = milestones.every((m) => m.isCompleted);
	const anyStarted = milestones.some((m) => {
		if (m.isCompleted) return true;
		if (m.percentageComplete && m.percentageComplete > 0) return true;
		if (m.quantityComplete && m.quantityComplete > 0) return true;
		return false;
	});

	if (allCompleted) return "COMPLETED";
	if (anyStarted) return "IN_PROGRESS";
	return "NOT_STARTED";
}

export function MilestoneUpdateEngine({
	projectId,
	children,
	components = [],
	onComponentUpdate,
}: MilestoneUpdateEngineProps) {
	const queryClient = useQueryClient();
	const apiClient = useMemo(() => createApiClient(), []);
	const [isOnline, setIsOnline] = useState(
		typeof window !== "undefined" ? navigator.onLine : true,
	);
	const realtimeSubscriptionRef = useRef<any>(null);

	// React state to track operation statuses and trigger re-renders
	// Using objects instead of Map/Set to ensure React detects changes
	const [operationStatuses, setOperationStatuses] = useState<
		Record<string, "pending" | "success" | "error">
	>({});
	const [recentSuccesses, setRecentSuccesses] = useState<
		Record<string, boolean>
	>({});

	// Initialize optimistic update manager with React state callbacks
	const updateManager = useMemo(() => {
		const callbacks: UpdateCallback = {
			onSuccess: (update, milestone) => {
				// Update React Query cache
				queryClient.setQueryData(
					["milestone", update.milestoneId],
					milestone,
				);

				// Update React state to trigger re-render - using object spread for React detection
				setOperationStatuses((prev) => ({
					...prev,
					[update.milestoneId]: "success",
				}));

				// Add to recent successes for visual feedback
				setRecentSuccesses((prev) => ({
					...prev,
					[update.milestoneId]: true,
				}));

				// Clear success state after delay to transition to normal complete state
				setTimeout(() => {
					setOperationStatuses((prev) => {
						const { [update.milestoneId]: _removed, ...rest } =
							prev;
						return rest;
					});
					setRecentSuccesses((prev) => {
						const { [update.milestoneId]: _removed, ...rest } =
							prev;
						return rest;
					});
				}, 2000);

				// Show success feedback
				toast.success(`${update.milestoneName} updated successfully`);
			},

			onError: (update, error) => {
				// Update React state to show error
				setOperationStatuses((prev) => ({
					...prev,
					[update.milestoneId]: "error",
				}));

				// Clear error state after delay
				setTimeout(() => {
					setOperationStatuses((prev) => {
						const { [update.milestoneId]: _removed, ...rest } =
							prev;
						return rest;
					});
				}, 5000);

				// Show error feedback
				toast.error(
					`Failed to update ${update.milestoneName}: ${error.message}`,
				);
			},

			onConflict: (update) => {
				// Clear loading state on conflict
				setOperationStatuses((prev) => {
					const { [update.milestoneId]: _removed, ...rest } = prev;
					return rest;
				});

				// Show conflict resolution UI
				toast.warning(
					`Conflict detected for ${update.milestoneName}. Please resolve manually.`,
				);
			},
		};

		return new OptimisticUpdateManager(apiClient, callbacks);
	}, [apiClient, queryClient]);

	// Track online/offline status
	useEffect(() => {
		if (typeof window === "undefined") return;

		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	// Initialize milestones from components prop
	useEffect(() => {
		// Extract all milestones from the provided components
		const allMilestones: ComponentMilestone[] = [];
		components.forEach((component) => {
			if (component.milestones && Array.isArray(component.milestones)) {
				allMilestones.push(...component.milestones);
			}
		});

		// Update the server state with these milestones
		if (allMilestones.length > 0) {
			updateManager.updateServerState(allMilestones);
		}
	}, [components, updateManager]);

	// Offline sync mutation
	const syncOfflineQueueMutation = useMutation({
		mutationFn: async (operations: MilestoneUpdate[]) => {
			const response = await apiClient.post("/milestones/sync", {
				operations,
			});
			return response.data;
		},
		onSuccess: () => {
			updateManager.clearOfflineQueue();
			queryClient.invalidateQueries({
				queryKey: ["project-milestones", projectId],
			});
			toast.success("Offline changes synchronized");
		},
		onError: () => {
			toast.error("Failed to synchronize offline changes");
		},
	});

	// Update milestone method
	const updateMilestone = useCallback(
		async (
			milestoneId: string,
			componentId: string,
			milestoneName: string,
			workflowType: WorkflowType,
			value: boolean | number,
		) => {
			// Set loading state immediately in React to trigger re-render
			setOperationStatuses((prev) => ({
				...prev,
				[milestoneId]: "pending",
			}));

			const update: MilestoneUpdate = {
				id: `${milestoneId}_${Date.now()}`,
				componentId,
				milestoneId,
				milestoneName,
				workflowType,
				value,
				timestamp: Date.now(),
			};

			// Apply optimistic update
			const updatedMilestone =
				updateManager.applyOptimisticUpdate(update);

			// Find the component and update its state
			if (onComponentUpdate) {
				const component = components.find((c) => c.id === componentId);
				if (component && component.milestones) {
					// Create updated milestones array with the new milestone
					const updatedMilestones = component.milestones.map(
						(m: ComponentMilestone) =>
							m.id === milestoneId ? updatedMilestone : m,
					);

					// Calculate new component state
					const newProgress = calculateComponentProgress(
						updatedMilestones,
						workflowType,
					);
					const newStatus =
						determineComponentStatus(updatedMilestones);

					// Notify parent component of the update
					onComponentUpdate(componentId, {
						milestones: updatedMilestones,
						completionPercent: newProgress,
						status: newStatus,
					});
				}
			}
		},
		[updateManager, components, onComponentUpdate],
	);

	// Bulk update milestones method
	const bulkUpdateMilestones = useCallback(
		async (
			updates: Array<{
				milestoneId: string;
				componentId: string;
				milestoneName: string;
				workflowType: WorkflowType;
				value: boolean | number;
			}>,
		) => {
			const timestamp = Date.now();
			const milestoneUpdates: MilestoneUpdate[] = updates.map(
				(update, index) => ({
					id: `bulk_${timestamp}_${index}`,
					...update,
					timestamp,
				}),
			);

			// Apply optimistic updates
			for (const update of milestoneUpdates) {
				updateManager.applyOptimisticUpdate(update);
			}
		},
		[updateManager],
	);

	// Sync offline queue
	const syncOfflineQueue = useCallback(async () => {
		const queue = updateManager.getOfflineQueue();
		if (queue.length > 0) {
			await syncOfflineQueueMutation.mutateAsync(queue);
		}
	}, [updateManager, syncOfflineQueueMutation]);

	// Real-time subscription setup
	const subscribeToProject = useCallback((projectId: string) => {
		// Unsubscribe from previous subscription if exists
		if (realtimeSubscriptionRef.current) {
			realtimeSubscriptionRef.current.unsubscribe();
		}

		// TODO: Implement Supabase realtime subscription
		console.log("Subscribing to project:", projectId);

		// Mock subscription
		const subscription = {
			unsubscribe: () =>
				console.log("Unsubscribed from project:", projectId),
		};

		realtimeSubscriptionRef.current = subscription;
	}, []);

	const unsubscribeFromProject = useCallback(() => {
		if (realtimeSubscriptionRef.current) {
			realtimeSubscriptionRef.current.unsubscribe();
			realtimeSubscriptionRef.current = null;
		}
	}, []);

	// Auto-subscribe to project
	useEffect(() => {
		if (projectId) {
			subscribeToProject(projectId);
		}

		return () => {
			// Clean up subscription on unmount or projectId change
			if (realtimeSubscriptionRef.current) {
				realtimeSubscriptionRef.current.unsubscribe();
				realtimeSubscriptionRef.current = null;
			}
		};
	}, [projectId, subscribeToProject]);

	// Auto-sync when coming back online
	useEffect(() => {
		if (isOnline) {
			syncOfflineQueue();
		}
	}, [isOnline]); // Remove syncOfflineQueue dependency to avoid loops

	// Context value
	const contextValue: MilestoneUpdateEngineContextValue = {
		getMilestoneState: updateManager.getMilestoneState.bind(updateManager),
		getAllMilestoneStates:
			updateManager.getAllMilestoneStates.bind(updateManager),
		hasPendingUpdates: updateManager.hasPendingUpdates.bind(updateManager),
		hasRecentSuccess: (milestoneId: string) =>
			Boolean(recentSuccesses[milestoneId]),
		getOperationStatus:
			updateManager.getOperationStatus.bind(updateManager),
		// React state-based accessors for triggering re-renders
		operationStatuses,
		recentSuccesses,
		updateMilestone,
		bulkUpdateMilestones,
		clearOptimisticState:
			updateManager.clearOptimisticState.bind(updateManager),
		syncOfflineQueue,
		isOnline,
		offlineQueueCount: updateManager.getOfflineQueue().length,
		subscribeToProject,
		unsubscribeFromProject,
	};

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			updateManager.destroy();
			// Clean up subscription on unmount
			if (realtimeSubscriptionRef.current) {
				realtimeSubscriptionRef.current.unsubscribe();
				realtimeSubscriptionRef.current = null;
			}
		};
	}, [updateManager]);

	return (
		<MilestoneUpdateEngineContext.Provider value={contextValue}>
			{children}
		</MilestoneUpdateEngineContext.Provider>
	);
}

// Hook to use the milestone update engine
export function useMilestoneUpdateEngine() {
	const context = useContext(MilestoneUpdateEngineContext);
	if (!context) {
		throw new Error(
			"useMilestoneUpdateEngine must be used within a MilestoneUpdateEngine",
		);
	}
	return context;
}

// Convenience hook for single milestone operations
export function useMilestone(milestoneId: string) {
	const engine = useMilestoneUpdateEngine();

	return useMemo(
		() => ({
			milestone: engine.getMilestoneState(milestoneId),
			hasPendingUpdates: engine.hasPendingUpdates(milestoneId),
			operationStatus: engine.getOperationStatus(milestoneId),
			update: (
				componentId: string,
				milestoneName: string,
				workflowType: WorkflowType,
				value: boolean | number,
			) =>
				engine.updateMilestone(
					milestoneId,
					componentId,
					milestoneName,
					workflowType,
					value,
				),
		}),
		[engine, milestoneId],
	);
}

// Hook for component milestone operations
export function useComponentMilestones(componentId: string) {
	const engine = useMilestoneUpdateEngine();
	const allStates = engine.getAllMilestoneStates();

	return useMemo(() => {
		const componentMilestones = new Map<string, ComponentMilestone>();

		for (const [id, milestone] of allStates) {
			if (milestone.componentId === componentId) {
				componentMilestones.set(id, milestone);
			}
		}

		return {
			milestones: Array.from(componentMilestones.values()),
			hasPendingUpdates: Array.from(componentMilestones.keys()).some(
				(id) => engine.hasPendingUpdates(id),
			),
			updateMilestone: (
				milestoneId: string,
				milestoneName: string,
				workflowType: WorkflowType,
				value: boolean | number,
			) =>
				engine.updateMilestone(
					milestoneId,
					componentId,
					milestoneName,
					workflowType,
					value,
				),
		};
	}, [engine, componentId, allStates]);
}
