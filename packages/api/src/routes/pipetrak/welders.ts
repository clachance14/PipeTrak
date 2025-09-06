import { db } from "@repo/database";
import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth";

const welderCreateSchema = z.object({
	projectId: z.string(),
	stencil: z
		.string()
		.min(1, "Stencil is required")
		.regex(
			/^[A-Za-z0-9-]+$/,
			"Stencil must contain only letters, numbers, and hyphens",
		),
	name: z.string().min(2, "Name must be at least 2 characters"),
	active: z.boolean().default(true),
});

const welderUpdateSchema = z.object({
	name: z.string().min(1, "Name is required").optional(),
	active: z.boolean().optional(),
});

export const weldersRouter = new Hono()
	.use("*", authMiddleware)

	// GET /welders - List welders for a project
	.get("/", async (c) => {
		const projectId = c.req.query("projectId");
		const active = c.req.query("active");
		const search = c.req.query("search");

		if (!projectId) {
			return c.json({ error: "Project ID is required" }, 400);
		}

		try {
			const where: any = { projectId };

			// Filter by active status if specified
			if (active !== undefined) {
				where.active = active === "true";
			}

			// Search by stencil or name if specified
			if (search) {
				where.OR = [
					{ stencil: { contains: search, mode: "insensitive" } },
					{ name: { contains: search, mode: "insensitive" } },
				];
			}

			const welders = await db.welder.findMany({
				where,
				include: {
					_count: {
						select: {
							fieldWelds: true,
						},
					},
				},
				orderBy: [
					{ active: "desc" }, // Active welders first
					{ stencil: "asc" },
				],
			});

			return c.json({
				welders: welders.map((welder) => ({
					...welder,
					weldCount: welder._count.fieldWelds,
				})),
			});
		} catch (error: any) {
			console.error("Error fetching welders:", error);
			return c.json({ error: "Failed to fetch welders" }, 500);
		}
	})

	// POST /welders - Create a new welder
	.post("/", async (c) => {
		const body = await c.req.json();

		// Validate using zod
		const validation = welderCreateSchema.safeParse(body);
		if (!validation.success) {
			return c.json(
				{
					error: "Validation failed",
					details: validation.error.issues,
				},
				400,
			);
		}

		const { projectId, stencil, name, active } = validation.data;

		try {
			// Check if stencil already exists globally (not just in this project)
			const existingWelder = await db.welder.findFirst({
				where: {
					stencil,
				},
			});

			if (existingWelder) {
				return c.json(
					{ error: "A welder with this stencil already exists" },
					400,
				);
			}

			// Verify project exists
			const project = await db.project.findUnique({
				where: { id: projectId },
			});

			if (!project) {
				return c.json({ error: "Project not found" }, 404);
			}

			const welder = await db.welder.create({
				data: {
					projectId,
					stencil,
					name,
					active,
				},
				include: {
					_count: {
						select: {
							fieldWelds: true,
						},
					},
				},
			});

			return c.json(
				{
					welder: {
						...welder,
						weldCount: welder._count.fieldWelds,
					},
				},
				201,
			);
		} catch (error: any) {
			console.error("Error creating welder:", error);
			return c.json({ error: "Failed to create welder" }, 500);
		}
	})

	// GET /welders/:id - Get a specific welder
	.get("/:id", async (c) => {
		const id = c.req.param("id");

		try {
			const welder = await db.welder.findUnique({
				where: { id },
				include: {
					project: {
						select: {
							id: true,
							jobName: true,
							jobNumber: true,
						},
					},
					fieldWelds: {
						select: {
							id: true,
							weldIdNumber: true,
							dateWelded: true,
							ndeResult: true,
							packageNumber: true,
						},
						orderBy: {
							dateWelded: "desc",
						},
						take: 10, // Recent 10 welds
					},
					_count: {
						select: {
							fieldWelds: true,
						},
					},
				},
			});

			if (!welder) {
				return c.json({ error: "Welder not found" }, 404);
			}

			return c.json({
				welder: {
					...welder,
					weldCount: welder._count.fieldWelds,
				},
			});
		} catch (error: any) {
			console.error("Error fetching welder:", error);
			return c.json({ error: "Failed to fetch welder" }, 500);
		}
	})

	// PUT /welders/:id - Update a welder
	.put("/:id", async (c) => {
		const id = c.req.param("id");
		const body = await c.req.json();

		// Validate using zod
		const validation = welderUpdateSchema.safeParse(body);
		if (!validation.success) {
			return c.json(
				{
					error: "Validation failed",
					details: validation.error.issues,
				},
				400,
			);
		}

		const updates = validation.data;

		try {
			// Check if welder exists
			const existingWelder = await db.welder.findUnique({
				where: { id },
			});

			if (!existingWelder) {
				return c.json({ error: "Welder not found" }, 404);
			}

			const welder = await db.welder.update({
				where: { id },
				data: updates,
				include: {
					_count: {
						select: {
							fieldWelds: true,
						},
					},
				},
			});

			return c.json({
				welder: {
					...welder,
					weldCount: welder._count.fieldWelds,
				},
			});
		} catch (error: any) {
			console.error("Error updating welder:", error);
			return c.json({ error: "Failed to update welder" }, 500);
		}
	})

	// DELETE /welders/:id - Soft delete a welder (set active to false)
	.delete("/:id", async (c) => {
		const id = c.req.param("id");

		try {
			// Check if welder exists
			const existingWelder = await db.welder.findUnique({
				where: { id },
			});

			if (!existingWelder) {
				return c.json({ error: "Welder not found" }, 404);
			}

			// Check if welder has associated field welds
			const weldCount = await db.fieldWeld.count({
				where: { welderId: id },
			});

			if (weldCount > 0) {
				// Don't actually delete, just deactivate
				const welder = await db.welder.update({
					where: { id },
					data: { active: false },
					include: {
						_count: {
							select: {
								fieldWelds: true,
							},
						},
					},
				});

				return c.json({
					message: "Welder deactivated (has associated field welds)",
					welder: {
						...welder,
						weldCount: welder._count.fieldWelds,
					},
				});
			}
			// No associated welds, can actually delete
			await db.welder.delete({
				where: { id },
			});

			return c.json({ message: "Welder deleted successfully" });
		} catch (error: any) {
			console.error("Error deleting welder:", error);
			return c.json({ error: "Failed to delete welder" }, 500);
		}
	})

	// GET /welders/:id/stats - Get welder statistics
	.get("/:id/stats", async (c) => {
		const id = c.req.param("id");

		try {
			const welder = await db.welder.findUnique({
				where: { id },
				select: {
					id: true,
					stencil: true,
					name: true,
				},
			});

			if (!welder) {
				return c.json({ error: "Welder not found" }, 404);
			}

			// Get welder statistics
			const [
				totalWelds,
				acceptedWelds,
				rejectedWelds,
				pendingWelds,
				recentWelds,
			] = await Promise.all([
				// Total welds
				db.fieldWeld.count({
					where: { welderId: id },
				}),

				// Accepted welds
				db.fieldWeld.count({
					where: {
						welderId: id,
						ndeResult: "Accept",
					},
				}),

				// Rejected welds
				db.fieldWeld.count({
					where: {
						welderId: id,
						ndeResult: "Reject",
					},
				}),

				// Pending NDE
				db.fieldWeld.count({
					where: {
						welderId: id,
						OR: [{ ndeResult: "Pending" }, { ndeResult: null }],
					},
				}),

				// Recent welds (last 30 days)
				db.fieldWeld.count({
					where: {
						welderId: id,
						dateWelded: {
							gte: new Date(
								Date.now() - 30 * 24 * 60 * 60 * 1000,
							),
						},
					},
				}),
			]);

			const acceptanceRate =
				totalWelds > 0
					? Math.round(
							(acceptedWelds / (acceptedWelds + rejectedWelds)) *
								100,
						)
					: 0;

			return c.json({
				welder,
				stats: {
					totalWelds,
					acceptedWelds,
					rejectedWelds,
					pendingWelds,
					recentWelds,
					acceptanceRate,
				},
			});
		} catch (error: any) {
			console.error("Error fetching welder stats:", error);
			return c.json({ error: "Failed to fetch welder statistics" }, 500);
		}
	});
