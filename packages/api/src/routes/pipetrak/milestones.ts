import { db as prisma } from "@repo/database";
import { z } from "zod";
import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth";
import { broadcastMilestoneCelebration } from "./realtime";

// Milestone update schemas
const MilestoneUpdateSchema = z.object({
	componentId: z.string(),
	milestoneName: z.string(),
	isCompleted: z.boolean().optional(),
	percentageValue: z.number().min(0).max(100).optional(),
	quantityValue: z.number().min(0).optional(),
	effectiveDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format")
		.optional(),
	welderId: z.string().optional(), // For field weld milestone updates
	welderComments: z.string().max(500).optional(), // Optional weld notes
});

const BulkMilestoneUpdateSchema = z.object({
	updates: z.array(MilestoneUpdateSchema),
	options: z
		.object({
			validateOnly: z.boolean().optional().default(false),
			atomic: z.boolean().optional().default(true),
			notify: z.boolean().optional().default(true),
			batchSize: z.number().min(1).max(500).optional().default(50),
		})
		.optional()
		.default({}),
	metadata: z
		.object({
			transactionId: z.string().optional(),
			reason: z.string().optional(),
			timestamp: z.string().optional(),
		})
		.optional(),
});

const SyncQueueSchema = z.object({
	operations: z.array(
		z.object({
			id: z.string(),
			type: z.enum(["milestone_update", "bulk_milestone_update"]),
			timestamp: z.string(),
			data: z.any(),
			retryCount: z.number().optional().default(0),
		}),
	),
	lastSyncTimestamp: z.string().optional(),
});


// Note: Real-time features are handled at the application level using Supabase subscriptions
// The API focuses on data operations while the frontend manages real-time subscriptions

// Utility functions for enhanced bulk operations
interface BatchProcessor<T, R> {
	processBatch(items: T[], batchSize: number): Promise<R[]>;
	validateBatch(
		items: T[],
	): Promise<{ valid: T[]; invalid: Array<T & { error: string }> }>;
}

class MilestoneBatchProcessor implements BatchProcessor<any, any> {
	constructor(private userId: string) {}

	async processBatch(updates: any[], batchSize = 50): Promise<any[]> {
		const results = [];
		const batches = this.createBatches(updates, batchSize);

		for (const batch of batches) {
			try {
				const batchResults = await this.processSingleBatch(batch);
				results.push(...batchResults);
			} catch (error) {
				// Handle batch failure - mark all items in batch as failed
				batch.forEach((update) => {
					results.push({
						componentId: update.componentId,
						milestoneName: update.milestoneName,
						success: false,
						error: `Batch processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
					});
				});
			}
		}

		return results;
	}

	async validateBatch(
		updates: any[],
	): Promise<{ valid: any[]; invalid: any[] }> {
		const valid = [];
		const invalid = [];

		for (const update of updates) {
			try {
				// Validate milestone exists and user has access
				const milestone = await this.findMilestoneWithAccess(update);
				if (milestone) {
					valid.push({ ...update, milestone });
				} else {
					invalid.push({
						...update,
						error: "Milestone not found or access denied",
					});
				}
			} catch (error) {
				invalid.push({
					...update,
					error:
						error instanceof Error
							? error.message
							: "Validation failed",
				});
			}
		}

		return { valid, invalid };
	}

	private createBatches<T>(items: T[], batchSize: number): T[][] {
		const batches = [];
		for (let i = 0; i < items.length; i += batchSize) {
			batches.push(items.slice(i, i + batchSize));
		}
		return batches;
	}

	private async processSingleBatch(batch: any[]): Promise<any[]> {
		return prisma.$transaction(async (tx) => {
			const results = [];

			for (const update of batch) {
				try {
					const result = await this.processSingleUpdate(update, tx);
					results.push(result);
				} catch (error) {
					results.push({
						componentId: update.componentId,
						milestoneName: update.milestoneName,
						success: false,
						error:
							error instanceof Error
								? error.message
								: "Update failed",
					});
				}
			}

			return results;
		});
	}

	private async findMilestoneWithAccess(update: any): Promise<any | null> {
		return prisma.componentMilestone.findFirst({
			where: {
				componentId: update.componentId,
				milestoneName: update.milestoneName,
				component: {
					project: {
						organization: {
							members: {
								some: { userId: this.userId },
							},
						},
					},
				},
			},
			include: {
				component: {
					include: {
						project: true,
					},
				},
			},
		});
	}

	private async processSingleUpdate(update: any, tx: any): Promise<any> {
		const milestone = await tx.componentMilestone.findFirst({
			where: {
				componentId: update.componentId,
				milestoneName: update.milestoneName,
			},
			include: {
				component: true,
			},
		});

		if (!milestone) {
			throw new Error("Milestone not found");
		}

		// Prepare update data based on workflow type
		const updateData = this.prepareUpdateData(
			update,
			milestone,
			this.userId,
		);

		// Update milestone
		const updatedMilestone = await tx.componentMilestone.update({
			where: { id: milestone.id },
			data: updateData,
		});

		// Sync FieldWeld record if this is a Weld Made milestone
		if (milestone.milestoneName === "Weld Made") {
			console.log("🔧 [DEBUG BATCH] Weld Made milestone batch update:", {
				componentId: milestone.componentId,
				isCompleted: updateData.isCompleted,
				welderId: update.welderId,
			});

			if (updateData.isCompleted === true) {
				// Weld milestone completed - update FieldWeld dateWelded, welderId, and comments
				const fieldWeldData: any = { dateWelded: new Date() };
				if (update.welderId) {
					fieldWeldData.welderId = update.welderId;
				}
				if (update.welderComments) {
					fieldWeldData.comments = update.welderComments;
				}

				// Find component to get weldId
				const component = await tx.component.findUnique({
					where: { id: milestone.componentId },
					select: { weldId: true, componentId: true },
				});

				if (component?.weldId) {
					await tx.fieldWeld.updateMany({
						where: { weldIdNumber: component.weldId },
						data: fieldWeldData,
					});
					console.log(
						`🔧 [DEBUG BATCH] FieldWeld updated for weldId: ${component.weldId}`,
					);
				}
			} else if (updateData.isCompleted === false) {
				// Weld milestone uncompleted - clear FieldWeld dateWelded, welderId, and comments
				const component = await tx.component.findUnique({
					where: { id: milestone.componentId },
					select: { weldId: true },
				});

				if (component?.weldId) {
					await tx.fieldWeld.updateMany({
						where: { weldIdNumber: component.weldId },
						data: {
							dateWelded: null,
							welderId: null,
							comments: null,
						},
					});
				}
			}
		}

		// Create audit log
		await tx.auditLog.create({
			data: {
				projectId: milestone.component.projectId,
				userId: this.userId,
				entityType: "component_milestone",
				entityId: milestone.id,
				action: "UPDATE",
				changes: Object.keys(updateData).reduce((acc, key) => {
					acc[key] = {
						old: (milestone as any)[key],
						new: (updatedMilestone as any)[key],
					};
					return acc;
				}, {} as any),
			},
		});

		return {
			componentId: update.componentId,
			milestoneName: update.milestoneName,
			success: true,
			milestone: updatedMilestone,
		};
	}

	private prepareUpdateData(update: any, existing: any, userId: string): any {
		const updateData: any = {};
		const workflowType = existing.component.workflowType;

		if (
			workflowType === "MILESTONE_DISCRETE" &&
			update.isCompleted !== undefined
		) {
			updateData.isCompleted = update.isCompleted;
			if (update.isCompleted) {
				updateData.completedAt = new Date();
				updateData.completedBy = userId;
			} else {
				updateData.completedAt = null;
				updateData.completedBy = null;
			}
		} else if (
			workflowType === "MILESTONE_PERCENTAGE" &&
			update.percentageValue !== undefined
		) {
			updateData.percentageComplete = update.percentageValue;
			updateData.isCompleted = update.percentageValue >= 100;
			if (updateData.isCompleted) {
				updateData.completedAt = new Date();
				updateData.completedBy = userId;
			} else {
				updateData.completedAt = null;
				updateData.completedBy = null;
			}
		} else if (
			workflowType === "MILESTONE_QUANTITY" &&
			update.quantityValue !== undefined
		) {
			updateData.quantityComplete = update.quantityValue;
			updateData.isCompleted =
				update.quantityValue >= 0;
			if (updateData.isCompleted) {
				updateData.completedAt = new Date();
				updateData.completedBy = userId;
			} else {
				updateData.completedAt = null;
				updateData.completedBy = null;
			}
		} else {
			throw new Error("Invalid update for workflow type");
		}

		return updateData;
	}
}

export const milestonesRouter = new Hono()
	.use("*", authMiddleware)

	// Get milestones for a component
	.get("/component/:componentId", async (c) => {
		try {
			const componentId = c.req.param("componentId");
			const userId = c.get("user")?.id;

			// Verify user has access to the component
			const component = await prisma.component.findFirst({
				where: {
					id: componentId,
					project: {
						organization: {
							members: {
								some: { userId },
							},
						},
					},
				},
			});

			if (!component) {
				return c.json(
					{ error: "Component not found or access denied" },
					403,
				);
			}

			const milestones = await prisma.componentMilestone.findMany({
				where: { componentId },
				orderBy: { milestoneOrder: "asc" },
				include: {
					completer: {
						select: { id: true, name: true, email: true },
					},
				},
			});

			return c.json(milestones);
		} catch (error) {
			return c.json({ error: "Failed to fetch milestones" }, 500);
		}
	})

	// Update single milestone
	.patch("/:id", async (c) => {
		try {
			const id = c.req.param("id");
			const body = await c.req.json();
			const userId = c.get("user")?.id;

			if (!userId) {
				return c.json({ error: "User not authenticated" }, 401);
			}

			// Get existing milestone with component info
			const existing = await prisma.componentMilestone.findFirst({
				where: { id },
				include: {
					component: {
						include: {
							project: true,
						},
					},
				},
			});

			if (!existing) {
				return c.json({ error: "Milestone not found" }, 404);
			}

			// Verify user has access
			const hasAccess = await prisma.member.findFirst({
				where: {
					userId,
					organizationId: existing.component.project.organizationId,
				},
			});

			if (!hasAccess) {
				return c.json(
					{
						error: `User is not a member of organization ${existing.component.project.organizationId}`,
						organizationId:
							existing.component.project.organizationId,
					},
					403,
				);
			}

			// Validate effectiveDate if provided
			if (body.effectiveDate) {
				const backdatingValidation = (await prisma.$queryRaw`
          SELECT is_backdating_allowed(${body.effectiveDate}::DATE) as is_allowed
        `) as any[];

				if (!backdatingValidation[0]?.is_allowed) {
					return c.json(
						{
							error: "Invalid effective date - backdating not allowed beyond grace period",
							details:
								"Data modifications must be within the current reporting period or grace period (Tuesday 9 AM cutoff)",
						},
						400,
					);
				}
			}

			// Prepare update data based on workflow type
			const updateData: any = {};
			const workflowType = existing.component.workflowType;

			// Set effectiveDate if provided, otherwise use current date for completed milestones
			if (body.effectiveDate) {
				updateData.effectiveDate = new Date(body.effectiveDate);
			}

			if (
				workflowType === "MILESTONE_DISCRETE" &&
				"isCompleted" in body
			) {
				updateData.isCompleted = body.isCompleted;
				if (body.isCompleted) {
					updateData.completedAt = new Date();
					updateData.completedBy = userId;
					// Set effectiveDate to current date if not already set
					if (!updateData.effectiveDate) {
						updateData.effectiveDate = new Date();
					}
				} else {
					updateData.completedAt = null;
					updateData.completedBy = null;
				}
			} else if (
				workflowType === "MILESTONE_PERCENTAGE" &&
				"percentageValue" in body
			) {
				updateData.percentageComplete = body.percentageValue;
				updateData.isCompleted = body.percentageValue >= 100;
				if (updateData.isCompleted) {
					updateData.completedAt = new Date();
					updateData.completedBy = userId;
					// Set effectiveDate to current date if not already set
					if (!updateData.effectiveDate) {
						updateData.effectiveDate = new Date();
					}
				} else if (existing.isCompleted && !updateData.isCompleted) {
					// Uncompleting a milestone
					updateData.completedAt = null;
					updateData.completedBy = null;
				}
			} else if (
				workflowType === "MILESTONE_QUANTITY" &&
				"quantityValue" in body
			) {
				updateData.quantityComplete = body.quantityValue;
				updateData.isCompleted =
					body.quantityValue >= 0;
				if (updateData.isCompleted) {
					updateData.completedAt = new Date();
					updateData.completedBy = userId;
					// Set effectiveDate to current date if not already set
					if (!updateData.effectiveDate) {
						updateData.effectiveDate = new Date();
					}
				} else if (existing.isCompleted && !updateData.isCompleted) {
					// Uncompleting a milestone
					updateData.completedAt = null;
					updateData.completedBy = null;
				}
			} else {
				return c.json(
					{ error: "Invalid update for workflow type" },
					400,
				);
			}

			// Use transaction to ensure atomic updates of milestone and FieldWeld
			const milestone = await prisma.$transaction(async (tx) => {
				// Update milestone
				const updatedMilestone = await tx.componentMilestone.update({
					where: { id },
					data: updateData,
					include: {
						completer: {
							select: { id: true, name: true, email: true },
						},
					},
				});

				// Sync FieldWeld record if this is a Weld Made milestone
				if (existing.milestoneName === "Weld Made") {
					console.log(
						"🔧 [DEBUG] Weld Made milestone update detected:",
						{
							milestoneId: existing.id,
							componentId: existing.componentId,
							isCompleted: updateData.isCompleted,
							welderId: body.welderId,
							welderComments: body.welderComments,
							effectiveDate: updateData.effectiveDate,
						},
					);

					if (updateData.isCompleted === true) {
						// Weld milestone completed - update FieldWeld dateWelded, welderId, and comments
						const effectiveDate =
							updateData.effectiveDate || new Date();
						const fieldWeldData: any = {
							dateWelded: effectiveDate,
						};
						if (body.welderId) {
							fieldWeldData.welderId = body.welderId;
						}
						if (body.welderComments) {
							fieldWeldData.comments = body.welderComments;
						}

						console.log(
							"🔧 [DEBUG] About to update FieldWeld with data:",
							fieldWeldData,
						);

						// First, let's find the component to get its weldId
						const component = await tx.component.findUnique({
							where: { id: existing.componentId },
							select: {
								weldId: true,
								componentId: true,
								displayId: true,
							},
						});

						console.log("🔧 [DEBUG] Component found:", component);

						if (component?.weldId) {
							await tx.fieldWeld.updateMany({
								where: { weldIdNumber: component.weldId },
								data: fieldWeldData,
							});
							console.log(
								`🔧 [DEBUG] FieldWeld updated successfully for weldId: ${component.weldId}`,
							);
						} else {
							console.error(
								`🔧 [ERROR] No weldId found for component ${existing.componentId}`,
							);
						}
					} else if (updateData.isCompleted === false) {
						// Weld milestone uncompleted - clear FieldWeld dateWelded, welderId, and comments
						console.log(
							"🔧 [DEBUG] Clearing Weld Made milestone data",
						);

						const component = await tx.component.findUnique({
							where: { id: existing.componentId },
							select: { weldId: true },
						});

						if (component?.weldId) {
							await tx.fieldWeld.updateMany({
								where: { weldIdNumber: component.weldId },
								data: {
									dateWelded: null,
									welderId: null,
									comments: null,
								},
							});
							console.log(
								`🔧 [DEBUG] FieldWeld cleared for weldId: ${component.weldId}`,
							);
						}
					}
				}

				return updatedMilestone;
			});

			// Broadcast milestone celebration if completed
			if (updateData.isCompleted && !existing.isCompleted) {
				await broadcastMilestoneCelebration(
					existing.component.projectId,
					existing.componentId,
					existing.milestoneName,
					userId,
				);
			}

			// Recalculate component completion
			await recalculateComponentCompletion(existing.componentId);

			// Create audit log
			await prisma.auditLog.create({
				data: {
					projectId: existing.component.projectId,
					userId,
					entityType: "component_milestone",
					entityId: id,
					action: "UPDATE",
					changes: Object.keys(updateData).reduce((acc, key) => {
						acc[key] = {
							old: (existing as any)[key],
							new: (milestone as any)[key],
						};
						return acc;
					}, {} as any),
				},
			});

			return c.json(milestone);
		} catch (error) {
			return c.json({ error: "Failed to update milestone" }, 500);
		}
	})

	// Enhanced bulk update milestones with batch processing
	.post("/bulk-update", async (c) => {
		try {
			const body = await c.req.json();
			const {
				updates,
				options = {
					validateOnly: false,
					atomic: true,
					notify: true,
					batchSize: 50,
				},
				metadata,
			} = BulkMilestoneUpdateSchema.parse(body);
			const userId = c.get("user")?.id;

			if (!userId) {
				return c.json(
					{
						code: "UNAUTHENTICATED",
						message: "User not authenticated",
					},
					401,
				);
			}

			// Generate transaction ID for tracking
			const transactionId =
				metadata?.transactionId ||
				`bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

			// Initialize batch processor
			const processor = new MilestoneBatchProcessor(userId);

			// Validation phase
			const { valid, invalid } = await processor.validateBatch(updates);

			if (options.validateOnly) {
				return c.json({
					valid: valid.length,
					invalid: invalid.length,
					transactionId,
					validation: {
						validUpdates: valid.map((u) => ({
							componentId: u.componentId,
							milestoneName: u.milestoneName,
						})),
						invalidUpdates: invalid,
					},
				});
			}

			// If atomic mode and there are validation errors, fail early
			if (options.atomic && invalid.length > 0) {
				return c.json(
					{
						code: "VALIDATION_FAILED",
						message:
							"Some updates are invalid and atomic mode is enabled",
						details: { invalid },
						transactionId,
					},
					400,
				);
			}

			// Process valid updates in batches
			let results: any[] = [];
			if (valid.length > 0) {
				results = await processor.processBatch(
					valid,
					options.batchSize,
				);
			}

			// Add validation errors to results
			invalid.forEach((item) => {
				results.push({
					componentId: item.componentId,
					milestoneName: item.milestoneName,
					success: false,
					error: item.error,
				});
			});

			// Collect affected components for completion recalculation
			const _componentIds = new Set(
				results.filter((r) => r.success).map((r) => r.componentId),
			);

			// Recalculate completion for affected components in batches
			const componentBatches = Array.from(_componentIds).reduce(
				(batches, id, index) => {
					const batchIndex = Math.floor(index / 10);
					if (!batches[batchIndex]) batches[batchIndex] = [];
					batches[batchIndex].push(id);
					return batches;
				},
				[] as string[][],
			);

			for (const batch of componentBatches) {
				await Promise.all(
					batch.map((id: string) => recalculateComponentCompletion(id)),
				);
			}

			const successful = results.filter((r) => r.success).length;
			const failed = results.filter((r) => !r.success).length;

			// Send real-time notifications if enabled
			if (options.notify && successful > 0) {
				// Real-time notifications would be handled by the frontend
				// using Supabase subscriptions to database changes
				// for (const projectId of affectedProjectIds) {
				//   await supabase.channel(`project:${projectId}`)
				//     .send({
				//       type: 'broadcast',
				//       event: 'bulk_milestone_update',
				//       payload: {
				//         transactionId,
				//         updated: successful,
				//         userId,
				//         timestamp: new Date().toISOString()
				//       }
				//     });
				// }
			}

			return c.json({
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
		} catch (error) {
			if (error instanceof z.ZodError) {
				return c.json(
					{
						code: "INVALID_INPUT",
						message: "Invalid input",
						details: error.errors,
					},
					400,
				);
			}
			console.error("Bulk update error:", error);
			return c.json(
				{
					code: "INTERNAL_ERROR",
					message: "Failed to update milestones",
					details:
						error instanceof Error
							? error.message
							: "Unknown error",
				},
				500,
			);
		}
	})

	// Preview bulk update results without applying changes
	.post("/preview-bulk", async (c) => {
		try {
			const body = await c.req.json();
			const { updates } = BulkMilestoneUpdateSchema.parse(body);
			const userId = c.get("user")?.id;

			if (!userId) {
				return c.json(
					{
						code: "UNAUTHENTICATED",
						message: "User not authenticated",
					},
					401,
				);
			}

			const processor = new MilestoneBatchProcessor(userId);
			const { valid, invalid } = await processor.validateBatch(updates);

			// For valid updates, fetch current milestone values for comparison
			const preview = await Promise.all(
				valid.map(async (update) => {
					const milestone = update.milestone;
					const currentValues = {
						isCompleted: milestone.isCompleted,
						percentageComplete: milestone.percentageComplete,
						quantityComplete: milestone.quantityComplete,
						completedAt: milestone.completedAt,
						completedBy: milestone.completedBy,
					};

					// Calculate what the new values would be
					const mockProcessor = new MilestoneBatchProcessor(userId);
					const newValues = mockProcessor["prepareUpdateData"](
						update,
						milestone,
						userId,
					);

					return {
						componentId: update.componentId,
						milestoneName: update.milestoneName,
						currentValues,
						newValues: { ...currentValues, ...newValues },
						hasChanges: Object.keys(newValues).some(
							(key) =>
								currentValues[
									key as keyof typeof currentValues
								] !== newValues[key],
						),
					};
				}),
			);

			return c.json({
				totalUpdates: updates.length,
				validUpdates: valid.length,
				invalidUpdates: invalid.length,
				preview,
				invalid: invalid.map((item) => ({
					componentId: item.componentId,
					milestoneName: item.milestoneName,
					error: item.error,
				})),
			});
		} catch (error) {
			if (error instanceof z.ZodError) {
				return c.json(
					{
						code: "INVALID_INPUT",
						message: "Invalid input",
						details: error.errors,
					},
					400,
				);
			}
			return c.json(
				{
					code: "INTERNAL_ERROR",
					message: "Failed to preview updates",
				},
				500,
			);
		}
	})

	// Process offline operation queue
	.post("/sync", async (c) => {
		try {
			const body = await c.req.json();
			const { operations } = SyncQueueSchema.parse(body);
			const userId = c.get("user")?.id;

			if (!userId) {
				return c.json(
					{
						code: "UNAUTHENTICATED",
						message: "User not authenticated",
					},
					401,
				);
			}

			const results = [];
			const processor = new MilestoneBatchProcessor(userId);

			for (const operation of operations) {
				try {
					if (operation.type === "milestone_update") {
						// Single milestone update
						const result = await processor.processBatch(
							[operation.data],
							1,
						);
						results.push({
							operationId: operation.id,
							success: result[0]?.success || false,
							error: result[0]?.error,
							result: result[0],
						});
					} else if (operation.type === "bulk_milestone_update") {
						// Bulk milestone update
						const bulkResults = await processor.processBatch(
							operation.data.updates,
							50,
						);
						results.push({
							operationId: operation.id,
							success: bulkResults.every((r) => r.success),
							error: bulkResults.find((r) => !r.success)?.error,
							results: bulkResults,
						});
					}
				} catch (error) {
					results.push({
						operationId: operation.id,
						success: false,
						error:
							error instanceof Error
								? error.message
								: "Unknown error",
					});
				}
			}

			// Calculate sync statistics
			const successful = results.filter((r) => r.success).length;
			const failed = results.filter((r) => !r.success).length;

			return c.json({
				syncTimestamp: new Date().toISOString(),
				operationsProcessed: operations.length,
				successful,
				failed,
				results,
			});
		} catch (error) {
			if (error instanceof z.ZodError) {
				return c.json(
					{
						code: "INVALID_INPUT",
						message: "Invalid input",
						details: error.errors,
					},
					400,
				);
			}
			return c.json(
				{ code: "SYNC_ERROR", message: "Failed to sync operations" },
				500,
			);
		}
	})

	// Get recent milestone updates for a project
	.get("/recent/:projectId", async (c) => {
		try {
			const projectId = c.req.param("projectId");
			const userId = c.get("user")?.id;
			const limit = Number.parseInt(c.req.query("limit") || "50");
			const offset = Number.parseInt(c.req.query("offset") || "0");

			// Verify user has access to the project
			const project = await prisma.project.findFirst({
				where: {
					id: projectId,
					organization: {
						members: {
							some: { userId },
						},
					},
				},
			});

			if (!project) {
				return c.json(
					{
						code: "ACCESS_DENIED",
						message: "Project not found or access denied",
					},
					403,
				);
			}

			const recentUpdates = await prisma.auditLog.findMany({
				where: {
					projectId,
					entityType: "component_milestone",
					action: "UPDATE",
				},
				orderBy: { timestamp: "desc" },
				take: limit,
				skip: offset,
				include: {
					user: {
						select: { id: true, name: true, email: true },
					},
				},
			});

			// Enrich with milestone and component data
			const enrichedUpdates = await Promise.all(
				recentUpdates.map(async (log) => {
					const milestone =
						await prisma.componentMilestone.findUnique({
							where: { id: log.entityId },
							include: {
								component: {
									select: {
										id: true,
										componentId: true,
										type: true,
										drawing: {
											select: {
												number: true,
												title: true,
											},
										},
									},
								},
							},
						});

					return {
						...log,
						milestone: milestone
							? {
									id: milestone.id,
									name: milestone.milestoneName,
									component: milestone.component,
								}
							: null,
					};
				}),
			);

			return c.json({
				updates: enrichedUpdates,
				pagination: {
					limit,
					offset,
					hasMore: recentUpdates.length === limit,
				},
			});
		} catch (error) {
			return c.json(
				{
					code: "INTERNAL_ERROR",
					message: "Failed to fetch recent updates",
				},
				500,
			);
		}
	})

	// Real-time presence tracking endpoint
	.post("/presence/:projectId", async (c) => {
		try {
			const projectId = c.req.param("projectId");
			const userId = c.get("user")?.id;
			const body = await c.req.json();

			if (!userId) {
				return c.json(
					{
						code: "UNAUTHENTICATED",
						message: "User not authenticated",
					},
					401,
				);
			}

			const { componentId: _componentId, action: _action, timestamp: _timestamp } = body;

			// Verify user has access to the project
			const project = await prisma.project.findFirst({
				where: {
					id: projectId,
					organization: {
						members: {
							some: { userId },
						},
					},
				},
			});

			if (!project) {
				return c.json(
					{
						code: "ACCESS_DENIED",
						message: "Project not found or access denied",
					},
					403,
				);
			}

			// Real-time presence would be handled by the frontend
			// using Supabase subscriptions
			// await supabase.channel(`project:${projectId}`)
			//   .send({
			//     type: 'broadcast',
			//     event: 'user_presence',
			//     payload: {
			//       userId,
			//       componentId,
			//       action, // 'editing_start', 'editing_end', 'viewing'
			//       timestamp: timestamp || new Date().toISOString()
			//     }
			//   });

			return c.json({
				success: true,
				message: "Presence updated",
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			return c.json(
				{
					code: "INTERNAL_ERROR",
					message: "Failed to update presence",
				},
				500,
			);
		}
	})

	// Conflict resolution endpoint
	.post("/resolve-conflict", async (c) => {
		try {
			const userId = c.get("user")?.id;
			const body = await c.req.json();

			if (!userId) {
				return c.json(
					{
						code: "UNAUTHENTICATED",
						message: "User not authenticated",
					},
					401,
				);
			}

			const { milestoneId, resolution, serverVersion, clientVersion } =
				body;

			// Get milestone with access verification
			const milestone = await prisma.componentMilestone.findFirst({
				where: {
					id: milestoneId,
					component: {
						project: {
							organization: {
								members: {
									some: { userId },
								},
							},
						},
					},
				},
				include: {
					component: {
						include: {
							project: true,
						},
					},
				},
			});

			if (!milestone) {
				return c.json(
					{
						code: "ACCESS_DENIED",
						message: "Milestone not found or access denied",
					},
					403,
				);
			}

			// Apply resolution based on strategy
			let resolvedData: any = {};

			switch (resolution.strategy) {
				case "accept_server":
					// Keep current server values (no update needed)
					break;

				case "accept_client":
					resolvedData = {
						isCompleted: clientVersion.isCompleted,
						percentageComplete: clientVersion.percentageComplete,
						quantityComplete: clientVersion.quantityComplete,
						completedAt: clientVersion.isCompleted
							? new Date()
							: null,
						completedBy: clientVersion.isCompleted ? userId : null,
					};
					break;

				case "custom":
					resolvedData = {
						isCompleted: resolution.customValues.isCompleted,
						percentageComplete:
							resolution.customValues.percentageComplete,
						quantityComplete:
							resolution.customValues.quantityComplete,
						completedAt: resolution.customValues.isCompleted
							? new Date()
							: null,
						completedBy: resolution.customValues.isCompleted
							? userId
							: null,
					};
					break;

				default:
					return c.json(
						{
							code: "INVALID_RESOLUTION",
							message: "Invalid resolution strategy",
						},
						400,
					);
			}

			// Update milestone if resolution requires changes
			let updatedMilestone = milestone;
			if (Object.keys(resolvedData).length > 0) {
				updatedMilestone = await prisma.componentMilestone.update({
					where: { id: milestoneId },
					data: resolvedData,
					include: {
						completer: {
							select: { id: true, name: true, email: true },
						},
						component: {
							include: {
								project: true,
							},
						},
					},
				});

				// Create audit log for conflict resolution
				await prisma.auditLog.create({
					data: {
						projectId: updatedMilestone.component.project.id,
						userId,
						entityType: "component_milestone",
						entityId: milestoneId,
						action: "CONFLICT_RESOLVED",
						changes: {
							resolution: resolution.strategy,
							serverVersion,
							clientVersion,
							resolvedValues: resolvedData,
						},
					},
				});

				// Recalculate component completion
				await recalculateComponentCompletion(milestone.componentId);
			}

			// Real-time conflict resolution would be handled by the frontend
			// await supabase.channel(`project:${milestone.component.project.id}`)
			//   .send({
			//     type: 'broadcast',
			//     event: 'conflict_resolved',
			//     payload: {
			//       milestoneId,
			//       componentId: milestone.componentId,
			//       userId,
			//       resolution: resolution.strategy,
			//       timestamp: new Date().toISOString()
			//     }
			//   });

			return c.json({
				success: true,
				milestone: updatedMilestone,
				resolution: resolution.strategy,
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			console.error("Conflict resolution error:", error);
			return c.json(
				{
					code: "INTERNAL_ERROR",
					message: "Failed to resolve conflict",
				},
				500,
			);
		}
	})

	// Undo bulk operation endpoint
	.post("/undo/:transactionId", async (c) => {
		try {
			const transactionId = c.req.param("transactionId");
			const userId = c.get("user")?.id;

			if (!userId) {
				return c.json(
					{
						code: "UNAUTHENTICATED",
						message: "User not authenticated",
					},
					401,
				);
			}

			// Find the transaction record
			const transaction = (await prisma.$queryRaw`
        SELECT * FROM "BulkOperationTransaction" 
        WHERE id = ${transactionId} 
        AND "userId" = ${userId}
        AND status = 'completed'
      `) as any[];

			if (!transaction || transaction.length === 0) {
				return c.json(
					{
						code: "TRANSACTION_NOT_FOUND",
						message: "Transaction not found or cannot be undone",
					},
					404,
				);
			}

			const txRecord = transaction[0];

			// Get all audit logs for this transaction (within a reasonable time window)
			const auditLogs = await prisma.auditLog.findMany({
				where: {
					userId,
					entityType: "component_milestone",
					action: "UPDATE",
					timestamp: {
						gte: new Date(txRecord.startedAt),
						lte: new Date(txRecord.completedAt || Date.now()),
					},
				},
				include: {
					user: {
					select: { id: true, name: true, email: true }
				},
				},
			});

			if (auditLogs.length === 0) {
				return c.json(
					{
						code: "NO_CHANGES_FOUND",
						message:
							"No changes found to undo for this transaction",
					},
					404,
				);
			}

			// Perform undo operations in a transaction
			const undoResults = await prisma.$transaction(async (tx) => {
				const results = [];

				for (const log of auditLogs) {
					try {
						// Revert each change
						const changes = log.changes as any;
						const revertData: any = {};

						// Build revert data from audit log
						for (const [field, change] of Object.entries(changes)) {
							if (
								typeof change === "object" &&
								change &&
								"old" in change
							) {
								revertData[field] = (change as any).old;
							}
						}

						// Apply revert
						await tx.componentMilestone.update({
							where: { id: log.entityId },
							data: revertData,
						});

						results.push({
							milestoneId: log.entityId,
							success: true,
							reverted: Object.keys(revertData),
						});
					} catch (error) {
						results.push({
							milestoneId: log.entityId,
							success: false,
							error:
								error instanceof Error
									? error.message
									: "Unknown error",
						});
					}
				}

				// Update transaction status
				await tx.$executeRaw`
          UPDATE "BulkOperationTransaction" 
          SET status = 'rolled_back', 
              "updatedAt" = NOW(),
              metadata = jsonb_set(
                COALESCE(metadata, '{}'), 
                '{undoneAt}', 
                to_jsonb(NOW()::text)
              )
          WHERE id = ${transactionId}
        `;

				return results;
			});

			// Note: Component completion recalculation would be handled
			// separately after the undo operation if needed

			const successful = undoResults.filter((r) => r.success).length;
			const failed = undoResults.filter((r) => !r.success).length;

			// Real-time undo notifications would be handled by the frontend
			// await supabase.channel(`transaction:${transactionId}`)
			//   .send({
			//     type: 'broadcast',
			//     event: 'bulk_operation_undone',
			//     payload: {
			//       transactionId,
			//       undone: successful,
			//       failed,
			//       userId,
			//       timestamp: new Date().toISOString()
			//     }
			//   });

			return c.json({
				success: true,
				transactionId,
				undone: successful,
				failed,
				results: undoResults,
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			console.error("Undo operation error:", error);
			return c.json(
				{
					code: "UNDO_FAILED",
					message: "Failed to undo bulk operation",
					details:
						error instanceof Error
							? error.message
							: "Unknown error",
				},
				500,
			);
		}
	})

	// Get milestone statistics for a project
	.get("/stats/:projectId", async (c) => {
		try {
			const projectId = c.req.param("projectId");
			const userId = c.get("user")?.id;

			// Verify user has access to the project
			const project = await prisma.project.findFirst({
				where: {
					id: projectId,
					organization: {
						members: {
							some: { userId },
						},
					},
				},
			});

			if (!project) {
				return c.json(
					{ error: "Project not found or access denied" },
					403,
				);
			}

			// Get milestone statistics
			const milestoneStats = await prisma.$queryRaw`
        SELECT 
          cm.milestoneName,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE cm.isCompleted = true) as completed,
          AVG(cm.percentageComplete) as avgPercentage
        FROM component_milestone cm
        JOIN component c ON cm.componentId = c.id
        WHERE c.projectId = ${projectId}
        GROUP BY cm.milestoneName
        ORDER BY MIN(cm.milestoneOrder)
      `;

			const recentUpdates = await prisma.componentMilestone.findMany({
				where: {
					component: { projectId },
					completedAt: { not: null },
				},
				orderBy: { completedAt: "desc" },
				take: 20,
				include: {
					component: {
						select: { id: true, componentId: true, type: true },
					},
					completer: {
						select: { id: true, name: true, email: true },
					},
				},
			});

			return c.json({
				milestoneStats,
				recentUpdates,
			});
		} catch (error) {
			return c.json(
				{ error: "Failed to fetch milestone statistics" },
				500,
			);
		}
	})

	// New bulk update discrete milestones endpoint
	.post("/bulk-update-discrete", async (c) => {
		try {
			const body = await c.req.json();
			const userId = c.get("user")?.id;

			if (!userId) {
				return c.json(
					{
						code: "UNAUTHENTICATED",
						message: "User not authenticated",
					},
					401,
				);
			}

			// Parse request body
			const { mode, milestoneName, _componentIds, groups, projectId } =
				body;

			// Use database transaction to ensure atomicity
			const results = await prisma.$transaction(async (tx) => {
				const transactionResults = {
					successful: [] as Array<{
						componentId: string;
						milestoneName: string;
						milestone?: any;
					}>,
					failed: [] as Array<{
						componentId: string;
						milestoneName?: string;
						error: string;
					}>,
					total: 0,
				};

				if (mode === "quick" && milestoneName && _componentIds) {
					// Quick mode - apply same milestone to all components
					transactionResults.total = _componentIds.length;

					// First, find all milestones that exist and user has access to
					const validMilestones =
						await tx.componentMilestone.findMany({
							where: {
								componentId: { in: _componentIds },
								milestoneName,
								component: {
									project: {
										organization: {
											members: { some: { userId } },
										},
									},
								},
							},
							include: {
								component: { select: { id: true } },
							},
						});

					const validComponentIds = validMilestones.map(
						(m) => m.componentId,
					);
					const invalidComponentIds = _componentIds.filter(
						(id: string) => !validComponentIds.includes(id),
					);

					// Add failed results for invalid components
					invalidComponentIds.forEach((componentId: string) => {
						transactionResults.failed.push({
							componentId,
							milestoneName,
							error: `Milestone "${milestoneName}" not found for component or access denied`,
						});
					});

					if (validMilestones.length > 0) {
						// Batch update all valid milestones within transaction
						const updateResult =
							await tx.componentMilestone.updateMany({
								where: {
									componentId: { in: validComponentIds },
									milestoneName,
								},
								data: {
									isCompleted: true,
									completedAt: new Date(),
									completedBy: userId,
								},
							});

						console.log(
							`Updated ${updateResult.count} milestones for ${validComponentIds.length} components`,
						);

						// Sync FieldWeld records if this is a Weld Made milestone
						if (milestoneName === "Weld Made") {
							console.log(
								`🔧 [DEBUG BULK] Bulk Weld Made milestone update for ${validComponentIds.length} components`,
							);

							// Get all components with their weldIds
							const components = await tx.component.findMany({
								where: { id: { in: validComponentIds } },
								select: {
									id: true,
									weldId: true,
									componentId: true,
								},
							});

							const weldIds = components
								.filter((c) => c.weldId)
								.map((c) => c.weldId!);
							console.log(
								`🔧 [DEBUG BULK] Found ${weldIds.length} weldIds:`,
								weldIds,
							);

							if (weldIds.length > 0) {
								await tx.fieldWeld.updateMany({
									where: { weldIdNumber: { in: weldIds } },
									data: { dateWelded: new Date() },
								});
								console.log(
									`🔧 [DEBUG BULK] Updated ${weldIds.length} FieldWelds`,
								);
							}
						}

						// Verify the updates were successful by fetching the updated records
						const updatedMilestones =
							await tx.componentMilestone.findMany({
								where: {
									componentId: { in: validComponentIds },
									milestoneName,
									isCompleted: true,
									completedBy: userId,
								},
							});

						// Add successful results
						updatedMilestones.forEach((milestone: any) => {
							transactionResults.successful.push({
								componentId: milestone.componentId,
								milestoneName,
								milestone,
							});
						});

						// Recalculate component completion within the transaction
						await batchRecalculateCompletionInTransaction(
							tx,
							validComponentIds,
						);
					}
				} else if (mode === "advanced" && groups) {
					// Advanced mode - different milestones per group
					transactionResults.total = groups.reduce(
						(sum: number, group: any) =>
							sum +
							(group._componentIds?.length || 0) *
								(group.milestones?.length || 0),
						0,
					);

					for (const group of groups) {
						for (const componentId of group._componentIds || []) {
							for (const milestoneName of group.milestones ||
								[]) {
								try {
									// Find the milestone for this component
									const milestone =
										await tx.componentMilestone.findFirst({
											where: {
												componentId,
												milestoneName,
												component: {
													project: {
														organization: {
															members: {
																some: {
																	userId,
																},
															},
														},
													},
												},
											},
										});

									if (!milestone) {
										transactionResults.failed.push({
											componentId,
											milestoneName,
											error: `Milestone "${milestoneName}" not found for component`,
										});
										continue;
									}

									// Update milestone to completed within transaction
									const updated =
										await tx.componentMilestone.update({
											where: { id: milestone.id },
											data: {
												isCompleted: true,
												completedAt: new Date(),
												completedBy: userId,
											},
										});

									// Sync FieldWeld record if this is a Weld Made milestone
									if (milestoneName === "Weld Made") {
										// First get the component's weldId to query FieldWeld correctly
										const component =
											await tx.component.findUnique({
												where: { id: componentId },
												select: {
													weldId: true,
													componentId: true,
													displayId: true,
												},
											});
										console.log(
											`🔧 [DEBUG BATCH UPDATE] Component ${componentId} weldId:`,
											component?.weldId,
										);

										if (component?.weldId) {
											await tx.fieldWeld.updateMany({
												where: {
													weldIdNumber:
														component.weldId,
												},
												data: {
													dateWelded: new Date(),
												},
											});
											console.log(
												"🔧 [DEBUG BATCH UPDATE] Updated FieldWeld with weldIdNumber:",
												component.weldId,
											);
										}
									}

									transactionResults.successful.push({
										componentId,
										milestoneName,
										milestone: updated,
									});
								} catch (error) {
									transactionResults.failed.push({
										componentId,
										milestoneName,
										error:
											error instanceof Error
												? error.message
												: "Update failed",
									});
								}
							}
						}
					}

					// Batch recalculate completion for all affected components within transaction
					const affectedComponents = new Set(
						groups.flatMap(
							(group: any) => group._componentIds || [],
						),
					);

					await batchRecalculateCompletionInTransaction(
						tx,
						Array.from(affectedComponents) as string[],
					);
				} else {
					throw new Error("Invalid request format");
				}

				return transactionResults;
			}); // End of transaction

			// Create audit log for bulk operation
			if (results.successful.length > 0) {
				try {
					// Get project ID from the first successful update
					const firstComponent = await prisma.component.findUnique({
						where: { id: results.successful[0].componentId },
						select: { projectId: true },
					});

					if (firstComponent) {
						await prisma.auditLog.create({
							data: {
								projectId: firstComponent.projectId,
								userId,
								action: "BULK_MILESTONE_UPDATE",
								entityType: "component_milestone",
								entityId: `bulk_${Date.now()}`,
								changes: {
									mode,
									milestoneName:
										mode === "quick"
											? milestoneName
											: undefined,
									successful: results.successful.length,
									failed: results.failed.length,
									_componentIds: results.successful.map(
										(r) => r.componentId,
									),
								},
							},
						});
					}
				} catch (error) {
					console.error("Failed to create audit log:", error);
				}
			}

			// Add transaction verification info
			const responseWithMetadata = {
				...results,
				transactionId: `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
				timestamp: new Date().toISOString(),
				metadata: {
					mode,
					userId,
					projectId,
					processingTimeMs: Date.now() - Date.now(), // This would be calculated from start time
				},
			};

			// Verify response integrity
			const actualTotal =
				results.successful.length + results.failed.length;
			if (actualTotal !== results.total) {
				console.warn(
					`Total mismatch: expected ${results.total}, got ${actualTotal}`,
				);
				responseWithMetadata.total = actualTotal;
			}

			return c.json(responseWithMetadata);
		} catch (error) {
			console.error("Bulk discrete milestone update error:", error);
			return c.json(
				{
					code: "INTERNAL_ERROR",
					message: "Failed to update milestones",
					details:
						error instanceof Error
							? error.message
							: "Unknown error",
					successful: [],
					failed: [],
					total: 0,
					transactionId: `failed_${Date.now()}`,
					timestamp: new Date().toISOString(),
				},
				500,
			);
		}
	});

// Helper function to batch recalculate component completion (optimized) - unused but kept for future use
// async function batchRecalculateCompletion(componentIds: string[]) {
//	if (componentIds.length === 0) return;
//
//	// Process in chunks to avoid overwhelming the database
//	const chunkSize = 50;
//	const chunks = [];
//
//	for (let i = 0; i < componentIds.length; i += chunkSize) {
//		chunks.push(componentIds.slice(i, i + chunkSize));
//	}
//
//	for (const chunk of chunks) {
//		try {
//			// Use Promise.all with limited concurrency for this chunk
//			await Promise.all(
//				chunk.map((componentId: string) =>
//					recalculateComponentCompletion(componentId),
//				),
//			);
//		} catch (error) {
//			console.error("Failed to recalculate completion for chunk:", error);
//			// Continue with other chunks even if one fails
//		}
//	}
// }

// Helper function to batch recalculate component completion within a transaction
async function batchRecalculateCompletionInTransaction(
	tx: any,
	_componentIds: string[],
) {
	if (_componentIds.length === 0) return;

	console.log(
		`Recalculating completion for ${_componentIds.length} components within transaction`,
	);

	// Process in smaller chunks within transaction to avoid timeouts
	const chunkSize = 25;
	const chunks = [];

	for (let i = 0; i < _componentIds.length; i += chunkSize) {
		chunks.push(_componentIds.slice(i, i + chunkSize));
	}

	for (const chunk of chunks) {
		try {
			// Use Promise.all with limited concurrency for this chunk
			await Promise.all(
				chunk.map((componentId) =>
					recalculateComponentCompletionInTransaction(
						tx,
						componentId,
					),
				),
			);
		} catch (error) {
			console.error(
				"Failed to recalculate completion for chunk within transaction:",
				error,
			);
			// Continue with other chunks even if one fails
		}
	}
}

// Helper function to recalculate component completion
async function recalculateComponentCompletion(componentId: string) {
	const component = await prisma.component.findUnique({
		where: { id: componentId },
		include: {
			milestones: true,
			milestoneTemplate: true,
		},
	});

	if (!component) return;

	let completionPercent = 0;
	const milestoneData = component.milestoneTemplate.milestones as any[];

	if (component.workflowType === "MILESTONE_DISCRETE") {
		// Calculate based on completed milestones with weights
		let totalWeight = 0;
		let completedWeight = 0;

		component.milestones.forEach((milestone: any) => {
			const weight =
				milestoneData[milestone.milestoneOrder - 1]?.weight || 1;
			totalWeight += weight;
			if (milestone.isCompleted) {
				completedWeight += weight;
			}
		});

		completionPercent =
			totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;
	} else if (component.workflowType === "MILESTONE_PERCENTAGE") {
		// Average the percentages with weights
		let totalWeight = 0;
		let weightedSum = 0;

		component.milestones.forEach((milestone: any) => {
			const weight =
				milestoneData[milestone.milestoneOrder - 1]?.weight || 1;
			totalWeight += weight;
			weightedSum += (milestone.percentageValue || 0) * weight;
		});

		completionPercent = totalWeight > 0 ? weightedSum / totalWeight : 0;
	} else if (component.workflowType === "MILESTONE_QUANTITY") {
		// Calculate based on quantities with weights
		let totalWeight = 0;
		let weightedSum = 0;

		component.milestones.forEach((milestone: any) => {
			const weight =
				milestoneData[milestone.milestoneOrder - 1]?.weight || 1;
			totalWeight += weight;
			if ((milestone as any).quantityTotal && (milestone as any).quantityTotal > 0) {
				const percentage =
					((milestone.quantityValue || 0) /
						(milestone as any).quantityTotal) *
					100;
				weightedSum += percentage * weight;
			}
		});

		completionPercent = totalWeight > 0 ? weightedSum / totalWeight : 0;
	}

	// Ensure completion is between 0 and 100
	completionPercent = Math.min(Math.max(completionPercent, 0), 100);

	// Update component status based on completion
	const status =
		completionPercent === 0
			? "NOT_STARTED"
			: completionPercent < 100
				? "IN_PROGRESS"
				: "COMPLETED";

	await prisma.component.update({
		where: { id: componentId },
		data: {
			completionPercent,
			status,
		},
	});
}

// Helper function to recalculate component completion within a transaction
async function recalculateComponentCompletionInTransaction(
	tx: any,
	componentId: string,
) {
	const component = await tx.component.findUnique({
		where: { id: componentId },
		include: {
			milestones: true,
			milestoneTemplate: true,
		},
	});

	if (!component) return;

	let completionPercent = 0;
	const milestoneData = component.milestoneTemplate.milestones as any[];

	if (component.workflowType === "MILESTONE_DISCRETE") {
		// Calculate based on completed milestones with weights
		let totalWeight = 0;
		let completedWeight = 0;

		component.milestones.forEach((milestone: any) => {
			const weight =
				milestoneData[milestone.milestoneOrder - 1]?.weight || 1;
			totalWeight += weight;
			if (milestone.isCompleted) {
				completedWeight += weight;
			}
		});

		completionPercent =
			totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;
	} else if (component.workflowType === "MILESTONE_PERCENTAGE") {
		// Average the percentages with weights
		let totalWeight = 0;
		let weightedSum = 0;

		component.milestones.forEach((milestone: any) => {
			const weight =
				milestoneData[milestone.milestoneOrder - 1]?.weight || 1;
			totalWeight += weight;
			weightedSum += (milestone.percentageValue || 0) * weight;
		});

		completionPercent = totalWeight > 0 ? weightedSum / totalWeight : 0;
	} else if (component.workflowType === "MILESTONE_QUANTITY") {
		// Calculate based on quantities with weights
		let totalWeight = 0;
		let weightedSum = 0;

		component.milestones.forEach((milestone: any) => {
			const weight =
				milestoneData[milestone.milestoneOrder - 1]?.weight || 1;
			totalWeight += weight;
			if ((milestone as any).quantityTotal && (milestone as any).quantityTotal > 0) {
				const percentage =
					((milestone.quantityValue || 0) /
						(milestone as any).quantityTotal) *
					100;
				weightedSum += percentage * weight;
			}
		});

		completionPercent = totalWeight > 0 ? weightedSum / totalWeight : 0;
	}

	// Ensure completion is between 0 and 100
	completionPercent = Math.min(Math.max(completionPercent, 0), 100);

	// Update component status based on completion
	const status =
		completionPercent === 0
			? "NOT_STARTED"
			: completionPercent < 100
				? "IN_PROGRESS"
				: "COMPLETED";

	await tx.component.update({
		where: { id: componentId },
		data: {
			completionPercent,
			status,
		},
	});
}
