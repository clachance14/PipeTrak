import { db } from "@repo/database";
import { Hono } from "hono";
import { validator } from "hono/validator";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth";

const fieldWeldCreateSchema = z.object({
	projectId: z.string(),
	weldIdNumber: z.string().min(1, "Weld ID is required"),
	welderId: z.string().optional(),
	dateWelded: z.string().transform((val) => new Date(val)),
	drawingId: z.string(),
	tieInNumber: z.string().optional(),
	xrayPercent: z.number().int().min(0).max(100).optional(),
	weldSize: z.string().min(1, "Weld size is required"),
	schedule: z.string().min(1, "Schedule is required"),
	weldTypeCode: z.string().min(1, "Weld type is required"),
	baseMetal: z.string().optional(),
	pwhtRequired: z.boolean().default(false),
	datePwht: z
		.string()
		.transform((val) => new Date(val))
		.optional(),
	ndeTypes: z.array(z.string()).default([]),
	ndeResult: z.enum(["Accept", "Reject", "Repair", "Pending"]).optional(),
	ndeDate: z
		.string()
		.transform((val) => new Date(val))
		.optional(),
	turnoverDate: z
		.string()
		.transform((val) => new Date(val))
		.optional(),
	comments: z.string().max(1000).optional(),
});

const fieldWeldUpdateSchema = fieldWeldCreateSchema
	.omit({ projectId: true, weldIdNumber: true })
	.partial();

const fieldWeldQuerySchema = z.object({
	projectId: z.string(),
	packageNumber: z.string().optional(),
	welderId: z.string().optional(),
	ndeResult: z.string().optional(),
	pwhtRequired: z.boolean().optional(),
	drawingId: z.string().optional(),
	search: z.string().optional(),
	page: z
		.string()
		.transform((val) => Number.parseInt(val, 10))
		.default("1"),
	limit: z
		.string()
		.transform((val) => Number.parseInt(val, 10))
		.default("50"),
});

export const fieldWeldsRouter = new Hono()
	.use("*", authMiddleware)

	// GET /field-welds - List field welds with filtering and pagination
	.get(
		"/",
		validator("query", (value) => fieldWeldQuerySchema.parse(value)),
		async (c) => {
			const query = c.req.valid("query");
			const {
				projectId,
				packageNumber,
				welderId,
				ndeResult,
				pwhtRequired,
				drawingId,
				search,
				page,
				limit,
			} = query;

			const pageNum = Number(page);
			const limitNum = Number(limit);

			try {
				const where: any = {
					projectId,
					// Only show field welds where work has started (component has progress)
					component: {
						completionPercent: {
							gt: 0,
						},
					},
				};

				// Apply filters
				if (packageNumber) {
					where.packageNumber = packageNumber;
				}

				if (welderId) {
					where.welderId = welderId;
				}

				if (ndeResult) {
					where.ndeResult = ndeResult;
				}

				if (pwhtRequired !== undefined) {
					where.pwhtRequired = pwhtRequired;
				}

				if (drawingId) {
					where.drawingId = drawingId;
				}

				// Search across weld ID and comments
				if (search) {
					where.OR = [
						{
							weldIdNumber: {
								contains: search,
								mode: "insensitive",
							},
						},
						{ comments: { contains: search, mode: "insensitive" } },
					];
				}

				const skip = (pageNum - 1) * limitNum;

				const [fieldWelds, totalCount] = await Promise.all([
					db.fieldWeld.findMany({
						where,
						include: {
							welder: {
								select: {
									id: true,
									stencil: true,
									name: true,
								},
							},
							drawing: {
								select: {
									id: true,
									number: true,
									title: true,
								},
							},
							weldType: {
								select: {
									code: true,
									description: true,
								},
							},
							component: {
								select: {
									id: true,
									componentId: true,
									displayId: true,
									area: true,
									system: true,
									testPackage: true,
									status: true,
									completionPercent: true,
									milestones: {
										select: {
											id: true,
											milestoneName: true,
											isCompleted: true,
											completedAt: true,
											milestoneOrder: true,
											weight: true,
										},
										orderBy: {
											milestoneOrder: "asc",
										},
									},
								},
							},
						},
						orderBy: [
							{ dateWelded: "desc" },
							{ weldIdNumber: "asc" },
						],
						skip,
						take: limitNum,
					}),

					db.fieldWeld.count({ where }),
				]);

				const totalPages = Math.ceil(totalCount / limitNum);

				return c.json({
					fieldWelds,
					pagination: {
						page: pageNum,
						limit: limitNum,
						totalCount,
						totalPages,
						hasNextPage: pageNum < totalPages,
						hasPreviousPage: pageNum > 1,
					},
				});
			} catch (error: any) {
				console.error("Error fetching field welds:", error);
				return c.json({ error: "Failed to fetch field welds" }, 500);
			}
		},
	)

	// POST /field-welds - Create a new field weld
	.post(
		"/",
		validator("json", (value) => fieldWeldCreateSchema.parse(value)),
		async (c) => {
			const data = c.req.valid("json");

			try {
				// Check if weld ID already exists for this project
				const existingWeld = await db.fieldWeld.findFirst({
					where: {
						projectId: data.projectId,
						weldIdNumber: data.weldIdNumber,
					},
				});

				if (existingWeld) {
					return c.json(
						{
							error: "A field weld with this ID already exists in this project",
						},
						400,
					);
				}

				// Verify project exists
				const project = await db.project.findUnique({
					where: { id: data.projectId },
				});

				if (!project) {
					return c.json({ error: "Project not found" }, 404);
				}

				// Verify drawing exists and get inherited fields
				const drawing = await db.drawing.findUnique({
					where: { id: data.drawingId },
				});

				if (!drawing) {
					return c.json({ error: "Drawing not found" }, 404);
				}

				// Verify welder exists if provided
				if (data.welderId) {
					const welder = await db.welder.findFirst({
						where: {
							id: data.welderId,
							projectId: data.projectId,
							active: true,
						},
					});

					if (!welder) {
						return c.json(
							{ error: "Welder not found or inactive" },
							404,
						);
					}
				}

				// Verify weld type exists
				const weldType = await db.weldType.findUnique({
					where: { code: data.weldTypeCode },
				});

				if (!weldType) {
					return c.json({ error: "Invalid weld type" }, 400);
				}

				// Set default values for field weld records
				const packageNumber = "TBD";
				const testPressure = {};
				const specCode = "TBD";

				// Find default milestone template for FIELD_WELD
				const milestoneTemplate = await db.milestoneTemplate.findFirst({
					where: {
						projectId: data.projectId,
						name: { contains: "Weld", mode: "insensitive" },
					},
				});

				if (!milestoneTemplate) {
					return c.json(
						{
							error: "No milestone template found for FIELD_WELD components",
						},
						400,
					);
				}

				// Create both Component and FieldWeld records in a transaction
				const result = await db.$transaction(async (tx) => {
					// Create Component record
					await tx.component.create({
						data: {
							projectId: data.projectId,
							drawingId: data.drawingId,
							milestoneTemplateId: milestoneTemplate.id,
							componentId: data.weldIdNumber, // Use weldId as componentId
							weldId: data.weldIdNumber, // Set weldId for linking
							type: "FIELD_WELD",
							workflowType: "MILESTONE_DISCRETE",
							area: "",
							system: "",
							testPackage: packageNumber,
							displayId: data.weldIdNumber,
						},
					});

					// Create FieldWeld record
					const fieldWeld = await tx.fieldWeld.create({
						data: {
							...data,
							packageNumber,
							testPressure,
							specCode,
						},
						include: {
							welder: {
								select: {
									id: true,
									stencil: true,
									name: true,
								},
							},
							drawing: {
								select: {
									id: true,
									number: true,
									title: true,
								},
							},
							weldType: {
								select: {
									code: true,
									description: true,
								},
							},
							component: {
								select: {
									id: true,
									componentId: true,
									displayId: true,
									area: true,
									system: true,
									testPackage: true,
									status: true,
									completionPercent: true,
								},
							},
						},
					});

					return fieldWeld;
				});

				return c.json({ fieldWeld: result }, 201);
			} catch (error: any) {
				console.error("Error creating field weld:", error);
				return c.json({ error: "Failed to create field weld" }, 500);
			}
		},
	)

	// GET /field-welds/:id - Get a specific field weld
	.get("/:id", async (c) => {
		const id = c.req.param("id");

		try {
			const fieldWeld = await db.fieldWeld.findUnique({
				where: { id },
				include: {
					welder: {
						select: {
							id: true,
							stencil: true,
							name: true,
						},
					},
					drawing: {
						select: {
							id: true,
							number: true,
							title: true,
						},
					},
					weldType: {
						select: {
							code: true,
							description: true,
						},
					},
					project: {
						select: {
							id: true,
							jobName: true,
							jobNumber: true,
						},
					},
					component: {
						select: {
							id: true,
							componentId: true,
							displayId: true,
							area: true,
							system: true,
							testPackage: true,
							status: true,
							completionPercent: true,
						},
					},
				},
			});

			if (!fieldWeld) {
				return c.json({ error: "Field weld not found" }, 404);
			}

			return c.json({ fieldWeld });
		} catch (error: any) {
			console.error("Error fetching field weld:", error);
			return c.json({ error: "Failed to fetch field weld" }, 500);
		}
	})

	// PUT /field-welds/:id - Update a field weld
	.put(
		"/:id",
		validator("json", (value) => fieldWeldUpdateSchema.parse(value)),
		async (c) => {
			const id = c.req.param("id");
			const updates = c.req.valid("json");

			try {
				// Check if field weld exists
				const existingWeld = await db.fieldWeld.findUnique({
					where: { id },
				});

				if (!existingWeld) {
					return c.json({ error: "Field weld not found" }, 404);
				}

				// Verify welder exists if being updated
				if (updates.welderId) {
					const welder = await db.welder.findFirst({
						where: {
							id: updates.welderId,
							projectId: existingWeld.projectId,
							active: true,
						},
					});

					if (!welder) {
						return c.json(
							{ error: "Welder not found or inactive" },
							404,
						);
					}
				}

				// Verify weld type exists if being updated
				if (updates.weldTypeCode) {
					const weldType = await db.weldType.findUnique({
						where: { code: updates.weldTypeCode },
					});

					if (!weldType) {
						return c.json({ error: "Invalid weld type" }, 400);
					}
				}

				const fieldWeld = await db.fieldWeld.update({
					where: { id },
					data: updates,
					include: {
						welder: {
							select: {
								id: true,
								stencil: true,
								name: true,
							},
						},
						drawing: {
							select: {
								id: true,
								number: true,
								title: true,
							},
						},
						weldType: {
							select: {
								code: true,
								description: true,
							},
						},
					},
				});

				return c.json({ fieldWeld });
			} catch (error: any) {
				console.error("Error updating field weld:", error);
				return c.json({ error: "Failed to update field weld" }, 500);
			}
		},
	)

	// DELETE /field-welds/:id - Delete a field weld
	.delete("/:id", async (c) => {
		const id = c.req.param("id");

		try {
			// Check if field weld exists
			const existingWeld = await db.fieldWeld.findUnique({
				where: { id },
			});

			if (!existingWeld) {
				return c.json({ error: "Field weld not found" }, 404);
			}

			await db.fieldWeld.delete({
				where: { id },
			});

			return c.json({ message: "Field weld deleted successfully" });
		} catch (error: any) {
			console.error("Error deleting field weld:", error);
			return c.json({ error: "Failed to delete field weld" }, 500);
		}
	})

	// PUT /field-welds/bulk - Bulk update field welds
	.put(
		"/bulk",
		validator("json", (value) =>
			z
				.object({
					ids: z.array(z.string()),
					updates: fieldWeldUpdateSchema,
				})
				.parse(value),
		),
		async (c) => {
			const { ids, updates } = c.req.valid("json");

			try {
				// Verify all field welds exist
				const existingWelds = await db.fieldWeld.findMany({
					where: {
						id: { in: ids },
					},
				});

				if (existingWelds.length !== ids.length) {
					return c.json({ error: "Some field welds not found" }, 404);
				}

				// Perform bulk update
				const result = await db.fieldWeld.updateMany({
					where: {
						id: { in: ids },
					},
					data: updates,
				});

				return c.json({
					message: `Successfully updated ${result.count} field welds`,
					updatedCount: result.count,
				});
			} catch (error: any) {
				console.error("Error bulk updating field welds:", error);
				return c.json(
					{ error: "Failed to bulk update field welds" },
					500,
				);
			}
		},
	)

	// GET /field-welds/stats/:projectId - Get field weld statistics for a project
	.get("/stats/:projectId", async (c) => {
		const projectId = c.req.param("projectId");

		try {
			const [
				totalWelds,
				acceptedWelds,
				rejectedWelds,
				pendingWelds,
				pwhtRequiredWelds,
				pwhtCompleteWelds,
				readyForTurnover,
			] = await Promise.all([
				// Total field welds
				db.fieldWeld.count({
					where: { projectId },
				}),

				// Accepted welds
				db.fieldWeld.count({
					where: {
						projectId,
						ndeResult: "Accept",
					},
				}),

				// Rejected welds
				db.fieldWeld.count({
					where: {
						projectId,
						ndeResult: "Reject",
					},
				}),

				// Pending NDE
				db.fieldWeld.count({
					where: {
						projectId,
						OR: [{ ndeResult: "Pending" }, { ndeResult: null }],
					},
				}),

				// PWHT required
				db.fieldWeld.count({
					where: {
						projectId,
						pwhtRequired: true,
					},
				}),

				// PWHT complete
				db.fieldWeld.count({
					where: {
						projectId,
						pwhtRequired: true,
						datePwht: { not: null },
					},
				}),

				// Ready for turnover (NDE accepted and PWHT complete if required)
				db.fieldWeld.count({
					where: {
						projectId,
						ndeResult: "Accept",
						OR: [
							{ pwhtRequired: false },
							{
								AND: [
									{ pwhtRequired: true },
									{ datePwht: { not: null } },
								],
							},
						],
					},
				}),
			]);

			const acceptanceRate =
				acceptedWelds + rejectedWelds > 0
					? Math.round(
							(acceptedWelds / (acceptedWelds + rejectedWelds)) *
								100,
						)
					: 0;

			const pwhtCompletionRate =
				pwhtRequiredWelds > 0
					? Math.round((pwhtCompleteWelds / pwhtRequiredWelds) * 100)
					: 0;

			return c.json({
				stats: {
					totalWelds,
					acceptedWelds,
					rejectedWelds,
					pendingWelds,
					pwhtRequiredWelds,
					pwhtCompleteWelds,
					readyForTurnover,
					acceptanceRate,
					pwhtCompletionRate,
				},
			});
		} catch (error: any) {
			console.error("Error fetching field weld stats:", error);
			return c.json(
				{ error: "Failed to fetch field weld statistics" },
				500,
			);
		}
	});
