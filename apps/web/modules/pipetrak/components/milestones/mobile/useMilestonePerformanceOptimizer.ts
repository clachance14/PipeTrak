"use client";

import { useCallback, useMemo, useRef } from "react";
import type { WorkflowType } from "../../../types";
import { useMilestoneUpdateEngine } from "../core/MilestoneUpdateEngine";

interface MilestoneUpdate {
	milestoneId: string;
	componentId: string;
	milestoneName: string;
	workflowType: WorkflowType;
	value: boolean | number;
	timestamp: number;
}

interface BatchUpdateOptions {
	debounceMs?: number;
	maxBatchSize?: number;
	maxWaitMs?: number;
}

/**
 * Performance-optimized milestone update hook with batching and debouncing
 */
export function useMilestonePerformanceOptimizer(
	options: BatchUpdateOptions = {},
) {
	const { debounceMs = 300, maxBatchSize = 10, maxWaitMs = 2000 } = options;

	const engine = useMilestoneUpdateEngine();
	const batchRef = useRef<MilestoneUpdate[]>([]);
	const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const maxWaitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const firstUpdateTimeRef = useRef<number | null>(null);

	// Process batched updates
	const processBatch = useCallback(async () => {
		if (batchRef.current.length === 0) return;

		const batch = [...batchRef.current];
		batchRef.current = [];

		// Clear timeouts
		if (debounceTimeoutRef.current) {
			clearTimeout(debounceTimeoutRef.current);
			debounceTimeoutRef.current = null;
		}

		if (maxWaitTimeoutRef.current) {
			clearTimeout(maxWaitTimeoutRef.current);
			maxWaitTimeoutRef.current = null;
		}

		firstUpdateTimeRef.current = null;

		try {
			// Group updates by component for better batching
			const updatesByComponent = new Map<string, MilestoneUpdate[]>();

			batch.forEach((update) => {
				const key = update.componentId;
				if (!updatesByComponent.has(key)) {
					updatesByComponent.set(key, []);
				}
				const existingUpdates = updatesByComponent.get(key);
				if (existingUpdates) {
					existingUpdates.push(update);
				}
			});

			// Process each component's updates
			const promises = Array.from(updatesByComponent.values()).map(
				(componentUpdates) => {
					return engine.bulkUpdateMilestones(
						componentUpdates.map((update) => ({
							milestoneId: update.milestoneId,
							componentId: update.componentId,
							milestoneName: update.milestoneName,
							workflowType: update.workflowType,
							value: update.value,
						})),
					);
				},
			);

			await Promise.allSettled(promises);
		} catch (error) {
			console.error("Batch update failed:", error);
		}
	}, [engine]);

	// Schedule batch processing
	const scheduleBatch = useCallback(() => {
		// Clear existing debounce timeout
		if (debounceTimeoutRef.current) {
			clearTimeout(debounceTimeoutRef.current);
		}

		// Set debounce timeout
		debounceTimeoutRef.current = setTimeout(() => {
			processBatch();
		}, debounceMs);

		// Set max wait timeout if this is the first update in batch
		if (firstUpdateTimeRef.current === null) {
			firstUpdateTimeRef.current = Date.now();

			maxWaitTimeoutRef.current = setTimeout(() => {
				processBatch();
			}, maxWaitMs);
		}
	}, [processBatch, debounceMs, maxWaitMs]);

	// Add update to batch
	const batchedUpdateMilestone = useCallback(
		(
			milestoneId: string,
			componentId: string,
			milestoneName: string,
			workflowType: WorkflowType,
			value: boolean | number,
		) => {
			const update: MilestoneUpdate = {
				milestoneId,
				componentId,
				milestoneName,
				workflowType,
				value,
				timestamp: Date.now(),
			};

			// Remove any existing update for the same milestone
			batchRef.current = batchRef.current.filter(
				(u) => u.milestoneId !== milestoneId,
			);

			// Add new update
			batchRef.current.push(update);

			// If batch is full, process immediately
			if (batchRef.current.length >= maxBatchSize) {
				processBatch();
			} else {
				scheduleBatch();
			}
		},
		[maxBatchSize, processBatch, scheduleBatch],
	);

	// Immediate update (bypasses batching)
	const immediateUpdateMilestone = useCallback(
		(
			milestoneId: string,
			componentId: string,
			milestoneName: string,
			workflowType: WorkflowType,
			value: boolean | number,
		) => {
			return engine.updateMilestone(
				milestoneId,
				componentId,
				milestoneName,
				workflowType,
				value,
			);
		},
		[engine],
	);

	// Flush pending batch immediately
	const flushBatch = useCallback(() => {
		if (batchRef.current.length > 0) {
			processBatch();
		}
	}, [processBatch]);

	// Clear pending batch
	const clearBatch = useCallback(() => {
		batchRef.current = [];

		if (debounceTimeoutRef.current) {
			clearTimeout(debounceTimeoutRef.current);
			debounceTimeoutRef.current = null;
		}

		if (maxWaitTimeoutRef.current) {
			clearTimeout(maxWaitTimeoutRef.current);
			maxWaitTimeoutRef.current = null;
		}

		firstUpdateTimeRef.current = null;
	}, []);

	// Get batch status
	const batchStatus = useMemo(
		() => ({
			pendingCount: batchRef.current.length,
			isWaiting: debounceTimeoutRef.current !== null,
			timeUntilFlush: firstUpdateTimeRef.current
				? Math.max(
						0,
						maxWaitMs - (Date.now() - firstUpdateTimeRef.current),
					)
				: 0,
		}),
		[maxWaitMs],
	);

	// Cleanup on unmount
	const cleanup = useCallback(() => {
		flushBatch(); // Process any remaining updates
		clearBatch();
	}, [flushBatch, clearBatch]);

	return {
		// Update functions
		batchedUpdateMilestone,
		immediateUpdateMilestone,

		// Batch control
		flushBatch,
		clearBatch,
		cleanup,

		// Status
		batchStatus,

		// Engine access
		engine,
	};
}
