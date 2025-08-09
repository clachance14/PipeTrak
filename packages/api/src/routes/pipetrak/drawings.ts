import { db as prisma } from "@repo/database";
import { z } from "zod";
import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth";
import type { Prisma, ComponentStatus } from "@repo/database";

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
async function verifyProjectAccess(userId: string, projectId: string): Promise<boolean> {
  const membership = await prisma.member.findFirst({
    where: {
      userId,
      organization: {
        projects: {
          some: { id: projectId }
        }
      }
    }
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
    drawingId: filters.drawingId
  };

  if (filters.status?.length) {
    where.status = { in: filters.status as ComponentStatus[] };
  }

  if (filters.type?.length) {
    where.type = { in: filters.type };
  }

  if (filters.area?.length) {
    where.area = { in: filters.area };
  }

  if (filters.system?.length) {
    where.system = { in: filters.system };
  }

  if (filters.search) {
    where.OR = [
      { componentId: { contains: filters.search, mode: 'insensitive' } },
      { displayId: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } }
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
        return c.json({ error: "Project not found or access denied" }, 403);
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
      return c.json({ error: "Failed to fetch drawings" }, 500);
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
        return c.json({ error: "Project not found or access denied" }, 403);
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
      const drawingsWithCounts = drawings.map(drawing => {
        const componentStatusCounts = drawing.components.reduce((acc, comp) => {
          acc[comp.status] = (acc[comp.status] || 0) + 1;
          return acc;
        }, {} as Record<ComponentStatus, number>);

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
          }
        };
      });

      // Build parent-child relationships
      const drawingMap = new Map(drawingsWithCounts.map(d => [d.id, { ...d, children: [] as any[] }]));
      const rootDrawings: any[] = [];

      for (const drawing of drawingsWithCounts) {
        const treeNode = drawingMap.get(drawing.id)!;
        
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
          rootDrawings: rootDrawings.length
        }
      });
    } catch (error) {
      console.error("Failed to fetch drawing hierarchy:", error);
      return c.json({ error: "Failed to fetch drawing hierarchy" }, 500);
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
              members: { some: { userId } }
            }
          }
        },
        include: {
          project: { select: { id: true, jobName: true, jobNumber: true, organizationId: true } },
          parent: { select: { id: true, number: true, title: true } },
          children: { 
            select: { 
              id: true, 
              number: true, 
              title: true,
              _count: { select: { components: true } }
            } 
          }
        }
      });

      if (!drawing) {
        return c.json({ error: "Drawing not found or access denied" }, 403);
      }

      // Build component filters
      const whereClause = buildComponentFilters({
        drawingId,
        status: filters.status?.split(','),
        type: filters.type?.split(','),
        area: filters.area?.split(','),
        system: filters.system?.split(','),
        search: filters.search
      });

      const page = parseInt(filters.page);
      const limit = parseInt(filters.limit);

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
                weight: true
              }
            },
            milestoneTemplate: {
              select: { id: true, name: true }
            }
          },
          orderBy: [
            { componentId: 'asc' },
            { instanceNumber: 'asc' }
          ],
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.component.count({ where: whereClause })
      ]);

      return c.json({
        drawing,
        components,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      });
    } catch (error) {
      console.error("Failed to fetch drawing details:", error);
      return c.json({ error: "Failed to fetch drawing details" }, 500);
    }
  })

  // Search drawings
  .get("/project/:projectId/search", async (c) => {
    try {
      const projectId = c.req.param("projectId");
      const query = c.req.query("q");
      const limit = parseInt(c.req.query("limit") || "20");
      const userId = c.get("user")?.id;

      if (!query || query.length < 2) {
        return c.json({ error: "Search query must be at least 2 characters" }, 400);
      }

      // Verify access
      const hasAccess = await verifyProjectAccess(userId, projectId);
      if (!hasAccess) {
        return c.json({ error: "Project not found or access denied" }, 403);
      }

      // Search drawings by number, title, or component content
      const drawings = await prisma.drawing.findMany({
        where: {
          projectId,
          OR: [
            { number: { contains: query, mode: 'insensitive' } },
            { title: { contains: query, mode: 'insensitive' } },
            {
              components: {
                some: {
                  OR: [
                    { componentId: { contains: query, mode: 'insensitive' } },
                    { displayId: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } }
                  ]
                }
              }
            }
          ]
        },
        include: {
          _count: { select: { components: true } },
          parent: { select: { id: true, number: true, title: true } }
        },
        take: limit,
        orderBy: { number: 'asc' }
      });

      // Build breadcrumb paths for search results
      const resultsWithPaths = await Promise.all(drawings.map(async (drawing) => {
        const path: { id: string; number: string; title: string }[] = [];
        let currentDrawing = drawing;
        
        while (currentDrawing.parent) {
          path.unshift({
            id: currentDrawing.parent.id,
            number: currentDrawing.parent.number,
            title: currentDrawing.parent.title
          });
          
          currentDrawing = await prisma.drawing.findUnique({
            where: { id: currentDrawing.parent.id },
            include: { parent: { select: { id: true, number: true, title: true } } }
          }) as any;
          
          if (!currentDrawing) break;
        }

        return {
          id: drawing.id,
          number: drawing.number,
          title: drawing.title,
          revision: drawing.revision,
          parentId: drawing.parentId,
          componentCount: drawing._count.components,
          breadcrumb: path
        };
      }));

      return c.json({ results: resultsWithPaths });
    } catch (error) {
      console.error("Search failed:", error);
      return c.json({ error: "Search failed" }, 500);
    }
  })

  // Create drawing
  .post("/", async (c) => {
    try {
      const body = await c.req.json();
      const data = DrawingCreateSchema.parse(body);
      const userId = c.get("user")?.id;

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
        return c.json({ error: "Project not found or insufficient permissions" }, 403);
      }

      const drawing = await prisma.drawing.create({
        data,
        include: {
          parent: true,
          _count: {
            select: { components: true },
          },
        },
      });

      return c.json(drawing, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ error: "Invalid input", details: error.errors }, 400);
      }
      return c.json({ error: "Failed to create drawing" }, 500);
    }
  });