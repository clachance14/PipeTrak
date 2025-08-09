import { db as prisma } from "@repo/database";
import { z } from "zod";
import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth";
import { WorkflowType, ComponentStatus } from "@repo/database/prisma/generated/client";

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
  limit: z.coerce.number().min(1).max(1000).default(100),
  offset: z.coerce.number().min(0).default(0),
  sortBy: z.enum(["componentId", "type", "area", "system", "completionPercent", "updatedAt"]).default("componentId"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

const BulkUpdateSchema = z.object({
  componentIds: z.array(z.string()),
  updates: ComponentUpdateSchema,
});

export const componentsRouter = new Hono()
  .use("*", authMiddleware)
  
  // Get components with filtering and pagination
  .get("/", async (c) => {
    try {
      const query = ComponentFilterSchema.parse(c.req.query());
      const { limit, offset, sortBy, sortOrder, search, ...filters } = query;

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
        return c.json({ error: "Invalid query parameters", details: error.errors }, 400);
      }
      console.error("Error fetching components:", error);
      return c.json({ error: "Failed to fetch components" }, 500);
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
        return c.json({ error: "Component not found" }, 404);
      }

      return c.json(component);
    } catch (error) {
      return c.json({ error: "Failed to fetch component" }, 500);
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
        return c.json({ 
          error: "Project not found or user is not a member of the organization",
          details: "User must be added to the organization to access this project"
        }, 403);
      }

      // Create component
      const component = await prisma.component.create({
        data: {
          ...data,
          status: ComponentStatus.NOT_STARTED,
          completionPercent: 0,
        },
        include: {
          milestones: true,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          projectId: data.projectId,
          userId,
          entityType: "component",
          entityId: component.id,
          action: "CREATE",
          changes: Object.keys(component).reduce((acc, key) => {
            if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
              acc[key] = { old: null, new: (component as any)[key] };
            }
            return acc;
          }, {} as any),
        },
      });

      return c.json(component, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ error: "Invalid input", details: error.errors }, 400);
      }
      return c.json({ error: "Failed to create component" }, 500);
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
        return c.json({ error: "Component not found or access denied" }, 403);
      }

      // Update component
      const component = await prisma.component.update({
        where: { id },
        data: updates,
        include: {
          milestones: true,
        },
      });

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
        return c.json({ error: "Invalid input", details: error.errors }, 400);
      }
      return c.json({ error: "Failed to update component" }, 500);
    }
  })

  // Bulk update components
  .patch("/bulk", async (c) => {
    try {
      const body = await c.req.json();
      const { componentIds, updates } = BulkUpdateSchema.parse(body);
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
        return c.json({ error: "Some components not found or access denied" }, 403);
      }

      // Update all components
      const updatePromises = componentIds.map((id) =>
        prisma.component.update({
          where: { id },
          data: updates,
        })
      );

      const updatedComponents = await prisma.$transaction(updatePromises);

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
        updated: updatedComponents.length,
        components: updatedComponents,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ error: "Invalid input", details: error.errors }, 400);
      }
      return c.json({ error: "Failed to update components" }, 500);
    }
  })

  // Delete component
  .delete("/:id", async (c) => {
    try {
      const id = c.req.param("id");
      const userId = c.get("user")?.id;

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
        return c.json({ error: "Component not found or insufficient permissions" }, 403);
      }

      // Delete component (cascades to milestones)
      await prisma.component.delete({ where: { id } });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          projectId: component.projectId,
          userId,
          entityType: "component",
          entityId: id,
          action: "DELETE",
          changes: Object.keys(component).reduce((acc, key) => {
            if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
              acc[key] = { old: (component as any)[key], new: null };
            }
            return acc;
          }, {} as any),
        },
      });

      return c.json({ success: true });
    } catch (error) {
      return c.json({ error: "Failed to delete component" }, 500);
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
        return c.json({ 
          error: "Project not found or user is not a member of the organization",
          details: "User must be added to the organization to access this project"
        }, 403);
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
      return c.json({ error: "Failed to fetch statistics" }, 500);
    }
  });