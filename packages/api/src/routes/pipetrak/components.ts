import { db as prisma } from "@repo/database";
import { z } from "zod";
import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth";
import {
	WorkflowType,
	ComponentStatus,
} from "@repo/database/prisma/generated/client";
import { broadcastComponentUpdate } from "./realtime";

// Component validation schemas
const ComponentCreateSchema = z.object({
	projectId: z.string(),
	drawingId: z.string().optional(),
	milestoneTemplateId: z.string(),
	componentId: z.string().min(1),
	type: z.string().min(1),
	workflowType: z.nativeEnum(WorkflowType),
	spec: z.string().optional(),
	size: z.string().optional(),
	material: z.string().optional(),
	pressureRating: z.string().optional(),
	description: z.string().optional(),
	area: z.string().optional(),
	system: z.string().optional(),
	testPackage: z.string().optional(),
	testPressure: z.number().optional(),
	testRequired: z.string().optional(),
	totalLength: z.number().optional(),
	lengthUnit: z.string().optional(),
	totalQuantity: z.number().optional(),
	quantityUnit: z.string().optional(),
});

const ComponentUpdateSchema = ComponentCreateSchema.partial().omit({
	projectId: true,
	componentId: true,
});

const ComponentFilterSchema = z.object({
	projectId: z.string().optional(),
	drawingId: z.string().optional(),
	area: z.string().optional(),
	system: z.string().optional(),
	testPackage: z.string().optional(),
	status: z.nativeEnum(ComponentStatus).optional(),
	type: z.string().optional(),
	search: z.string().optional(),
	limit: z.coerce.number().min(1).max(10000).default(100),
	offset: z.coerce.number().min(0).default(0),
	sortBy: z
		.enum([
			"componentId",
			"type",
			"area",
			"system",
			"completionPercent",
			"updatedAt",
		])
		.default("componentId"),
	sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

const BulkUpdateSchema = z.object({
	componentIds: z.array(z.string()),
	updates: ComponentUpdateSchema,
	options: z
		.object({
			validateOnly: z.boolean().optional().default(false),
			atomic: z.boolean().optional().default(true),
		})
		.optional()
		.default({}),
});

export const componentsRouter = new Hono()
	.use("*", authMiddleware)

	// Get components with filtering and pagination
	.get("/", async (c) => {
		try {
			const query = ComponentFilterSchema.parse(c.req.query());
			const { limit, offset, sortBy, sortOrder, search, ...filters } =
				query;

			// Build where clause
			const where: any = {};

			if (filters.projectId) where.projectId = filters.projectId;
			if (filters.drawingId) where.drawingId = filters.drawingId;
			if (filters.area) where.area = filters.area;
			if (filters.system) where.system = filters.system;
			if (filters.testPackage) where.testPackage = filters.testPackage;
			if (filters.status) where.status = filters.status;
			if (filters.type) where.type = filters.type;

			if (search) {
				where.OR = [
					{ componentId: { contains: search, mode: "insensitive" } },
					{ description: { contains: search, mode: "insensitive" } },
					{ spec: { contains: search, mode: "insensitive" } },
				];
			}

			// Get total count
			const total = await prisma.component.count({ where });

			// Get components with milestones
			const components = await prisma.component.findMany({
				where,
				include: {
					drawing: true,
					milestoneTemplate: true,
					milestones: {
						orderBy: { milestoneOrder: "asc" },
					},
					installer: {
						select: { id: true, name: true, email: true },
					},
					fieldWelds: {
						select: {
							id: true,
							weldIdNumber: true,
							dateWelded: true,
							weldSize: true,
							schedule: true,
							ndeResult: true,
							pwhtRequired: true,
							datePwht: true,
							comments: true,
							welder: {
								select: { id: true, stencil: true, name: true },
							},
							weldType: {
								select: { code: true, description: true },
							},
						},
					},
				},
				take: limit,
				skip: offset,
				orderBy: { [sortBy]: sortOrder },
			});

			return c.json({
				data: components,
				pagination: {
					total,
					limit,
					offset,
					hasMore: offset + limit < total,
				},
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
			console.error("Error fetching components:", error);
			return c.json(
				{
					code: "INTERNAL_ERROR",
					message: "Failed to fetch components",
					details:
						error instanceof Error
							? error.message
							: "Unknown error",
				},
				500,
			);
		}
	})

	// Get single component by ID
	.get("/:id", async (c) => {
		try {
			const id = c.req.param("id");

			const component = await prisma.component.findUnique({
				where: { id },
				include: {
					project: true,
					drawing: true,
					milestoneTemplate: true,
					milestones: {
						orderBy: { milestoneOrder: "asc" },
						include: {
							completer: {
								select: { id: true, name: true, email: true },
							},
						},
					},
					installer: {
						select: { id: true, name: true, email: true },
					},
					fieldWelds: {
						select: {
							id: true,
							weldIdNumber: true,
							dateWelded: true,
							weldSize: true,
							schedule: true,
							ndeResult: true,
							pwhtRequired: true,
							datePwht: true,
							comments: true,
							welder: {
								select: { id: true, stencil: true, name: true },
							},
							weldType: {
								select: { code: true, description: true },
							},
						},
					},
					auditLogs: {
						orderBy: { timestamp: "desc" },
						take: 10,
						include: {
							user: {
								select: { id: true, name: true, email: true },
							},
						},
					},
				},
			});

			if (!component) {
				return c.json(
					{
						code: "NOT_FOUND",
						message: "Component not found",
					},
					404,
				);
			}

			// Verify user has access to this component's project
			const userId = c.get("user")?.id;
			const hasAccess = await prisma.member.findFirst({
				where: {
					userId,
					organizationId: component.project.organizationId,
				},
			});

			if (!hasAccess) {
				return c.json(
					{
						code: "ACCESS_DENIED",
						message: "Access denied to this component",
					},
					403,
				);
			}

			return c.json(component);
		} catch (error) {
			console.error("Fetch component error:", error);
			return c.json(
				{
					code: "INTERNAL_ERROR",
					message: "Failed to fetch component",
					details:
						error instanceof Error
							? error.message
							: "Unknown error",
				},
				500,
			);
		}
	})

	// Create new component
	.post("/", async (c) => {
		try {
			const body = await c.req.json();
			const data = ComponentCreateSchema.parse(body);
			const userId = c.get("user")?.id;

			if (!userId) {
				return c.json({ error: "User not authenticated" }, 401);
			}

			// Verify user has access to the project
			const project = await prisma.project.findFirst({
				where: {
					id: data.projectId,
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
						error: "Project not found or user is not a member of the organization",
						details:
							"User must be added to the organization to access this project",
					},
					403,
				);
			}

			// Handle instance tracking for this drawing/component combination
			let instanceNumber = 1;
			let totalInstancesOnDrawing = 1;

			if (data.drawingId) {
				// Find existing instances of this component on the same drawing
				const existingInstances = await prisma.component.findMany({
					where: {
						drawingId: data.drawingId,
						componentId: data.componentId,
						status: { not: "DELETED" },
					},
					orderBy: { instanceNumber: "asc" },
				});

				instanceNumber =
					existingInstances.length > 0
						? Math.max(
								...existingInstances.map(
									(c) => c.instanceNumber,
								),
							) + 1
						: 1;
				totalInstancesOnDrawing = existingInstances.length + 1;

				// Update all existing instances with new total count
				if (existingInstances.length > 0) {
					await prisma.component.updateMany({
						where: {
							drawingId: data.drawingId,
							componentId: data.componentId,
							status: { not: "DELETED" },
						},
						data: { totalInstancesOnDrawing },
					});
				}
			}

			// Generate displayId
			const displayId =
				totalInstancesOnDrawing > 1
					? `${data.componentId} (${instanceNumber} of ${totalInstancesOnDrawing})`
					: data.componentId;

			// Create component
			const component = await prisma.component.create({
				data: {
					...data,
					instanceNumber,
					totalInstancesOnDrawing,
					displayId,
					status: ComponentStatus.NOT_STARTED,
					completionPercent: 0,
				},
				include: {
					milestones: true,
				},
			});

			// Create milestones for the component based on template
			if (data.milestoneTemplateId) {
				const template = await prisma.milestoneTemplate.findUnique({
					where: { id: data.milestoneTemplateId },
				});

				if (template && template.milestones) {
					const milestoneData = template.milestones as any[];
					const milestones = milestoneData.map(
						(milestone, index) => ({
							componentId: component.id,
							milestoneName: milestone.name,
							milestoneOrder: index,
							weight: milestone.weight || 1,
							isCompleted: false,
						}),
					);

					await prisma.componentMilestone.createMany({
						data: milestones,
					});
				}
			}

			// Create audit log
			await prisma.auditLog.create({
				data: {
					projectId: data.projectId,
					userId,
					entityType: "component",
					entityId: component.id,
					action: "CREATE",
					changes: {
						componentId: { old: null, new: component.componentId },
						instanceNumber: { old: null, new: instanceNumber },
						displayId: { old: null, new: displayId },
						status: { old: null, new: component.status },
						type: { old: null, new: component.type },
						workflowType: {
							old: null,
							new: component.workflowType,
						},
					},
				},
			});

			return c.json(component, 201);
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
			console.error("Create component error:", error);
			return c.json(
				{
					code: "INTERNAL_ERROR",
					message: "Failed to create component",
					details:
						error instanceof Error
							? error.message
							: "Unknown error",
				},
				500,
			);
		}
	})

	// Update component
	.patch("/:id", async (c) => {
		try {
			const id = c.req.param("id");
			const body = await c.req.json();
			const updates = ComponentUpdateSchema.parse(body);
			const userId = c.get("user")?.id;

			// Get existing component
			const existing = await prisma.component.findFirst({
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
			});

			if (!existing) {
				return c.json(
					{ error: "Component not found or access denied" },
					403,
				);
			}

			// Update component
			const component = await prisma.component.update({
				where: { id },
				data: {
					...updates,
					updatedAt: new Date(),
				},
				include: {
					milestones: {
						orderBy: { milestoneOrder: "asc" },
					},
					drawing: { select: { number: true, title: true } },
					milestoneTemplate: { select: { name: true } },
				},
			});

			// Recalculate completion percentage if milestone-related fields changed
			if (
				updates.milestoneTemplateId ||
				Object.keys(updates).some((key) => key.includes("milestone"))
			) {
				await recalculateComponentCompletion(id);
			}

			// Broadcast component update to realtime subscribers
			await broadcastComponentUpdate(
				existing.projectId,
				component.id,
				{
					action: "update",
					status: component.status,
					completionPercent: component.completionPercent,
					drawingId: component.drawingId,
					changes: updates,
				},
				userId,
			);

			// Create audit log
			await prisma.auditLog.create({
				data: {
					projectId: existing.projectId,
					userId,
					entityType: "component",
					entityId: component.id,
					action: "UPDATE",
					changes: Object.keys(updates).reduce((acc, key) => {
						acc[key] = {
							old: (existing as any)[key],
							new: (component as any)[key],
						};
						return acc;
					}, {} as any),
				},
			});

			return c.json(component);
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
			console.error("Update component error:", error);
			return c.json(
				{
					code: "INTERNAL_ERROR",
					message: "Failed to update component",
					details:
						error instanceof Error
							? error.message
							: "Unknown error",
				},
				500,
			);
		}
	})

	// Bulk update components
	.post("/bulk-update", async (c) => {
		try {
			const body = await c.req.json();
			const {
				componentIds,
				updates,
				options = {},
			} = BulkUpdateSchema.parse(body);
			const userId = c.get("user")?.id;

			// Verify user has access to all components
			const components = await prisma.component.findMany({
				where: {
					id: { in: componentIds },
					project: {
						organization: {
							members: {
								some: { userId },
							},
						},
					},
				},
			});

			if (components.length !== componentIds.length) {
				return c.json(
					{
						code: "ACCESS_DENIED",
						message: "Some components not found or access denied",
						details: {
							requested: componentIds.length,
							accessible: components.length,
						},
					},
					403,
				);
			}

			// If validation only, return early
			if (options.validateOnly) {
				return c.json({
					valid: components.length,
					invalid: 0,
					components: components.map((c) => ({
						id: c.id,
						componentId: c.componentId,
					})),
				});
			}

			// Update all components in transaction if atomic mode
			let updatedComponents;
			if (options.atomic) {
				const updatePromises = componentIds.map((id) =>
					prisma.component.update({
						where: { id },
						data: updates,
						include: {
							drawing: true,
							milestones: true,
							milestoneTemplate: true,
						},
					}),
				);
				updatedComponents = await prisma.$transaction(updatePromises);
			} else {
				// Non-atomic updates
				updatedComponents = [];
				for (const id of componentIds) {
					try {
						const updated = await prisma.component.update({
							where: { id },
							data: updates,
							include: {
								drawing: true,
								milestones: true,
								milestoneTemplate: true,
							},
						});
						updatedComponents.push(updated);
					} catch (error) {
						console.error(
							`Failed to update component ${id}:`,
							error,
						);
						// Continue with other components in non-atomic mode
					}
				}
			}

			// Create audit logs
			const auditLogs = components.map((existing, index) => ({
				projectId: existing.projectId,
				userId,
				entityType: "component" as const,
				entityId: existing.id,
				action: "UPDATE" as const,
				changes: Object.keys(updates).reduce((acc, key) => {
					acc[key] = {
						old: (existing as any)[key],
						new: (updatedComponents[index] as any)[key],
					};
					return acc;
				}, {} as any),
			}));

			await prisma.auditLog.createMany({ data: auditLogs });

			return c.json({
				successful: updatedComponents.length,
				failed: componentIds.length - updatedComponents.length,
				components: updatedComponents,
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
			console.error("Bulk component update error:", error);
			return c.json(
				{
					code: "INTERNAL_ERROR",
					message: "Failed to update components",
					details:
						error instanceof Error
							? error.message
							: "Unknown error",
				},
				500,
			);
		}
	})

	// Soft delete component (mark as DELETED)
	.delete("/:id", async (c) => {
		try {
			const id = c.req.param("id");
			const userId = c.get("user")?.id;
			const hardDelete = c.req.query("hard") === "true";

			if (!userId) {
				return c.json(
					{
						code: "UNAUTHENTICATED",
						message: "User not authenticated",
					},
					401,
				);
			}

			// Verify user has admin access to the project
			const component = await prisma.component.findFirst({
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

			if (!component) {
				return c.json(
					{
						code: "ACCESS_DENIED",
						message:
							"Component not found or insufficient permissions",
					},
					403,
				);
			}

			let deletedComponent;
			if (hardDelete) {
				// Hard delete (cascades to milestones)
				deletedComponent = await prisma.component.delete({
					where: { id },
				});
			} else {
				// Soft delete - mark as DELETED
				deletedComponent = await prisma.component.update({
					where: { id },
					data: {
						status: "DELETED",
						updatedAt: new Date(),
					},
				});
			}

			// Create audit log
			await prisma.auditLog.create({
				data: {
					projectId: component.projectId,
					userId,
					entityType: "component",
					entityId: id,
					action: hardDelete ? "HARD_DELETE" : "SOFT_DELETE",
					changes: hardDelete
						? Object.keys(component).reduce((acc, key) => {
								if (
									key !== "id" &&
									key !== "createdAt" &&
									key !== "updatedAt"
								) {
									acc[key] = {
										old: (component as any)[key],
										new: null,
									};
								}
								return acc;
							}, {} as any)
						: { status: { old: component.status, new: "DELETED" } },
				},
			});

			return c.json({
				success: true,
				deleted: hardDelete ? "permanently" : "soft",
				component: deletedComponent,
			});
		} catch (error) {
			console.error("Delete component error:", error);
			return c.json(
				{
					code: "INTERNAL_ERROR",
					message: "Failed to delete component",
					details:
						error instanceof Error
							? error.message
							: "Unknown error",
				},
				500,
			);
		}
	})

	// Component search with advanced filters
	.post("/search", async (c) => {
		try {
			const body = await c.req.json();
			const filters = z
				.object({
					projectId: z.string(),
					search: z.string().optional(),
					areas: z.array(z.string()).optional(),
					systems: z.array(z.string()).optional(),
					testPackages: z.array(z.string()).optional(),
					statuses: z.array(z.nativeEnum(ComponentStatus)).optional(),
					types: z.array(z.string()).optional(),
					completionRange: z
						.object({
							min: z.number().min(0).max(100),
							max: z.number().min(0).max(100),
						})
						.optional(),
					dateRange: z
						.object({
							start: z.string().datetime(),
							end: z.string().datetime(),
						})
						.optional(),
					limit: z.number().min(1).max(1000).default(100),
					offset: z.number().min(0).default(0),
					sortBy: z
						.enum([
							"componentId",
							"type",
							"area",
							"system",
							"completionPercent",
							"updatedAt",
						])
						.default("componentId"),
					sortOrder: z.enum(["asc", "desc"]).default("asc"),
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

			// Verify project access
			const project = await prisma.project.findFirst({
				where: {
					id: filters.projectId,
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

			// Build advanced where clause
			const where: any = {
				projectId: filters.projectId,
				status: { not: "DELETED" }, // Exclude soft-deleted components
			};

			if (filters.search) {
				where.OR = [
					{
						componentId: {
							contains: filters.search,
							mode: "insensitive",
						},
					},
					{
						description: {
							contains: filters.search,
							mode: "insensitive",
						},
					},
					{ spec: { contains: filters.search, mode: "insensitive" } },
				];
			}

			if (filters.areas?.length) where.area = { in: filters.areas };
			if (filters.systems?.length) where.system = { in: filters.systems };
			if (filters.testPackages?.length)
				where.testPackage = { in: filters.testPackages };
			if (filters.statuses?.length)
				where.status = { in: filters.statuses };
			if (filters.types?.length) where.type = { in: filters.types };

			if (filters.completionRange) {
				where.completionPercent = {
					gte: filters.completionRange.min,
					lte: filters.completionRange.max,
				};
			}

			if (filters.dateRange) {
				where.updatedAt = {
					gte: new Date(filters.dateRange.start),
					lte: new Date(filters.dateRange.end),
				};
			}

			const [total, components] = await prisma.$transaction([
				prisma.component.count({ where }),
				prisma.component.findMany({
					where,
					include: {
						drawing: { select: { number: true, title: true } },
						milestoneTemplate: { select: { name: true } },
						milestones: {
							select: {
								milestoneName: true,
								isCompleted: true,
								completedAt: true,
							},
							orderBy: { milestoneOrder: "asc" },
						},
					},
					take: filters.limit,
					skip: filters.offset,
					orderBy: { [filters.sortBy]: filters.sortOrder },
				}),
			]);

			return c.json({
				data: components,
				pagination: {
					total,
					limit: filters.limit,
					offset: filters.offset,
					hasMore: filters.offset + filters.limit < total,
				},
				filters: filters, // Echo back the applied filters
			});
		} catch (error) {
			if (error instanceof z.ZodError) {
				return c.json(
					{
						code: "INVALID_INPUT",
						message: "Invalid search filters",
						details: error.errors,
					},
					400,
				);
			}
			console.error("Component search error:", error);
			return c.json(
				{
					code: "INTERNAL_ERROR",
					message: "Failed to search components",
				},
				500,
			);
		}
	})

	// Get component statistics
	.get("/stats/:projectId", async (c) => {
		try {
			const projectId = c.req.param("projectId");
			const userId = c.get("user")?.id;

			if (!userId) {
				return c.json({ error: "User not authenticated" }, 401);
			}

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
						error: "Project not found or user is not a member of the organization",
						details:
							"User must be added to the organization to access this project",
					},
					403,
				);
			}

			// Get statistics
			const stats = await prisma.component.groupBy({
				by: ["status"],
				where: { projectId },
				_count: true,
			});

			const areaStats = await prisma.component.groupBy({
				by: ["area"],
				where: { projectId, area: { not: null } },
				_count: true,
				_avg: { completionPercent: true },
			});

			const systemStats = await prisma.component.groupBy({
				by: ["system"],
				where: { projectId, system: { not: null } },
				_count: true,
				_avg: { completionPercent: true },
			});

			const overall = await prisma.component.aggregate({
				where: { projectId },
				_count: true,
				_avg: { completionPercent: true },
			});

			return c.json({
				overall: {
					total: overall._count,
					averageCompletion: overall._avg.completionPercent || 0,
				},
				byStatus: stats,
				byArea: areaStats,
				bySystem: systemStats,
			});
		} catch (error) {
			console.error("Component statistics error:", error);
			return c.json(
				{
					code: "INTERNAL_ERROR",
					message: "Failed to fetch statistics",
					details:
						error instanceof Error
							? error.message
							: "Unknown error",
				},
				500,
			);
		}
	})

	// Bulk import components
	.post("/bulk-import", async (c) => {
		try {
			const body = await c.req.json();
			const {
				projectId,
				components,
				mappings,
				options = {},
			} = z
				.object({
					projectId: z.string(),
					components: z.array(z.record(z.any())),
					mappings: z.record(z.string()).optional(),
					options: z
						.object({
							validateOnly: z.boolean().optional(),
							skipDuplicates: z.boolean().optional(),
							updateExisting: z.boolean().optional(),
							generateIds: z.boolean().optional().default(true),
							rollbackOnError: z
								.boolean()
								.optional()
								.default(false),
						})
						.optional(),
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

			// Verify user has admin access to the project
			const project = await prisma.project.findFirst({
				where: {
					id: projectId,
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

			// Get existing drawings for validation
			const existingDrawings = new Set(
				(
					await prisma.drawing.findMany({
						where: { projectId },
						select: { id: true },
					})
				).map((d) => d.id),
			);

			// Apply column mappings if provided
			let mappedComponents = components;
			if (mappings) {
				mappedComponents = components.map((row) => {
					const mapped: any = {};
					Object.entries(mappings).forEach(([field, column]) => {
						if (column && row[column] !== undefined) {
							mapped[field] = row[column];
						}
					});
					return mapped;
				});
			}

			// Auto-generate component IDs if needed
			if (options.generateIds) {
				const { generateBatchComponentIds } = await import(
					"../../lib/component-id-generator"
				);
				const componentData = mappedComponents.map((c) => ({
					type: c.componentType || c.type,
					description: c.description,
					componentId: c.commodityCode || c.componentId, // Use commodity code as componentId
				}));

				const generatedIds = generateBatchComponentIds(componentData);
				mappedComponents = mappedComponents.map((comp, idx) => {
					const generated = generatedIds.find(
						(g) => g.originalIndex === idx,
					);
					if (generated?.generated) {
						return { ...comp, componentId: generated.componentId };
					}
					return comp;
				});
			}

			// Validation phase
			const errors: any[] = [];
			const validComponents: any[] = [];

			mappedComponents.forEach((comp, index) => {
				const rowErrors: string[] = [];

				// Required field validation
				if (!comp.drawingId) {
					rowErrors.push("Drawing ID is required");
				} else if (!existingDrawings.has(comp.drawingId)) {
					rowErrors.push(`Drawing ${comp.drawingId} not found`);
				}

				if (!comp.componentId) {
					rowErrors.push(
						"Component ID is required (could not auto-generate)",
					);
				}

				if (rowErrors.length > 0) {
					errors.push({
						row: index + 1,
						componentId: comp.componentId || "UNKNOWN",
						errors: rowErrors,
					});
				} else {
					validComponents.push({
						...comp,
						projectId,
						status: comp.status || "NOT_STARTED",
						completionPercent: comp.completionPercent || 0,
					});
				}
			});

			// If validation only, return results
			if (options.validateOnly) {
				return c.json({
					valid: validComponents.length,
					invalid: errors.length,
					errors,
					preview: validComponents.slice(0, 10),
				});
			}

			// If there are errors and rollbackOnError is true, stop
			if (errors.length > 0 && options.rollbackOnError) {
				return c.json(
					{
						code: "VALIDATION_ERROR",
						message: "Validation failed",
						errors,
					},
					400,
				);
			}

			// Process import
			let successCount = 0;
			let skipCount = 0;
			let updateCount = 0;
			const importErrors: any[] = [];

			// Group components by drawing for instance tracking
			const componentsByDrawing = new Map<string, any[]>();
			validComponents.forEach((comp) => {
				const drawingId = comp.drawingId;
				if (!componentsByDrawing.has(drawingId)) {
					componentsByDrawing.set(drawingId, []);
				}
				componentsByDrawing.get(drawingId)!.push(comp);
			});

			// Process each drawing's components
			for (const [drawingId, drawingComponents] of componentsByDrawing) {
				// Get existing components for this drawing
				const existingComponentsInDrawing =
					await prisma.component.findMany({
						where: { projectId, drawingId },
						select: { componentId: true, instanceNumber: true },
					});

				// Track instance numbers per component ID
				const instanceTracker = new Map<string, number>();
				existingComponentsInDrawing.forEach((c) => {
					const current = instanceTracker.get(c.componentId) || 0;
					instanceTracker.set(
						c.componentId,
						Math.max(current, c.instanceNumber),
					);
				});

				// Process components for this drawing
				for (const comp of drawingComponents) {
					try {
						// Check if component exists
						const existingComponent =
							await prisma.component.findFirst({
								where: {
									projectId,
									componentId: comp.componentId,
									drawingId: comp.drawingId,
								},
							});

						if (existingComponent && options.skipDuplicates) {
							skipCount++;
							continue;
						}

						// Calculate instance number
						const currentInstance =
							instanceTracker.get(comp.componentId) || 0;
						const instanceNumber = currentInstance + 1;
						instanceTracker.set(comp.componentId, instanceNumber);

						// Calculate total instances (if multiple in same import)
						const totalInstances =
							drawingComponents.filter(
								(c) => c.componentId === comp.componentId,
							).length + currentInstance;

						// Generate display ID
						const displayId =
							totalInstances > 1
								? `${comp.componentId} (${instanceNumber} of ${totalInstances})`
								: comp.componentId;

						const componentData = {
							...comp,
							instanceNumber,
							totalInstancesOnDrawing: totalInstances,
							displayId,
						};

						if (existingComponent && options.updateExisting) {
							// Update existing component
							await prisma.component.update({
								where: { id: existingComponent.id },
								data: componentData,
							});
							updateCount++;
						} else if (!existingComponent) {
							// Create new component
							await prisma.component.create({
								data: componentData,
							});
							successCount++;
						}
					} catch (error: any) {
						importErrors.push({
							componentId: comp.componentId,
							error: error.message,
						});
					}
				}
			}

			// Create audit log for bulk import
			await prisma.auditLog.create({
				data: {
					projectId,
					userId,
					entityType: "bulk_import",
					entityId: projectId,
					action: "IMPORT",
					changes: {
						totalRows: mappedComponents.length,
						successful: successCount,
						updated: updateCount,
						skipped: skipCount,
						errors: importErrors.length,
					},
				},
			});

			return c.json({
				success: true,
				summary: {
					total: mappedComponents.length,
					created: successCount,
					updated: updateCount,
					skipped: skipCount,
					errors: importErrors.length,
				},
				errors: importErrors,
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
			console.error("Bulk import error:", error);
			return c.json(
				{
					code: "INTERNAL_ERROR",
					message: "Failed to import components",
					details:
						error instanceof Error
							? error.message
							: "Unknown error",
				},
				500,
			);
		}
	})

	// Recalculate component completion percentages
	.post("/recalculate/:componentId", async (c) => {
		try {
			const componentId = c.req.param("componentId");
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
				include: {
					milestones: true,
					milestoneTemplate: true,
				},
			});

			if (!component) {
				return c.json(
					{
						code: "ACCESS_DENIED",
						message: "Component not found or access denied",
					},
					403,
				);
			}

			// Recalculate completion percentage
			const oldCompletion = component.completionPercent;
			await recalculateComponentCompletion(componentId);

			// Get updated component
			const updatedComponent = await prisma.component.findUnique({
				where: { id: componentId },
				include: {
					milestones: {
						orderBy: { milestoneOrder: "asc" },
					},
				},
			});

			return c.json({
				success: true,
				componentId,
				completion: {
					old: oldCompletion,
					new: updatedComponent?.completionPercent || 0,
					changed:
						Math.abs(
							(updatedComponent?.completionPercent || 0) -
								oldCompletion,
						) > 0.01,
				},
				component: updatedComponent,
			});
		} catch (error) {
			console.error("Recalculate completion error:", error);
			return c.json(
				{
					code: "INTERNAL_ERROR",
					message: "Failed to recalculate completion",
					details:
						error instanceof Error
							? error.message
							: "Unknown error",
				},
				500,
			);
		}
	});

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

		component.milestones.forEach((milestone) => {
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

		component.milestones.forEach((milestone) => {
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

		component.milestones.forEach((milestone) => {
			const weight =
				milestoneData[milestone.milestoneOrder - 1]?.weight || 1;
			totalWeight += weight;
			if (
				milestone.quantityValue &&
				component.totalQuantity &&
				component.totalQuantity > 0
			) {
				const percentage =
					(milestone.quantityValue / component.totalQuantity) * 100;
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
