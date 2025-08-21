import { Hono } from "hono";
import { validator } from "hono/validator";
import { z } from "zod";
import { db } from "@repo/database";
import { authMiddleware } from "../../middleware/auth";

const welderCreateSchema = z.object({
  projectId: z.string(),
  stencil: z.string().min(1, "Stencil is required"),
  name: z.string().min(1, "Name is required"),
  active: z.boolean().default(true),
});

const welderUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  active: z.boolean().optional(),
});

const welderQuerySchema = z.object({
  projectId: z.string(),
  active: z.boolean().optional(),
  search: z.string().optional(),
});

export const weldersRouter = new Hono()
  .use("*", authMiddleware)

  // GET /welders - List welders for a project
  .get(
    "/",
    validator("query", welderQuerySchema),
    async (c) => {
      const { projectId, active, search } = c.req.valid("query");

      try {
        const where: any = { projectId };

        // Filter by active status if specified
        if (active !== undefined) {
          where.active = active;
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
    }
  )

  // POST /welders - Create a new welder
  .post(
    "/",
    validator("json", welderCreateSchema),
    async (c) => {
      const { projectId, stencil, name, active } = c.req.valid("json");

      try {
        // Check if stencil already exists for this project
        const existingWelder = await db.welder.findFirst({
          where: {
            projectId,
            stencil,
          },
        });

        if (existingWelder) {
          return c.json(
            { error: "A welder with this stencil already exists in this project" },
            400
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

        return c.json({
          welder: {
            ...welder,
            weldCount: welder._count.fieldWelds,
          },
        }, 201);
      } catch (error: any) {
        console.error("Error creating welder:", error);
        return c.json({ error: "Failed to create welder" }, 500);
      }
    }
  )

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
  .put(
    "/:id",
    validator("json", welderUpdateSchema),
    async (c) => {
      const id = c.req.param("id");
      const updates = c.req.valid("json");

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
    }
  )

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
      } else {
        // No associated welds, can actually delete
        await db.welder.delete({
          where: { id },
        });

        return c.json({ message: "Welder deleted successfully" });
      }
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
            OR: [
              { ndeResult: "Pending" },
              { ndeResult: null },
            ],
          },
        }),

        // Recent welds (last 30 days)
        db.fieldWeld.count({
          where: {
            welderId: id,
            dateWelded: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

      const acceptanceRate = totalWelds > 0 
        ? Math.round((acceptedWelds / (acceptedWelds + rejectedWelds)) * 100) 
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