"use client";

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
  originalValue?: boolean | number;
}

export interface UpdateCallback {
  onSuccess: (update: MilestoneUpdate, milestone: ComponentMilestone) => void;
  onError: (update: MilestoneUpdate, error: Error) => void;
  onConflict: (update: MilestoneUpdate) => void;
}

export interface OperationStatus {
  status: "pending" | "success" | "error" | "conflict";
  error?: string;
  timestamp: number;
}

export class OptimisticUpdateManager {
  private serverState = new Map<string, ComponentMilestone>();
  private optimisticState = new Map<string, ComponentMilestone>();
  private pendingOperations = new Map<string, MilestoneUpdate>();
  private operationStatus = new Map<string, OperationStatus>();
  private offlineQueue: MilestoneUpdate[] = [];
  private retryTimeouts = new Map<string, NodeJS.Timeout>();
  private processingQueue = false;

  constructor(
    private apiClient: any,
    private callbacks: UpdateCallback
  ) {}

  // Update server state with fresh data
  updateServerState(milestones: ComponentMilestone[]): void {
    milestones.forEach(milestone => {
      this.serverState.set(milestone.id, { ...milestone });
      // If no optimistic state exists, use server state
      if (!this.optimisticState.has(milestone.id)) {
        this.optimisticState.set(milestone.id, { ...milestone });
      }
    });
  }

  // Get current state (optimistic if available, otherwise server)
  getMilestoneState(milestoneId: string): ComponentMilestone | undefined {
    return this.optimisticState.get(milestoneId) || this.serverState.get(milestoneId);
  }

  // Get all milestone states
  getAllMilestoneStates(): Map<string, ComponentMilestone> {
    return new Map(this.optimisticState);
  }

  // Check if milestone has pending updates
  hasPendingUpdates(milestoneId: string): boolean {
    return this.pendingOperations.has(milestoneId);
  }

  // Get operation status
  getOperationStatus(milestoneId: string): "pending" | "success" | "error" | null {
    const status = this.operationStatus.get(milestoneId);
    return status?.status || null;
  }

  // Apply optimistic update
  applyOptimisticUpdate(update: MilestoneUpdate): ComponentMilestone {
    const currentState = this.getMilestoneState(update.milestoneId);
    if (!currentState) {
      throw new Error(`Milestone ${update.milestoneId} not found`);
    }

    // Store original value for rollback if needed
    if (update.originalValue === undefined) {
      update.originalValue = this.getUpdateValue(currentState, update.workflowType);
    }

    // Create optimistic state
    const optimisticMilestone = this.applyUpdateToMilestone(currentState, update);
    
    // Store states
    this.optimisticState.set(update.milestoneId, optimisticMilestone);
    this.pendingOperations.set(update.milestoneId, update);
    this.operationStatus.set(update.milestoneId, {
      status: "pending",
      timestamp: Date.now()
    });

    // Process update
    this.processUpdate(update);

    return optimisticMilestone;
  }

  // Process update (online or offline)
  private async processUpdate(update: MilestoneUpdate): Promise<void> {
    try {
      if (navigator.onLine) {
        await this.submitToServer(update);
      } else {
        this.addToOfflineQueue(update);
      }
    } catch (error) {
      this.handleUpdateError(update, error as Error);
    }
  }

  // Submit update to server
  private async submitToServer(update: MilestoneUpdate): Promise<void> {
    const endpoint = `/milestones/${update.milestoneId}`;
    const payload = this.createUpdatePayload(update);

    try {
      const response = await this.apiClient.patch(endpoint, payload);
      
      // Update succeeded
      this.handleUpdateSuccess(update, response.data);
      
    } catch (error: any) {
      // Handle conflict (409) vs other errors
      if (error.status === 409) {
        this.handleConflict(update);
      } else {
        throw error;
      }
    }
  }

  // Create API payload from update
  private createUpdatePayload(update: MilestoneUpdate): any {
    switch (update.workflowType) {
      case "MILESTONE_DISCRETE":
        return { isCompleted: update.value as boolean };
      case "MILESTONE_PERCENTAGE":
        return { percentageComplete: update.value as number };
      case "MILESTONE_QUANTITY":
        return { quantityComplete: update.value as number };
      default:
        throw new Error(`Unknown workflow type: ${update.workflowType}`);
    }
  }

  // Apply update to milestone object
  private applyUpdateToMilestone(milestone: ComponentMilestone, update: MilestoneUpdate): ComponentMilestone {
    const updated = { ...milestone };

    switch (update.workflowType) {
      case "MILESTONE_DISCRETE":
        updated.isCompleted = update.value as boolean;
        updated.completedAt = updated.isCompleted ? new Date() : null;
        break;
      case "MILESTONE_PERCENTAGE":
        updated.percentageComplete = update.value as number;
        updated.isCompleted = updated.percentageComplete === 100;
        updated.completedAt = updated.isCompleted ? new Date() : null;
        break;
      case "MILESTONE_QUANTITY":
        updated.quantityComplete = update.value as number;
        updated.isCompleted = updated.quantityComplete === updated.quantityTotal;
        updated.completedAt = updated.isCompleted ? new Date() : null;
        break;
    }

    updated.updatedAt = new Date();
    return updated;
  }

  // Get current value from milestone for comparison
  private getUpdateValue(milestone: ComponentMilestone, workflowType: WorkflowType): boolean | number {
    switch (workflowType) {
      case "MILESTONE_DISCRETE":
        return milestone.isCompleted;
      case "MILESTONE_PERCENTAGE":
        return milestone.percentageComplete || 0;
      case "MILESTONE_QUANTITY":
        return milestone.quantityComplete || 0;
      default:
        return false;
    }
  }

  // Handle successful update
  private handleUpdateSuccess(update: MilestoneUpdate, serverData: ComponentMilestone): void {
    // Update server state with latest data
    this.serverState.set(update.milestoneId, serverData);
    this.optimisticState.set(update.milestoneId, serverData);
    
    // Clear pending state
    this.pendingOperations.delete(update.milestoneId);
    this.operationStatus.set(update.milestoneId, {
      status: "success",
      timestamp: Date.now()
    });

    // Clear retry timeout if exists
    const timeout = this.retryTimeouts.get(update.milestoneId);
    if (timeout) {
      clearTimeout(timeout);
      this.retryTimeouts.delete(update.milestoneId);
    }

    // Notify callback
    this.callbacks.onSuccess(update, serverData);

    // Auto-clear success status after delay
    setTimeout(() => {
      const currentStatus = this.operationStatus.get(update.milestoneId);
      if (currentStatus?.status === "success") {
        this.operationStatus.delete(update.milestoneId);
      }
    }, 3000);
  }

  // Handle update error
  private handleUpdateError(update: MilestoneUpdate, error: Error): void {
    // Rollback optimistic state
    this.rollbackOptimisticUpdate(update);

    // Set error status
    this.operationStatus.set(update.milestoneId, {
      status: "error",
      error: error.message,
      timestamp: Date.now()
    });

    // Retry logic
    const retryCount = update.retryCount || 0;
    if (retryCount < 3 && navigator.onLine) {
      this.scheduleRetry(update, retryCount + 1);
    } else {
      // Add to offline queue for later retry
      this.addToOfflineQueue(update);
      this.callbacks.onError(update, error);
    }
  }

  // Handle conflict (server state changed)
  private handleConflict(update: MilestoneUpdate): void {
    this.operationStatus.set(update.milestoneId, {
      status: "conflict",
      timestamp: Date.now()
    });

    this.callbacks.onConflict(update);
  }

  // Rollback optimistic update
  private rollbackOptimisticUpdate(update: MilestoneUpdate): void {
    const serverState = this.serverState.get(update.milestoneId);
    if (serverState) {
      this.optimisticState.set(update.milestoneId, { ...serverState });
    }
    
    this.pendingOperations.delete(update.milestoneId);
  }

  // Schedule retry with exponential backoff
  private scheduleRetry(update: MilestoneUpdate, retryCount: number): void {
    const delay = Math.min(1000 * 2 ** (retryCount - 1), 10000); // Max 10 seconds
    
    const timeout = setTimeout(() => {
      const retryUpdate = { ...update, retryCount };
      this.processUpdate(retryUpdate);
    }, delay);

    this.retryTimeouts.set(update.milestoneId, timeout);
  }

  // Add to offline queue
  private addToOfflineQueue(update: MilestoneUpdate): void {
    // Remove any existing update for the same milestone
    this.offlineQueue = this.offlineQueue.filter(op => op.milestoneId !== update.milestoneId);
    
    // Add new update
    this.offlineQueue.push(update);
  }

  // Get offline queue
  getOfflineQueue(): MilestoneUpdate[] {
    return [...this.offlineQueue];
  }

  // Process offline queue when online
  async processOfflineQueue(): Promise<void> {
    if (this.processingQueue || this.offlineQueue.length === 0 || !navigator.onLine) {
      return;
    }

    this.processingQueue = true;

    try {
      // Process updates in batches of 5
      const batchSize = 5;
      while (this.offlineQueue.length > 0) {
        const batch = this.offlineQueue.splice(0, batchSize);
        
        await Promise.allSettled(
          batch.map(update => this.submitToServer(update))
        );

        // Small delay between batches to avoid overwhelming server
        if (this.offlineQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } finally {
      this.processingQueue = false;
    }
  }

  // Clear offline queue
  clearOfflineQueue(): void {
    this.offlineQueue = [];
  }

  // Clear all optimistic state
  clearOptimisticState(): void {
    this.optimisticState.clear();
    this.pendingOperations.clear();
    this.operationStatus.clear();
    this.offlineQueue = [];
    
    // Clear all retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts.clear();
    
    // Restore from server state
    this.serverState.forEach((milestone, id) => {
      this.optimisticState.set(id, { ...milestone });
    });
  }

  // Cleanup resources
  destroy(): void {
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts.clear();
    this.serverState.clear();
    this.optimisticState.clear();
    this.pendingOperations.clear();
    this.operationStatus.clear();
    this.offlineQueue = [];
  }
}