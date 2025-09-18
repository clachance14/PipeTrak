import type { ComponentMilestone, WorkflowType } from "../../../types";

export interface MilestoneUpdate {
	id: string;
	componentId: string;
	milestoneId: string;
	milestoneName: string;
	workflowType: WorkflowType;
	value: boolean | number;
	timestamp: number;
	retryCount?: number;
	transactionId?: string;
}

export interface OptimisticState {
	// Pending changes before API confirmation
	pendingUpdates: Map<string, MilestoneUpdate>;

	// Optimistic local state (what user sees immediately)
	optimisticMilestones: Map<string, ComponentMilestone>;

	// Server state (source of truth)
	serverMilestones: Map<string, ComponentMilestone>;

	// Rollback queue for failed operations
	rollbackQueue: MilestoneUpdate[];

	// Operation status tracking
	operationStatus: Map<string, "pending" | "success" | "error">;

	// Offline queue
	offlineQueue: MilestoneUpdate[];

	// Conflict resolution state
	conflicts: Map<
		string,
		{
			local: ComponentMilestone;
			remote: ComponentMilestone;
			timestamp: number;
		}
	>;
}

export interface UpdateCallback {
	onSuccess?: (
		update: MilestoneUpdate,
		milestone: ComponentMilestone,
	) => void;
	onError?: (update: MilestoneUpdate, error: Error) => void;
	onConflict?: (
		update: MilestoneUpdate,
		conflict: { local: ComponentMilestone; remote: ComponentMilestone },
	) => void;
}

export class OptimisticUpdateManager {
	private state: OptimisticState = {
		pendingUpdates: new Map(),
		optimisticMilestones: new Map(),
		serverMilestones: new Map(),
		rollbackQueue: [],
		operationStatus: new Map(),
		offlineQueue: [],
		conflicts: new Map(),
	};

	private callbacks: UpdateCallback = {};
	private apiClient: any;
	private isOnline: boolean =
		typeof window !== "undefined" ? navigator.onLine : true;
	private retryTimeout: NodeJS.Timeout | null = null;

	constructor(apiClient: any, callbacks?: UpdateCallback) {
		this.apiClient = apiClient;
		this.callbacks = callbacks || {};

		// Listen for online/offline events (only in browser)
		if (typeof window !== "undefined") {
			window.addEventListener("online", this.handleOnline.bind(this));
			window.addEventListener("offline", this.handleOffline.bind(this));
		}

		// Load persisted state
		this.loadPersistedState();

		// Start retry mechanism
		this.startRetryLoop();
	}

	/**
	 * Apply optimistic update immediately
	 */
	applyOptimisticUpdate(update: MilestoneUpdate): ComponentMilestone {
		const updateId = this.generateUpdateId(update);

		// Store the update for tracking
		this.state.pendingUpdates.set(updateId, update);
		this.state.operationStatus.set(updateId, "pending");

		// Get current milestone state
		const currentMilestone =
			this.state.optimisticMilestones.get(update.milestoneId) ||
			this.state.serverMilestones.get(update.milestoneId);

		if (!currentMilestone) {
			throw new Error(`Milestone ${update.milestoneId} not found`);
		}

		// Apply optimistic changes
		const optimisticMilestone = this.applyUpdateToMilestone(
			currentMilestone,
			update,
		);
		this.state.optimisticMilestones.set(
			update.milestoneId,
			optimisticMilestone,
		);

		// Queue for API call if online, otherwise add to offline queue
		if (this.isOnline) {
			this.executeUpdate(update);
		} else {
			this.state.offlineQueue.push(update);
			this.persistState();
		}

		return optimisticMilestone;
	}

	/**
	 * Confirm successful update from server
	 */
	confirmUpdate(updateId: string, serverMilestone: ComponentMilestone): void {
		const update = this.state.pendingUpdates.get(updateId);
		if (!update) return;

		// Update server state
		this.state.serverMilestones.set(update.milestoneId, serverMilestone);

		// Check for conflicts between optimistic and server state
		const optimisticMilestone = this.state.optimisticMilestones.get(
			update.milestoneId,
		);
		if (
			optimisticMilestone &&
			this.hasConflict(optimisticMilestone, serverMilestone)
		) {
			this.handleConflict(update, optimisticMilestone, serverMilestone);
			return;
		}

		// Success - keep the optimistic state but mark as confirmed
		// Don't delete optimistic state immediately to maintain UI feedback
		this.state.pendingUpdates.delete(updateId);
		this.state.operationStatus.set(updateId, "success");

		// Keep success status longer to allow UI feedback, then clean up
		setTimeout(() => {
			// Only clean up if no new operations are pending for this milestone
			const hasPendingOps = Array.from(this.state.pendingUpdates.values())
				.some(u => u.milestoneId === update.milestoneId);
			if (!hasPendingOps) {
				this.state.operationStatus.delete(updateId);
				// Now it's safe to remove optimistic state since server state is authoritative
				this.state.optimisticMilestones.delete(update.milestoneId);
			}
		}, 2000); // Keep success state for 2 seconds for user feedback

		this.callbacks.onSuccess?.(update, serverMilestone);
		this.persistState();
	}

	/**
	 * Rollback failed update
	 */
	rollbackUpdate(updateId: string, error: Error): void {
		const update = this.state.pendingUpdates.get(updateId);
		if (!update) return;

		// Revert optimistic changes
		this.state.optimisticMilestones.delete(update.milestoneId);
		this.state.operationStatus.set(updateId, "error");

		// Add to rollback queue for potential retry
		update.retryCount = (update.retryCount || 0) + 1;

		if (update.retryCount < 3) {
			this.state.rollbackQueue.push(update);
		} else {
			// Max retries exceeded - remove from pending
			this.state.pendingUpdates.delete(updateId);
		}

		this.callbacks.onError?.(update, error);
		this.persistState();
	}

	/**
	 * Get current milestone state (optimistic if available, otherwise server)
	 */
	getMilestoneState(milestoneId: string): ComponentMilestone | undefined {
		return (
			this.state.optimisticMilestones.get(milestoneId) ||
			this.state.serverMilestones.get(milestoneId)
		);
	}

	/**
	 * Get all milestone states
	 */
	getAllMilestoneStates(): Map<string, ComponentMilestone> {
		const combined = new Map(this.state.serverMilestones);

		// Override with optimistic states
		for (const [id, milestone] of this.state.optimisticMilestones) {
			combined.set(id, milestone);
		}

		return combined;
	}

	/**
	 * Check if milestone has pending updates
	 */
	hasPendingUpdates(milestoneId: string): boolean {
		return Array.from(this.state.pendingUpdates.values()).some(
			(update) => update.milestoneId === milestoneId,
		);
	}

	/**
	 * Check if milestone has recent success status
	 */
	hasRecentSuccess(milestoneId: string): boolean {
		return Array.from(this.state.operationStatus.entries()).some(
			([updateId, status]) => {
				if (status !== "success") return false;
				// Check if this update ID belongs to the milestone
				const milestoneFromId = updateId.split('_')[0];
				return milestoneFromId === milestoneId;
			}
		);
	}

	/**
	 * Get operation status for a milestone
	 */
	getOperationStatus(
		milestoneId: string,
	): "pending" | "success" | "error" | null {
		for (const [updateId, update] of this.state.pendingUpdates) {
			if (update.milestoneId === milestoneId) {
				return this.state.operationStatus.get(updateId) || null;
			}
		}
		return null;
	}

	/**
	 * Update server milestones (called when data is refetched)
	 */
	updateServerState(milestones: ComponentMilestone[]): void {
		for (const milestone of milestones) {
			this.state.serverMilestones.set(milestone.id, milestone);
		}

		// Check for conflicts with optimistic state
		for (const [id, optimisticMilestone] of this.state
			.optimisticMilestones) {
			const serverMilestone = this.state.serverMilestones.get(id);
			if (
				serverMilestone &&
				this.hasConflict(optimisticMilestone, serverMilestone)
			) {
				const update = Array.from(
					this.state.pendingUpdates.values(),
				).find((u) => u.milestoneId === id);
				if (update) {
					this.handleConflict(
						update,
						optimisticMilestone,
						serverMilestone,
					);
				}
			}
		}
	}

	/**
	 * Clear all optimistic state (useful for refetch)
	 */
	clearOptimisticState(): void {
		this.state.optimisticMilestones.clear();
		this.state.pendingUpdates.clear();
		this.state.operationStatus.clear();
		this.persistState();
	}

	/**
	 * Get offline queue for sync
	 */
	getOfflineQueue(): MilestoneUpdate[] {
		return [...this.state.offlineQueue];
	}

	/**
	 * Clear offline queue after successful sync
	 */
	clearOfflineQueue(): void {
		this.state.offlineQueue = [];
		this.persistState();
	}

	/**
	 * Handle coming back online
	 */
	private handleOnline(): void {
		this.isOnline = true;

		// Process offline queue
		if (this.state.offlineQueue.length > 0) {
			const queue = [...this.state.offlineQueue];
			this.state.offlineQueue = [];

			for (const update of queue) {
				this.executeUpdate(update);
			}
		}

		// Retry failed operations
		this.retryFailedOperations();
	}

	/**
	 * Handle going offline
	 */
	private handleOffline(): void {
		this.isOnline = false;
	}

	/**
	 * Execute update via API
	 */
	private async executeUpdate(update: MilestoneUpdate): Promise<void> {
		const updateId = this.generateUpdateId(update);

		try {
			const payload = this.createUpdatePayload(update);
			const response = await this.apiClient.patch(
				`/milestones/${update.milestoneId}`,
				payload,
			);

			this.confirmUpdate(updateId, response.data);
		} catch (error) {
			this.rollbackUpdate(updateId, error as Error);
		}
	}

	/**
	 * Apply update to milestone data structure
	 */
	private applyUpdateToMilestone(
		milestone: ComponentMilestone,
		update: MilestoneUpdate,
	): ComponentMilestone {
		const updated = { ...milestone };
		const now = new Date();

		switch (update.workflowType) {
			case "MILESTONE_DISCRETE":
				updated.isCompleted = update.value as boolean;
				updated.completedAt = (update.value as boolean) ? now : null;
				break;

			case "MILESTONE_PERCENTAGE":
				updated.percentageComplete = update.value as number;
				updated.isCompleted = (update.value as number) >= 100;
				updated.completedAt = updated.isCompleted ? now : null;
				break;

			case "MILESTONE_QUANTITY":
				updated.quantityComplete = update.value as number;
				updated.isCompleted =
					(update.value as number) >= (milestone.quantityTotal || 0);
				updated.completedAt = updated.isCompleted ? now : null;
				break;
		}

		updated.updatedAt = now;
		return updated;
	}

	/**
	 * Create API payload for update
	 */
	private createUpdatePayload(update: MilestoneUpdate): any {
		switch (update.workflowType) {
			case "MILESTONE_DISCRETE":
				return { isCompleted: update.value };
			case "MILESTONE_PERCENTAGE":
				return { percentageValue: update.value };
			case "MILESTONE_QUANTITY":
				return { quantityValue: update.value };
			default:
				throw new Error(
					`Unknown workflow type: ${update.workflowType}`,
				);
		}
	}

	/**
	 * Generate unique update ID
	 */
	private generateUpdateId(update: MilestoneUpdate): string {
		return `${update.milestoneId}_${update.timestamp}`;
	}

	/**
	 * Check if there's a conflict between local and remote states
	 */
	private hasConflict(
		local: ComponentMilestone,
		remote: ComponentMilestone,
	): boolean {
		return (
			local.updatedAt > remote.updatedAt &&
			(local.isCompleted !== remote.isCompleted ||
				local.percentageComplete !== remote.percentageComplete ||
				local.quantityComplete !== remote.quantityComplete)
		);
	}

	/**
	 * Handle conflict resolution
	 */
	private handleConflict(
		update: MilestoneUpdate,
		local: ComponentMilestone,
		remote: ComponentMilestone,
	): void {
		this.state.conflicts.set(update.milestoneId, {
			local,
			remote,
			timestamp: Date.now(),
		});

		this.callbacks.onConflict?.(update, { local, remote });
	}

	/**
	 * Retry failed operations
	 */
	private retryFailedOperations(): void {
		if (this.state.rollbackQueue.length === 0) return;

		const toRetry = [...this.state.rollbackQueue];
		this.state.rollbackQueue = [];

		for (const update of toRetry) {
			// Re-add to pending updates
			const updateId = this.generateUpdateId(update);
			this.state.pendingUpdates.set(updateId, update);
			this.state.operationStatus.set(updateId, "pending");

			// Execute update
			this.executeUpdate(update);
		}
	}

	/**
	 * Start retry loop for failed operations
	 */
	private startRetryLoop(): void {
		this.retryTimeout = setInterval(() => {
			if (this.isOnline && this.state.rollbackQueue.length > 0) {
				this.retryFailedOperations();
			}
		}, 30000); // Retry every 30 seconds
	}

	/**
	 * Persist state to localStorage
	 */
	private persistState(): void {
		if (typeof window === "undefined") return;

		try {
			const persistedState = {
				offlineQueue: this.state.offlineQueue,
				rollbackQueue: this.state.rollbackQueue,
			};
			localStorage.setItem(
				"pipetrak_milestone_state",
				JSON.stringify(persistedState),
			);
		} catch (error) {
			console.warn("Failed to persist milestone state:", error);
		}
	}

	/**
	 * Load persisted state from localStorage
	 */
	private loadPersistedState(): void {
		if (typeof window === "undefined") return;

		try {
			const saved = localStorage.getItem("pipetrak_milestone_state");
			if (saved) {
				const parsed = JSON.parse(saved);
				this.state.offlineQueue = parsed.offlineQueue || [];
				this.state.rollbackQueue = parsed.rollbackQueue || [];
			}
		} catch (error) {
			console.warn("Failed to load persisted milestone state:", error);
		}
	}

	/**
	 * Cleanup resources
	 */
	destroy(): void {
		if (this.retryTimeout) {
			clearInterval(this.retryTimeout);
		}

		if (typeof window !== "undefined") {
			window.removeEventListener("online", this.handleOnline.bind(this));
			window.removeEventListener(
				"offline",
				this.handleOffline.bind(this),
			);
		}
	}
}
