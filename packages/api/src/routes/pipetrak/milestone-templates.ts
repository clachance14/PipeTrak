import { db as prisma } from "@repo/database";
import { z } from "zod";
import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth";

const MilestoneTemplateCreateSchema = z.object({
	projectId: z.string(),
	name: z.string().min(1).max(100),
	description: z.string().optional(),
	milestones: z.array(
		z.object({
			name: z.string().min(1).max(50),
			weight: z.number().min(0).max(100),
			order: z.number().int().min(0),
		}),
	),
	isDefault: z.boolean().default(false),
});

const MilestoneTemplateUpdateSchema =
	MilestoneTemplateCreateSchema.partial().omit({
		projectId: true,
	});

const ApplyTemplateSchema = z.object({
	componentIds: z.array(z.string()).min(1),
	options: z
		.object({
			replaceExisting: z.boolean().optional().default(false),
			preserveCompleted: z.boolean().optional().default(true),
		})
		.optional()
		.default({}),
});

export const milestoneTemplatesRouter = new Hono()
	.use("*", authMiddleware)

	// Get milestone templates for organization (all projects)
	.get("/", async (c) => {
		try {
			const organizationId = c.req.query("organizationId");
			const projectId = c.req.query("projectId");
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

			// Build where clause based on query parameters
			let whereClause: any = {};

			if (projectId) {
				// Get templates for specific project
				whereClause = {
					projectId,
					project: {
						organization: {
							members: {
								some: { userId },
							},
						},
					},
				};
			} else if (organizationId) {
				// Get templates for all projects in organization
				whereClause = {
					project: {
						organizationId,
						organization: {
							members: {
								some: { userId },
							},
						},
					},
				};
			} else {
				// Get templates for all projects user has access to
				whereClause = {
					project: {
						organization: {
							members: {
								some: { userId },
							},
						},
					},
				};
			}

			const templates = await prisma.milestoneTemplate.findMany({
				where: whereClause,
				include: {
					project: {
						select: {
							id: true,
							jobName: true,
							jobNumber: true,
							organizationId: true,
							organization: {
								select: { id: true, name: true, slug: true },
							},
						},
					},
					_count: {
						select: { components: true },
					},
				},
				orderBy: [
					{ project: { jobNumber: "asc" } },
					{ isDefault: "desc" },
					{ name: "asc" },
				],
			});

			return c.json(templates);
		} catch (error) {
			console.error("Milestone templates fetch error:", error);
			return c.json(
				{
					code: "INTERNAL_ERROR",
					message: "Failed to fetch milestone templates",
					details:
						error instanceof Error
							? error.message
							: "Unknown error",
				},
				500,
			);
		}
	})

	// Get milestone templates for a specific project
	.get("/project/:projectId", async (c) => {
		try {
			const projectId = c.req.param("projectId");
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

			const templates = await prisma.milestoneTemplate.findMany({
				where: { projectId },
				include: {
					_count: {
						select: { components: true },
					},
				},
				orderBy: [{ isDefault: "desc" }, { name: "asc" }],
			});

			return c.json(templates);
		} catch (error) {
			console.error("Project milestone templates fetch error:", error);
			return c.json(
				{
					code: "INTERNAL_ERROR",
					message: "Failed to fetch milestone templates",
					details:
						error instanceof Error
							? error.message
							: "Unknown error",
				},
				500,
			);
		}
	})

	// Get single milestone template
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

			const template = await prisma.milestoneTemplate.findFirst({
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
						select: {
							id: true,
							jobName: true,
							jobNumber: true,
							organization: {
								select: { id: true, name: true, slug: true },
							},
						},
					},
					components: {
						select: {
							id: true,
							componentId: true,
							displayId: true,
							type: true,
							status: true,
							completionPercent: true,
						},
						take: 10, // Limit to first 10 components for performance
					},
					_count: {
						select: { components: true },
					},
				},
			});

			if (!template) {
				return c.json(
					{
						code: "NOT_FOUND",
						message: "Milestone template not found",
					},
					404,
				);
			}

			return c.json(template);
		} catch (error) {
			console.error("Milestone template fetch error:", error);
			return c.json(
				{
					code: "INTERNAL_ERROR",
					message: "Failed to fetch milestone template",
					details:
						error instanceof Error
							? error.message
							: "Unknown error",
				},
				500,
			);
		}
	})

	// Create milestone template
	.post("/", async (c) => {
		try {
			const body = await c.req.json();
			const data = MilestoneTemplateCreateSchema.parse(body);
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

			// Check for duplicate template name within project
			const existingTemplate = await prisma.milestoneTemplate.findFirst({
				where: {
					projectId: data.projectId,
					name: data.name,
				},
			});

			if (existingTemplate) {
				return c.json(
					{
						code: "DUPLICATE_TEMPLATE_NAME",
						message: "Template name already exists",
						details: `Template name "${data.name}" is already in use within this project`,
					},
					409,
				);
			}

			// Validate milestones array
			const totalWeight = data.milestones.reduce(
				(sum, m) => sum + m.weight,
				0,
			);
			if (Math.abs(totalWeight - 100) > 0.01) {
				return c.json(
					{
						code: "INVALID_WEIGHTS",
						message: "Milestone weights must sum to 100",
						details: { currentTotal: totalWeight, required: 100 },
					},
					400,
				);
			}

			// Sort milestones by order and ensure unique orders
			const sortedMilestones = data.milestones.sort(
				(a, b) => a.order - b.order,
			);
			const orders = new Set(sortedMilestones.map((m) => m.order));
			if (orders.size !== sortedMilestones.length) {
				return c.json(
					{
						code: "DUPLICATE_ORDERS",
						message: "Milestone orders must be unique",
					},
					400,
				);
			}

			// If setting as default, unset other defaults
			if (data.isDefault) {
				await prisma.milestoneTemplate.updateMany({
					where: {
						projectId: data.projectId,
						isDefault: true,
					},
					data: { isDefault: false },
				});
			}

			const template = await prisma.milestoneTemplate.create({
				data: {
					...data,
					milestones: sortedMilestones,
				},
				include: {
					project: {
						select: {
							id: true,
							jobName: true,
							jobNumber: true,
						},
					},
					_count: {
						select: { components: true },
					},
				},
			});

			return c.json(template, 201);
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
			console.error("Milestone template creation error:", error);
			return c.json(
				{
					code: "INTERNAL_ERROR",
					message: "Failed to create milestone template",
					details:
						error instanceof Error
							? error.message
							: "Unknown error",
				},
				500,
			);
		}
	})

	// Update milestone template
	.patch("/:id", async (c) => {
		try {
			const id = c.req.param("id");
			const body = await c.req.json();
			const updates = MilestoneTemplateUpdateSchema.parse(body);
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

			// Get existing template and verify access
			const template = await prisma.milestoneTemplate.findFirst({
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
					_count: {
						select: { components: true },
					},
				},
			});

			if (!template) {
				return c.json(
					{
						code: "ACCESS_DENIED",
						message:
							"Template not found or insufficient permissions",
					},
					403,
				);
			}

			// Check if template is in use and prevent certain updates
			if (template._count.components > 0) {
				if (updates.milestones) {
					return c.json(
						{
							code: "TEMPLATE_IN_USE",
							message:
								"Cannot modify milestones structure when template is in use",
							details: {
								componentsUsing: template._count.components,
								suggestion:
									"Create a new template or remove components using this template first",
							},
						},
						400,
					);
				}
			}

			// Check for duplicate name if updating name
			if (updates.name && updates.name !== template.name) {
				const existingTemplate =
					await prisma.milestoneTemplate.findFirst({
						where: {
							projectId: template.projectId,
							name: updates.name,
							NOT: { id },
						},
					});

				if (existingTemplate) {
					return c.json(
						{
							code: "DUPLICATE_TEMPLATE_NAME",
							message: "Template name already exists",
							details: `Template name "${updates.name}" is already in use within this project`,
						},
						409,
					);
				}
			}

			// Validate milestones if provided
			if (updates.milestones) {
				const totalWeight = updates.milestones.reduce(
					(sum, m) => sum + m.weight,
					0,
				);
				if (Math.abs(totalWeight - 100) > 0.01) {
					return c.json(
						{
							code: "INVALID_WEIGHTS",
							message: "Milestone weights must sum to 100",
							details: {
								currentTotal: totalWeight,
								required: 100,
							},
						},
						400,
					);
				}

				// Sort and validate orders
				const sortedMilestones = updates.milestones.sort(
					(a, b) => a.order - b.order,
				);
				const orders = new Set(sortedMilestones.map((m) => m.order));
				if (orders.size !== sortedMilestones.length) {
					return c.json(
						{
							code: "DUPLICATE_ORDERS",
							message: "Milestone orders must be unique",
						},
						400,
					);
				}

				updates.milestones = sortedMilestones;
			}

			// If setting as default, unset other defaults
			if (updates.isDefault === true) {
				await prisma.milestoneTemplate.updateMany({
					where: {
						projectId: template.projectId,
						isDefault: true,
						NOT: { id },
					},
					data: { isDefault: false },
				});
			}

			const updatedTemplate = await prisma.milestoneTemplate.update({
				where: { id },
				data: updates,
				include: {
					project: {
						select: {
							id: true,
							jobName: true,
							jobNumber: true,
						},
					},
					_count: {
						select: { components: true },
					},
				},
			});

			return c.json(updatedTemplate);
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
			console.error("Milestone template update error:", error);
			return c.json(
				{
					code: "INTERNAL_ERROR",
					message: "Failed to update milestone template",
					details:
						error instanceof Error
							? error.message
							: "Unknown error",
				},
				500,
			);
		}
	})

	// Delete milestone template
	.delete("/:id", async (c) => {
		try {
			const id = c.req.param("id");
			const userId = c.get("user")?.id;
			const force = c.req.query("force") === "true";

			if (!userId) {
				return c.json(
					{
						code: "UNAUTHENTICATED",
						message: "User not authenticated",
					},
					401,
				);
			}

			// Get template and verify access
			const template = await prisma.milestoneTemplate.findFirst({
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
					_count: {
						select: { components: true },
					},
					components: {
						select: { id: true, componentId: true },
						take: 5, // Show first 5 components using this template
					},
				},
			});

			if (!template) {
				return c.json(
					{
						code: "ACCESS_DENIED",
						message:
							"Template not found or insufficient permissions",
					},
					403,
				);
			}

			// Check if template is in use
			if (template._count.components > 0 && !force) {
				return c.json(
					{
						code: "TEMPLATE_IN_USE",
						message: "Cannot delete template currently in use",
						details: {
							componentsUsing: template._count.components,
							exampleComponents: template.components,
							suggestion:
								"Use force=true to delete anyway, or remove components using this template first",
						},
					},
					400,
				);
			}

			const deletedTemplate = await prisma.milestoneTemplate.delete({
				where: { id },
			});

			return c.json({
				success: true,
				deleted: deletedTemplate,
				affectedComponents: template._count.components,
			});
		} catch (error) {
			console.error("Milestone template deletion error:", error);
			return c.json(
				{
					code: "INTERNAL_ERROR",
					message: "Failed to delete milestone template",
					details:
						error instanceof Error
							? error.message
							: "Unknown error",
				},
				500,
			);
		}
	})

	// Apply template to components
	.post("/:id/apply", async (c) => {
		try {
			const templateId = c.req.param("id");
			const body = await c.req.json();
			const { componentIds, options } =
				ApplyTemplateSchema.parse(body);
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

			// Get template and verify access
			const template = await prisma.milestoneTemplate.findFirst({
				where: {
					id: templateId,
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

			if (!template) {
				return c.json(
					{
						code: "ACCESS_DENIED",
						message:
							"Template not found or insufficient permissions",
					},
					403,
				);
			}

			// Get components and verify they belong to the same project
			const components = await prisma.component.findMany({
				where: {
					id: { in: componentIds },
					projectId: template.projectId,
				},
				include: {
					milestones: {
						select: {
							id: true,
							milestoneName: true,
							isCompleted: true,
							completedAt: true,
							completedBy: true,
						},
					},
				},
			});

			if (components.length !== componentIds.length) {
				return c.json(
					{
						code: "COMPONENTS_NOT_FOUND",
						message:
							"Some components not found or belong to different project",
						details: {
							requested: componentIds.length,
							found: components.length,
							missingIds: componentIds.filter(
								(id) => !components.some((c) => c.id === id),
							),
						},
					},
					400,
				);
			}

			const milestoneData = template.milestones as any[];
			const results = {
				applied: 0,
				skipped: 0,
				errors: [] as any[],
			};

			// Apply template to each component
			for (const component of components) {
				try {
					const existingMilestones = component.milestones;

					// If not replacing and component already has milestones, skip or preserve
					if (
						existingMilestones.length > 0 &&
						!options.replaceExisting
					) {
						results.skipped++;
						continue;
					}

					// Prepare new milestones
					const newMilestones = milestoneData.map(
						(milestone, index) => ({
							componentId: component.id,
							milestoneName: milestone.name,
							milestoneOrder: index,
							weight: milestone.weight || 1,
							isCompleted: false,
							percentageValue: null,
							quantityValue: null,
							quantityUnit: null,
						}),
					);

					// If preserving completed milestones, find matches by name
					if (
						options.preserveCompleted &&
						existingMilestones.length > 0
					) {
						const completedMilestones = existingMilestones.filter(
							(m) => m.isCompleted,
						);

						newMilestones.forEach((newMilestone) => {
							const completedMatch = completedMilestones.find(
								(cm) =>
									cm.milestoneName ===
									newMilestone.milestoneName,
							);

							if (completedMatch) {
								newMilestone.isCompleted = true;
							}
						});
					}

					// Replace milestones in transaction
					await prisma.$transaction(async (tx) => {
						// Delete existing milestones
						await tx.componentMilestone.deleteMany({
							where: { componentId: component.id },
						});

						// Create new milestones
						await tx.componentMilestone.createMany({
							data: newMilestones,
						});

						// Update component template reference
						await tx.component.update({
							where: { id: component.id },
							data: { milestoneTemplateId: templateId },
						});
					});

					results.applied++;
				} catch (error) {
					console.error(
						`Failed to apply template to component ${component.id}:`,
						error,
					);
					results.errors.push({
						componentId: component.id,
						componentDisplayId: component.displayId,
						error:
							error instanceof Error
								? error.message
								: "Unknown error",
					});
				}
			}

			// Update template usage count
			await prisma.milestoneTemplate.update({
				where: { id: templateId },
				data: {
					usageCount: { increment: results.applied },
				},
			});

			return c.json({
				success: true,
				templateId,
				results: {
					totalComponents: componentIds.length,
					applied: results.applied,
					skipped: results.skipped,
					failed: results.errors.length,
				},
				errors: results.errors.length > 0 ? results.errors : undefined,
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
			console.error("Apply template error:", error);
			return c.json(
				{
					code: "INTERNAL_ERROR",
					message: "Failed to apply template to components",
					details:
						error instanceof Error
							? error.message
							: "Unknown error",
				},
				500,
			);
		}
	});
