import { db as prisma } from "@repo/database";
import { z } from "zod";
import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth";

const AuditLogFilterSchema = z.object({
  projectId: z.string(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  action: z.string().optional(),
  userId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export const auditLogsRouter = new Hono()
  .use("*", authMiddleware)
  
  // Get audit logs
  .get("/", async (c) => {
    try {
      const query = AuditLogFilterSchema.parse(c.req.query());
      const userId = c.get("user")?.id;
      const { limit, offset, ...filters } = query;

      // Verify user has access to the project
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
        return c.json({ error: "Project not found or access denied" }, 403);
      }

      // Build where clause
      const where: any = { projectId: filters.projectId };
      
      if (filters.entityType) where.entityType = filters.entityType;
      if (filters.entityId) where.entityId = filters.entityId;
      if (filters.action) where.action = filters.action;
      if (filters.userId) where.userId = filters.userId;
      
      if (filters.startDate || filters.endDate) {
        where.timestamp = {};
        if (filters.startDate) where.timestamp.gte = new Date(filters.startDate);
        if (filters.endDate) where.timestamp.lte = new Date(filters.endDate);
      }

      // Get total count
      const total = await prisma.auditLog.count({ where });

      // Get audit logs
      const logs = await prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { timestamp: "desc" },
        take: limit,
        skip: offset,
      });

      return c.json({
        data: logs,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ error: "Invalid query parameters", details: error.errors }, 400);
      }
      return c.json({ error: "Failed to fetch audit logs" }, 500);
    }
  })

  // Get audit log by ID
  .get("/:id", async (c) => {
    try {
      const id = c.req.param("id");
      const userId = c.get("user")?.id;

      const log = await prisma.auditLog.findFirst({
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
          user: {
            select: { id: true, name: true, email: true },
          },
          project: {
            select: { id: true, jobName: true, jobNumber: true },
          },
        },
      });

      if (!log) {
        return c.json({ error: "Audit log not found or access denied" }, 403);
      }

      return c.json(log);
    } catch (error) {
      return c.json({ error: "Failed to fetch audit log" }, 500);
    }
  });