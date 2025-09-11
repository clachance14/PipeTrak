import type { ComponentType } from "@prisma/client";
import type { ComponentStatus, Prisma } from "@repo/database";
import { db as prisma } from "@repo/database";
import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth";

const DrawingCreateSchema = z.object({
	projectId: z.string(),
	number: z.string().min(1),
	title: z.string().min(1),
	revision: z.string().optional(),
	parentId: z.string().optional(),
	filePath: z.string().optional(),
	fileUrl: z.string().url().optional(),
});

const DrawingUpdateSchema = DrawingCreateSchema.partial().omit({
	projectId: true,
	number: true,
});

const ComponentFiltersSchema = z.object({
	status: z.string().optional(),
	type: z.string().optional(),
	area: z.string().optional(),
	system: z.string().optional(),
	search: z.string().optional(),
	page: z.string().optional().default("1"),
	limit: z.string().optional().default("50"),
});

// Helper to verify project access
async function verifyProjectAccess(
	userId: string,
	projectId: string,
): Promise<boolean> {
	const membership = await prisma.member.findFirst({
		where: {
			userId,
			organization: {
				projects: {
					some: { id: projectId },
				},
			},
		},
	});
	return !!membership;
}

// Helper to build component filters
function buildComponentFilters(filters: {
	drawingId: string;
	status?: string[];
	type?: string[];
	area?: string[];
	system?: string[];
	search?: string;
}): Prisma.ComponentWhereInput {
	const where: Prisma.ComponentWhereInput = {
		drawingId: filters.drawingId,
	};

	if (filters.status?.length) {
		where.status = { in: filters.status as ComponentStatus[] };
	}

	if (filters.type?.length) {
		where.type = { in: filters.type as ComponentType[] };
	}

	if (filters.area?.length) {
		where.area = { in: filters.area };
	}

	if (filters.system?.length) {
		where.system = { in: filters.system };
	}

	if (filters.search) {
		where.OR = [
			{ componentId: { contains: filters.search, mode: "insensitive" } },
			{ displayId: { contains: filters.search, mode: "insensitive" } },
			{ description: { contains: filters.search, mode: "insensitive" } },
		];
	}

	return where;
}

export const drawingsRouter = new Hono()
	.use("*", authMiddleware)

	// Get drawings for a project
	.get("/project/:projectId", async (c) => {
		try {
			const projectId = c.req.param("projectId");
			const userId = c.get("user")?.id;

			// Verify user has access
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

			const drawings = await prisma.drawing.findMany({
				where: { projectId },
				include: {
					_count: {
						select: { components: true },
					},
					parent: true,
					children: true,
				},
				orderBy: { number: "asc" },
			});

			return c.json(drawings);
		} catch (error) {
			console.error("Drawings fetch error:", error);
			return c.json(
				{
					code: "INTERNAL_ERROR",
					message: "Failed to fetch drawings",
					details:
						error instanceof Error
							? error.message
							: "Unknown error",
				},
				500,
			);
		}
	})

	// Get drawing hierarchy with component counts
	.get("/project/:projectId/hierarchy", async (c) => {
		try {
			const projectId = c.req.param("projectId");
			const userId = c.get("user")?.id;

			// Verify access
			const hasAccess = await verifyProjectAccess(userId, projectId);
			if (!hasAccess) {
				return c.json(
					{
						code: "ACCESS_DENIED",
						message: "Project not found or access denied",
					},
					403,
				);
			}

			// Get all drawings with component counts
			const drawings = await prisma.drawing.findMany({
				where: { projectId },
				include: {
					_count: {
						select: { components: true },
					},
					components: {
						select: {
							status: true,
						},
					},
				},
				orderBy: { number: "asc" },
			});

			// Build tree structure with component status counts
			const drawingsWithCounts = drawings.map((drawing) => {
				const componentStatusCounts = drawing.components.reduce(
					(acc, comp) => {
						acc[comp.status] = (acc[comp.status] || 0) + 1;
						return acc;
					},
					{} as Record<ComponentStatus, number>,
				);

				return {
					id: drawing.id,
					projectId: drawing.projectId,
					number: drawing.number,
					title: drawing.title,
					revision: drawing.revision,
					parentId: drawing.parentId,
					filePath: drawing.filePath,
					fileUrl: drawing.fileUrl,
					createdAt: drawing.createdAt,
					updatedAt: drawing.updatedAt,
					componentCount: {
						total: drawing._count.components,
						notStarted: componentStatusCounts.NOT_STARTED || 0,
						inProgress: componentStatusCounts.IN_PROGRESS || 0,
						completed: componentStatusCounts.COMPLETED || 0,
						onHold: componentStatusCounts.ON_HOLD || 0,
					},
				};
			});

			// Build parent-child relationships
			const drawingMap = new Map(
				drawingsWithCounts.map((d) => [
					d.id,
					{ ...d, children: [] as any[] },
				]),
			);
			const rootDrawings: any[] = [];

			for (const drawing of drawingsWithCounts) {
				const treeNode = drawingMap.get(drawing.id);
				if (!treeNode) {
					continue;
				}

				if (drawing.parentId) {
					const parent = drawingMap.get(drawing.parentId);
					if (parent) {
						parent.children.push(treeNode);
					}
				} else {
					rootDrawings.push(treeNode);
				}
			}

			return c.json({
				data: rootDrawings,
				metadata: {
					totalDrawings: drawings.length,
					rootDrawings: rootDrawings.length,
				},
			});
		} catch (error) {
			console.error("Drawing hierarchy fetch error:", error);
			return c.json(
				{
					code: "INTERNAL_ERROR",
					message: "Failed to fetch drawing hierarchy",
					details:
						error instanceof Error
							? error.message
							: "Unknown error",
				},
				500,
			);
		}
	})

	// Get drawing details with filtered components
	.get("/:drawingId/details", async (c) => {
		try {
			const drawingId = c.req.param("drawingId");
			const userId = c.get("user")?.id;

			// Parse and validate query parameters
			const query = c.req.query();
			const filters = ComponentFiltersSchema.parse(query);

			// Verify access through drawing -> project -> organization
			const drawing = await prisma.drawing.findFirst({
				where: {
					id: drawingId,
					project: {
						organization: {
							members: { some: { userId } },
						},
					},
				},
				include: {
					project: {
						select: {
							id: true,
							jobName: true,
							jobNumber: true,
							organizationId: true,
						},
					},
					parent: { select: { id: true, number: true, title: true } },
					children: {
						select: {
							id: true,
							number: true,
							title: true,
							_count: { select: { components: true } },
						},
					},
				},
			});

			if (!drawing) {
				return c.json(
					{
						code: "ACCESS_DENIED",
						message: "Drawing not found or access denied",
					},
					403,
				);
			}

			// Build component filters
			const whereClause = buildComponentFilters({
				drawingId,
				status: filters.status?.split(","),
				type: filters.type?.split(","),
				area: filters.area?.split(","),
				system: filters.system?.split(","),
				search: filters.search,
			});

			const page = Number.parseInt(filters.page);
			const limit = Number.parseInt(filters.limit);

			// Get paginated components with counts
			const [components, totalCount] = await Promise.all([
				prisma.component.findMany({
					where: whereClause,
					include: {
						milestones: {
							select: {
								id: true,
								milestoneName: true,
								isCompleted: true,
								weight: true,
							},
						},
						milestoneTemplate: {
							select: { id: true, name: true },
						},
					},
					orderBy: [
						{ componentId: "asc" },
						{ instanceNumber: "asc" },
					],
					skip: (page - 1) * limit,
					take: limit,
				}),
				prisma.component.count({ where: whereClause }),
			]);

			return c.json({
				drawing,
				components,
				pagination: {
					page,
					limit,
					total: totalCount,
					totalPages: Math.ceil(totalCount / limit),
				},
			});
		} catch (error) {
			console.error("Drawing details fetch error:", error);
			return c.json(
				{
					code: "INTERNAL_ERROR",
					message: "Failed to fetch drawing details",
					details:
						error instanceof Error
							? error.message
							: "Unknown error",
				},
				500,
			);
		}
	})

	// Search drawings
	.get("/project/:projectId/search", async (c) => {
		try {
			const projectId = c.req.param("projectId");
			const query = c.req.query("q");
			const limit = Number.parseInt(c.req.query("limit") || "20");
			const userId = c.get("user")?.id;

			if (!query || query.length < 2) {
				return c.json(
					{
						code: "INVALID_INPUT",
						message: "Search query must be at least 2 characters",
					},
					400,
				);
			}

			// Verify access
			const hasAccess = await verifyProjectAccess(userId, projectId);
			if (!hasAccess) {
				return c.json(
					{
						code: "ACCESS_DENIED",
						message: "Project not found or access denied",
					},
					403,
				);
			}

			// Search drawings by number, title, or component content
			const drawings = await prisma.drawing.findMany({
				where: {
					projectId,
					OR: [
						{ number: { contains: query, mode: "insensitive" } },
						{ title: { contains: query, mode: "insensitive" } },
						{
							components: {
								some: {
									OR: [
										{
											componentId: {
												contains: query,
												mode: "insensitive",
											},
										},
										{
											displayId: {
												contains: query,
												mode: "insensitive",
											},
										},
										{
											description: {
												contains: query,
												mode: "insensitive",
											},
										},
									],
								},
							},
						},
					],
				},
				include: {
					_count: { select: { components: true } },
					parent: { select: { id: true, number: true, title: true } },
				},
				take: limit,
				orderBy: { number: "asc" },
			});

			// Build breadcrumb paths for search results
			const resultsWithPaths = await Promise.all(
				drawings.map(async (drawing) => {
					const path: {
						id: string;
						number: string;
						title: string;
					}[] = [];
					let currentDrawing = drawing;

					while (currentDrawing.parent) {
						path.unshift({
							id: currentDrawing.parent.id,
							number: currentDrawing.parent.number,
							title: currentDrawing.parent.title,
						});

						currentDrawing = (await prisma.drawing.findUnique({
							where: { id: currentDrawing.parent.id },
							include: {
								parent: {
									select: {
										id: true,
										number: true,
										title: true,
									},
								},
							},
						})) as any;

						if (!currentDrawing) {
							break;
						}
					}

					return {
						id: drawing.id,
						number: drawing.number,
						title: drawing.title,
						revision: drawing.revision,
						parentId: drawing.parentId,
						componentCount: drawing._count.components,
						breadcrumb: path,
					};
				}),
			);

			return c.json({ results: resultsWithPaths });
		} catch (error) {
			console.error("Drawing search error:", error);
			return c.json(
				{
					code: "INTERNAL_ERROR",
					message: "Drawing search failed",
					details:
						error instanceof Error
							? error.message
							: "Unknown error",
				},
				500,
			);
		}
	})

	// Get single drawing with components
	.get("/:id", async (c) => {
		try {
			const id = c.req.param("id");
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

			const drawing = await prisma.drawing.findFirst({
				where: {
					id,
					project: {
						organization: {
							members: {
								some: { userId },
							},
						},
					},
				},
				include: {
					project: {
						select: { id: true, jobName: true, jobNumber: true },
					},
					parent: {
						select: { id: true, number: true, title: true },
					},
					children: {
						select: {
							id: true,
							number: true,
							title: true,
							_count: { select: { components: true } },
						},
					},
					_count: {
						select: { components: true },
					},
				},
			});

			if (!drawing) {
				return c.json(
					{
						code: "ACCESS_DENIED",
						message: "Drawing not found or access denied",
					},
					403,
				);
			}

			return c.json(drawing);
		} catch (error) {
			console.error("Drawing fetch error:", error);
			return c.json(
				{
					code: "INTERNAL_ERROR",
					message: "Failed to fetch drawing",
					details:
						error instanceof Error
							? error.message
							: "Unknown error",
				},
				500,
			);
		}
	})

	// Get components for a specific drawing
	.get("/:id/components", async (c) => {
		try {
			const drawingId = c.req.param("id");
			const userId = c.get("user")?.id;

			// Parse query parameters
			const filters = ComponentFiltersSchema.parse(c.req.query());

			if (!userId) {
				return c.json(
					{
						code: "UNAUTHENTICATED",
						message: "User not authenticated",
					},
					401,
				);
			}

			// Verify drawing access
			const drawing = await prisma.drawing.findFirst({
				where: {
					id: drawingId,
					project: {
						organization: {
							members: { some: { userId } },
						},
					},
				},
			});

			if (!drawing) {
				return c.json(
					{
						code: "ACCESS_DENIED",
						message: "Drawing not found or access denied",
					},
					403,
				);
			}

			// Build component filters
			const whereClause = buildComponentFilters({
				drawingId,
				status: filters.status?.split(","),
				type: filters.type?.split(","),
				area: filters.area?.split(","),
				system: filters.system?.split(","),
				search: filters.search,
			});

			const page = Number.parseInt(filters.page);
			const limit = Number.parseInt(filters.limit);

			// Get paginated components
			const [components, totalCount] = await Promise.all([
				prisma.component.findMany({
					where: whereClause,
					include: {
						milestones: {
							select: {
								id: true,
								milestoneName: true,
								isCompleted: true,
								weight: true,
								completedAt: true,
								completer: {
									select: {
										id: true,
										name: true,
										email: true,
									},
								},
							},
							orderBy: { milestoneOrder: "asc" },
						},
						milestoneTemplate: {
							select: { id: true, name: true },
						},
						installer: {
							select: { id: true, name: true, email: true },
						},
					},
					orderBy: [
						{ componentId: "asc" },
						{ instanceNumber: "asc" },
					],
					skip: (page - 1) * limit,
					take: limit,
				}),
				prisma.component.count({ where: whereClause }),
			]);

			return c.json({
				data: components,
				pagination: {
					page,
					limit,
					total: totalCount,
					totalPages: Math.ceil(totalCount / limit),
					hasMore: page * limit < totalCount,
				},
				filters: filters,
			});
		} catch (error) {
			if (error instanceof z.ZodError) {
				return c.json(
					{
						code: "INVALID_INPUT",
						message: "Invalid query parameters",
						details: error.errors,
					},
					400,
				);
			}
			console.error("Drawing components fetch error:", error);
			return c.json(
				{
					code: "INTERNAL_ERROR",
					message: "Failed to fetch drawing components",
					details:
						error instanceof Error
							? error.message
							: "Unknown error",
				},
				500,
			);
		}
	})

	// Create drawing
	.post("/", async (c) => {
		try {
			const body = await c.req.json();
			const data = DrawingCreateSchema.parse(body);
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

			// Verify user has admin access
			const project = await prisma.project.findFirst({
				where: {
					id: data.projectId,
					organization: {
						members: {
							some: {
								userId,
								role: { in: ["owner", "admin"] },
							},
						},
					},
				},
			});

			if (!project) {
				return c.json(
					{
						code: "ACCESS_DENIED",
						message:
							"Project not found or insufficient permissions",
					},
					403,
				);
			}

			// Check for duplicate drawing number within project
			const existingDrawing = await prisma.drawing.findFirst({
				where: {
					projectId: data.projectId,
					number: data.number,
				},
			});

			if (existingDrawing) {
				return c.json(
					{
						code: "DUPLICATE_DRAWING_NUMBER",
						message: "Drawing number already exists",
						details: `Drawing number ${data.number} is already in use within this project`,
					},
					409,
				);
			}

			// If parentId is provided, verify it exists and belongs to same project
			if (data.parentId) {
				const parent = await prisma.drawing.findFirst({
					where: {
						id: data.parentId,
						projectId: data.projectId,
					},
				});

				if (!parent) {
					return c.json(
						{
							code: "INVALID_PARENT",
							message:
								"Parent drawing not found or belongs to different project",
						},
						400,
					);
				}
			}

			const drawing = await prisma.drawing.create({
				data,
				include: {
					parent: {
						select: { id: true, number: true, title: true },
					},
					children: {
						select: {
							id: true,
							number: true,
							title: true,
							_count: { select: { components: true } },
						},
					},
					_count: {
						select: { components: true },
					},
				},
			});

			return c.json(drawing, 201);
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
			console.error("Drawing creation error:", error);
			return c.json(
				{
					code: "INTERNAL_ERROR",
					message: "Failed to create drawing",
					details:
						error instanceof Error
							? error.message
							: "Unknown error",
				},
				500,
			);
		}
	})

	// Update drawing
	.patch("/:id", async (c) => {
		try {
			const id = c.req.param("id");
			const body = await c.req.json();
			const updates = DrawingUpdateSchema.parse(body);
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

			// Verify user has admin access and get existing drawing
			const drawing = await prisma.drawing.findFirst({
				where: {
					id,
					project: {
						organization: {
							members: {
								some: {
									userId,
									role: { in: ["owner", "admin"] },
								},
							},
						},
					},
				},
			});

			if (!drawing) {
				return c.json(
					{
						code: "ACCESS_DENIED",
						message:
							"Drawing not found or insufficient permissions",
					},
					403,
				);
			}

			// If updating parentId, verify it's valid
			if (updates.parentId !== undefined) {
				if (updates.parentId === id) {
					return c.json(
						{
							code: "INVALID_PARENT",
							message: "Drawing cannot be its own parent",
						},
						400,
					);
				}

				if (updates.parentId) {
					const parent = await prisma.drawing.findFirst({
						where: {
							id: updates.parentId,
							projectId: drawing.projectId,
						},
					});

					if (!parent) {
						return c.json(
							{
								code: "INVALID_PARENT",
								message:
									"Parent drawing not found or belongs to different project",
							},
							400,
						);
					}

					// Check for circular reference
					const wouldCreateLoop = await checkCircularReference(
						id,
						updates.parentId,
					);
					if (wouldCreateLoop) {
						return c.json(
							{
								code: "CIRCULAR_REFERENCE",
								message:
									"Update would create a circular reference in drawing hierarchy",
							},
							400,
						);
					}
				}
			}

			const updatedDrawing = await prisma.drawing.update({
				where: { id },
				data: updates,
				include: {
					parent: {
						select: { id: true, number: true, title: true },
					},
					children: {
						select: {
							id: true,
							number: true,
							title: true,
							_count: { select: { components: true } },
						},
					},
					_count: {
						select: { components: true },
					},
				},
			});

			return c.json(updatedDrawing);
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
			console.error("Drawing update error:", error);
			return c.json(
				{
					code: "INTERNAL_ERROR",
					message: "Failed to update drawing",
					details:
						error instanceof Error
							? error.message
							: "Unknown error",
				},
				500,
			);
		}
	})

	// Delete drawing
	.delete("/:id", async (c) => {
		try {
			const id = c.req.param("id");
			const userId = c.get("user")?.id;
			const cascade = c.req.query("cascade") === "true";

			if (!userId) {
				return c.json(
					{
						code: "UNAUTHENTICATED",
						message: "User not authenticated",
					},
					401,
				);
			}

			// Verify user has admin access
			const drawing = await prisma.drawing.findFirst({
				where: {
					id,
					project: {
						organization: {
							members: {
								some: {
									userId,
									role: { in: ["owner", "admin"] },
								},
							},
						},
					},
				},
				include: {
					children: {
						select: { id: true, number: true, title: true },
					},
					_count: {
						select: { components: true },
					},
				},
			});

			if (!drawing) {
				return c.json(
					{
						code: "ACCESS_DENIED",
						message:
							"Drawing not found or insufficient permissions",
					},
					403,
				);
			}

			// Check if drawing has child drawings
			if (drawing.children.length > 0 && !cascade) {
				return c.json(
					{
						code: "HAS_CHILDREN",
						message: "Cannot delete drawing with child drawings",
						details: {
							childCount: drawing.children.length,
							children: drawing.children,
							suggestion:
								"Use cascade=true to delete children, or move them to a different parent first",
						},
					},
					400,
				);
			}

			// Check if drawing has components
			if (drawing._count.components > 0) {
				return c.json(
					{
						code: "HAS_COMPONENTS",
						message: "Cannot delete drawing with components",
						details: {
							componentCount: drawing._count.components,
							suggestion:
								"Delete or move components to a different drawing first",
						},
					},
					400,
				);
			}

			// Delete drawing (and children if cascade is true)
			if (cascade && drawing.children.length > 0) {
				// Delete children first (recursive cascade is handled by the database)
				await prisma.drawing.deleteMany({
					where: {
						parentId: id,
					},
				});
			}

			const deletedDrawing = await prisma.drawing.delete({
				where: { id },
			});

			return c.json({
				success: true,
				deleted: deletedDrawing,
				cascaded: cascade && drawing.children.length > 0,
				deletedChildren: cascade ? drawing.children.length : 0,
			});
		} catch (error) {
			console.error("Drawing deletion error:", error);
			return c.json(
				{
					code: "INTERNAL_ERROR",
					message: "Failed to delete drawing",
					details:
						error instanceof Error
							? error.message
							: "Unknown error",
				},
				500,
			);
		}
	})

	// Bulk import drawings
	.post("/bulk-import", async (c) => {
		try {
			const body = await c.req.json();
			const data = z
				.object({
					projectId: z.string(),
					drawings: z.array(
						DrawingCreateSchema.omit({ projectId: true }),
					),
					options: z
						.object({
							validateOnly: z.boolean().optional().default(false),
							skipDuplicates: z
								.boolean()
								.optional()
								.default(false),
							createHierarchy: z
								.boolean()
								.optional()
								.default(true),
						})
						.optional()
						.default({}),
				})
				.parse(body);

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

			// Verify user has admin access
			const project = await prisma.project.findFirst({
				where: {
					id: data.projectId,
					organization: {
						members: {
							some: {
								userId,
								role: { in: ["owner", "admin"] },
							},
						},
					},
				},
			});

			if (!project) {
				return c.json(
					{
						code: "ACCESS_DENIED",
						message:
							"Project not found or insufficient permissions",
					},
					403,
				);
			}

			// Get existing drawing numbers
			const existingDrawings = await prisma.drawing.findMany({
				where: { projectId: data.projectId },
				select: { number: true },
			});
			const existingNumbers = new Set(
				existingDrawings.map((d) => d.number),
			);

			// Validate drawings
			const validationResults = {
				valid: [] as any[],
				invalid: [] as any[],
				duplicates: [] as any[],
			};

			data.drawings.forEach((drawing, index) => {
				const issues = [];

				// Check for duplicates with existing drawings
				if (existingNumbers.has(drawing.number)) {
					if (!data.options.skipDuplicates) {
						issues.push(
							`Drawing number ${drawing.number} already exists in project`,
						);
					} else {
						validationResults.duplicates.push({
							index,
							number: drawing.number,
							action: "skipped",
						});
						return;
					}
				}

				// Check for duplicates within import batch
				const duplicatesInBatch = data.drawings
					.slice(0, index)
					.filter((d) => d.number === drawing.number);
				if (duplicatesInBatch.length > 0) {
					issues.push(
						`Duplicate number ${drawing.number} found within import batch`,
					);
				}

				if (issues.length > 0) {
					validationResults.invalid.push({
						index,
						drawing,
						issues,
					});
				} else {
					validationResults.valid.push({
						index,
						drawing: {
							...drawing,
							projectId: data.projectId,
						},
					});
				}
			});

			// If validation only, return results
			if (data.options.validateOnly) {
				return c.json({
					validation: validationResults,
					summary: {
						total: data.drawings.length,
						valid: validationResults.valid.length,
						invalid: validationResults.invalid.length,
						duplicates: validationResults.duplicates.length,
					},
				});
			}

			// Return error if any invalid drawings found
			if (validationResults.invalid.length > 0) {
				return c.json(
					{
						code: "VALIDATION_FAILED",
						message: "Some drawings failed validation",
						details: validationResults,
					},
					400,
				);
			}

			// Create valid drawings
			const createdDrawings = [];
			for (const item of validationResults.valid) {
				try {
					const drawing = await prisma.drawing.create({
						data: item.drawing,
						include: {
							parent: {
								select: { id: true, number: true, title: true },
							},
							_count: {
								select: { components: true },
							},
						},
					});
					createdDrawings.push(drawing);
				} catch (error) {
					console.error(
						`Failed to create drawing ${item.drawing.number}:`,
						error,
					);
					validationResults.invalid.push({
						index: item.index,
						drawing: item.drawing,
						issues: [
							`Database error: ${error instanceof Error ? error.message : "Unknown error"}`,
						],
					});
				}
			}

			return c.json(
				{
					success: true,
					created: createdDrawings,
					summary: {
						total: data.drawings.length,
						created: createdDrawings.length,
						skipped: validationResults.duplicates.length,
						failed: validationResults.invalid.length,
					},
					validation:
						validationResults.invalid.length > 0
							? validationResults
							: undefined,
				},
				201,
			);
		} catch (error) {
			if (error instanceof z.ZodError) {
				return c.json(
					{
						code: "INVALID_INPUT",
						message: "Invalid input for bulk import",
						details: error.errors,
					},
					400,
				);
			}
			console.error("Bulk drawing import error:", error);
			return c.json(
				{
					code: "INTERNAL_ERROR",
					message: "Failed to import drawings",
					details:
						error instanceof Error
							? error.message
							: "Unknown error",
				},
				500,
			);
		}
	});

// Helper function to check for circular references
async function checkCircularReference(
	drawingId: string,
	proposedParentId: string,
): Promise<boolean> {
	let currentId: string | null = proposedParentId;
	const visited = new Set<string>();

	while (currentId) {
		if (visited.has(currentId) || currentId === drawingId) {
			return true; // Circular reference detected
		}

		visited.add(currentId);

		const parent: { parentId: string | null } | null =
			await prisma.drawing.findUnique({
				where: { id: currentId },
				select: { parentId: true },
			});

		currentId = parent?.parentId || null;
	}

	return false;
}
