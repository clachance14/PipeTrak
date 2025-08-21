import { db as prisma } from "@repo/database";
import { z } from "zod";
import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth";
import { ProjectStatus } from "@repo/database/prisma/generated/client";

// Project validation schemas
const ProjectCreateSchema = z.object({
  organizationId: z.string(),
  jobNumber: z.string()
    .min(1, "Job number is required")
    .max(10, "Job number must be 10 characters or less")
    .regex(/^[A-Za-z0-9-]+$/, "Job number must be alphanumeric (hyphens allowed)"),
  jobName: z.string().min(1).max(255),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().datetime().optional(),
  targetDate: z.string().datetime().optional(),
});

const ProjectUpdateSchema = ProjectCreateSchema.partial().extend({
  status: z.nativeEnum(ProjectStatus).optional(),
});

export const projectsRouter = new Hono()
  .use("*", authMiddleware)

  // Get all projects for user's organizations
  .get("/", async (c) => {
    try {
      const userId = c.get("user")?.id;
      const organizationId = c.req.query("organizationId");

      const where: any = {
        organization: {
          members: {
            some: { userId },
          },
        },
      };

      if (organizationId) {
        where.organizationId = organizationId;
      }

      const projects = await prisma.project.findMany({
        where,
        include: {
          organization: {
            select: { id: true, name: true, slug: true },
          },
          creator: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: {
              components: true,
              drawings: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      });

      // Add progress statistics
      const projectsWithStats = await Promise.all(
        projects.map(async (project) => {
          const stats = await prisma.component.aggregate({
            where: { projectId: project.id },
            _avg: { completionPercent: true },
            _count: true,
          });

          const statusCounts = await prisma.component.groupBy({
            by: ["status"],
            where: { projectId: project.id },
            _count: true,
          });

          return {
            ...project,
            stats: {
              totalComponents: stats._count,
              averageCompletion: stats._avg.completionPercent || 0,
              statusCounts: statusCounts.reduce((acc, curr) => {
                acc[curr.status] = curr._count;
                return acc;
              }, {} as Record<string, number>),
            },
          };
        })
      );

      return c.json(projectsWithStats);
    } catch (error) {
      console.error("Projects fetch error:", error);
      return c.json({
        code: "INTERNAL_ERROR",
        message: "Failed to fetch projects",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 500);
    }
  })

  // Get single project
  .get("/:id", async (c) => {
    try {
      const id = c.req.param("id");
      const userId = c.get("user")?.id;

      const project = await prisma.project.findFirst({
        where: {
          id,
          organization: {
            members: {
              some: { userId },
            },
          },
        },
        include: {
          organization: {
            select: { id: true, name: true, slug: true },
          },
          creator: {
            select: { id: true, name: true, email: true },
          },
          milestoneTemplates: true,
          _count: {
            select: {
              components: true,
              drawings: true,
              importJobs: true,
            },
          },
        },
      });

      if (!project) {
        return c.json({
          code: "ACCESS_DENIED",
          message: "Project not found or access denied"
        }, 403);
      }

      // Get progress statistics
      const stats = await prisma.component.aggregate({
        where: { projectId: id },
        _avg: { completionPercent: true },
        _count: true,
      });

      const statusCounts = await prisma.component.groupBy({
        by: ["status"],
        where: { projectId: id },
        _count: true,
      });

      const areaProgress = await prisma.component.groupBy({
        by: ["area"],
        where: { projectId: id, area: { not: null } },
        _count: true,
        _avg: { completionPercent: true },
      });

      const systemProgress = await prisma.component.groupBy({
        by: ["system"],
        where: { projectId: id, system: { not: null } },
        _count: true,
        _avg: { completionPercent: true },
      });

      return c.json({
        ...project,
        stats: {
          totalComponents: stats._count,
          averageCompletion: stats._avg.completionPercent || 0,
          statusCounts: statusCounts.reduce((acc, curr) => {
            acc[curr.status] = curr._count;
            return acc;
          }, {} as Record<string, number>),
          areaProgress,
          systemProgress,
        },
      });
    } catch (error) {
      console.error("Project fetch error:", error);
      return c.json({
        code: "INTERNAL_ERROR",
        message: "Failed to fetch project",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 500);
    }
  })

  // Create new project
  .post("/", async (c) => {
    try {
      const body = await c.req.json();
      const data = ProjectCreateSchema.parse(body);
      const userId = c.get("user")?.id;

      // Verify user has admin/owner role in organization
      const membership = await prisma.member.findFirst({
        where: {
          userId,
          organizationId: data.organizationId,
          role: { in: ["owner", "admin"] },
        },
      });

      if (!membership) {
        return c.json({
          code: "ACCESS_DENIED", 
          message: "Insufficient permissions to create project"
        }, 403);
      }

      // Check for duplicate job number within organization
      const existingProject = await prisma.project.findFirst({
        where: {
          organizationId: data.organizationId,
          jobNumber: data.jobNumber,
        },
      });

      if (existingProject) {
        return c.json({
            code: "DUPLICATE_JOB_NUMBER",
            message: "Job number already exists", 
            details: `Job number ${data.jobNumber} is already in use within this organization` 
          }, 
          409
        );
      }

      const project = await prisma.project.create({
        data: {
          ...data,
          createdBy: userId,
          status: ProjectStatus.ACTIVE,
        },
        include: {
          organization: {
            select: { id: true, name: true, slug: true },
          },
          creator: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Create default milestone templates
      const defaultTemplates = [
        {
          name: "Full",
          description: "Standard full milestone set for pipe spools",
          milestones: [
            { name: "Fabrication", weight: 20, order: 1 },
            { name: "Galvanizing", weight: 10, order: 2 },
            { name: "Delivery", weight: 10, order: 3 },
            { name: "Installation", weight: 30, order: 4 },
            { name: "Testing", weight: 20, order: 5 },
            { name: "Insulation", weight: 10, order: 6 },
          ],
          isDefault: true,
        },
        {
          name: "Reduced",
          description: "Reduced milestone set for simple components",
          milestones: [
            { name: "Delivery", weight: 25, order: 1 },
            { name: "Installation", weight: 50, order: 2 },
            { name: "Testing", weight: 25, order: 3 },
          ],
          isDefault: false,
        },
        {
          name: "Insulation Only",
          description: "For tracking insulation work only",
          milestones: [
            { name: "Insulation", weight: 100, order: 1 },
          ],
          isDefault: false,
        },
      ];

      await prisma.milestoneTemplate.createMany({
        data: defaultTemplates.map((template) => ({
          projectId: project.id,
          ...template,
        })),
      });

      return c.json(project, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({
          code: "INVALID_INPUT",
          message: "Invalid input",
          details: error.errors
        }, 400);
      }
      console.error("Project creation error:", error);
      return c.json({
        code: "INTERNAL_ERROR",
        message: "Failed to create project",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 500);
    }
  })

  // Update project
  .patch("/:id", async (c) => {
    try {
      const id = c.req.param("id");
      const body = await c.req.json();
      const updates = ProjectUpdateSchema.parse(body);
      const userId = c.get("user")?.id;

      // Verify user has admin/owner role in project's organization
      const project = await prisma.project.findFirst({
        where: {
          id,
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
        return c.json({
          code: "ACCESS_DENIED",
          message: "Project not found or insufficient permissions"
        }, 403);
      }

      // If updating jobNumber, check for uniqueness
      if (updates.jobNumber && updates.jobNumber !== project.jobNumber) {
        const existingProject = await prisma.project.findFirst({
          where: {
            organizationId: project.organizationId,
            jobNumber: updates.jobNumber,
            NOT: { id },
          },
        });

        if (existingProject) {
          return c.json({
              code: "DUPLICATE_JOB_NUMBER",
              message: "Job number already exists", 
              details: `Job number ${updates.jobNumber} is already in use within this organization` 
            }, 
            409
          );
        }
      }

      const updatedProject = await prisma.project.update({
        where: { id },
        data: updates,
        include: {
          organization: {
            select: { id: true, name: true, slug: true },
          },
          creator: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          projectId: id,
          userId,
          entityType: "Project",
          entityId: id,
          action: "UPDATE",
          changes: Object.keys(updates).reduce((acc, key) => {
            acc[key] = {
              old: (project as any)[key],
              new: (updates as any)[key],
            };
            return acc;
          }, {} as any),
        },
      });

      return c.json(updatedProject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({
          code: "INVALID_INPUT",
          message: "Invalid input",
          details: error.errors
        }, 400);
      }
      console.error("Project update error:", error);
      return c.json({
        code: "INTERNAL_ERROR",
        message: "Failed to update project",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 500);
    }
  })

  // Delete project (archive)
  .delete("/:id", async (c) => {
    try {
      const id = c.req.param("id");
      const userId = c.get("user")?.id;

      // Only organization owners can delete projects
      const project = await prisma.project.findFirst({
        where: {
          id,
          organization: {
            members: {
              some: {
                userId,
                role: "owner",
              },
            },
          },
        },
      });

      if (!project) {
        return c.json({
          code: "ACCESS_DENIED",
          message: "Project not found or insufficient permissions"
        }, 403);
      }

      // Archive instead of hard delete
      const archivedProject = await prisma.project.update({
        where: { id },
        data: { status: ProjectStatus.ARCHIVED },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          projectId: id,
          userId,
          entityType: "Project",
          entityId: id,
          action: "DELETE",
          changes: {
            status: {
              old: project.status,
              new: ProjectStatus.ARCHIVED,
            },
          },
        },
      });

      return c.json({ success: true, project: archivedProject });
    } catch (error) {
      console.error("Project archive error:", error);
      return c.json({
        code: "INTERNAL_ERROR",
        message: "Failed to archive project",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 500);
    }
  })

  // Get project statistics
  .get("/:id/stats", async (c) => {
    try {
      const id = c.req.param("id");
      const userId = c.get("user")?.id;
      
      if (!userId) {
        return c.json({
          code: "UNAUTHENTICATED",
          message: "User not authenticated"
        }, 401);
      }

      // Verify user has access to the project
      const project = await prisma.project.findFirst({
        where: {
          id,
          organization: {
            members: {
              some: { userId },
            },
          },
        },
      });

      if (!project) {
        return c.json({
          code: "ACCESS_DENIED",
          message: "Project not found or access denied"
        }, 403);
      }

      // Get comprehensive project statistics
      const [
        componentStats,
        drawingStats,
        milestoneTemplateStats,
        recentActivity,
        areaBreakdown,
        systemBreakdown,
        progressByWorkflowType,
        dailyProgress
      ] = await Promise.all([
        // Component statistics
        prisma.component.aggregate({
          where: { projectId: id, status: { not: "DELETED" } },
          _count: true,
          _avg: { completionPercent: true },
        }),

        // Drawing statistics
        prisma.drawing.aggregate({
          where: { projectId: id },
          _count: true,
        }),

        // Milestone template statistics
        prisma.milestoneTemplate.aggregate({
          where: { projectId: id },
          _count: true,
        }),

        // Recent activity count
        prisma.auditLog.count({
          where: {
            projectId: id,
            timestamp: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
        }),

        // Area breakdown with progress
        prisma.component.groupBy({
          by: ["area"],
          where: { projectId: id, area: { not: null }, status: { not: "DELETED" } },
          _count: true,
          _avg: { completionPercent: true },
          orderBy: { _count: { area: "desc" } },
        }),

        // System breakdown with progress
        prisma.component.groupBy({
          by: ["system"],
          where: { projectId: id, system: { not: null }, status: { not: "DELETED" } },
          _count: true,
          _avg: { completionPercent: true },
          orderBy: { _count: { system: "desc" } },
        }),

        // Progress by workflow type
        prisma.component.groupBy({
          by: ["workflowType"],
          where: { projectId: id, status: { not: "DELETED" } },
          _count: true,
          _avg: { completionPercent: true },
        }),

        // Daily progress over last 30 days
        prisma.auditLog.groupBy({
          by: ["timestamp"],
          where: {
            projectId: id,
            action: "UPDATE",
            timestamp: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
          _count: true,
        }),
      ]);

      // Status breakdown
      const statusBreakdown = await prisma.component.groupBy({
        by: ["status"],
        where: { projectId: id, status: { not: "DELETED" } },
        _count: true,
      });

      // Type breakdown
      const typeBreakdown = await prisma.component.groupBy({
        by: ["type"],
        where: { projectId: id, status: { not: "DELETED" } },
        _count: true,
        _avg: { completionPercent: true },
        orderBy: { _count: { type: "desc" } },
      });

      return c.json({
        overview: {
          totalComponents: componentStats._count,
          totalDrawings: drawingStats._count,
          totalMilestoneTemplates: milestoneTemplateStats._count,
          averageCompletion: componentStats._avg.completionPercent || 0,
          recentActivityCount: recentActivity,
        },
        breakdown: {
          byStatus: statusBreakdown.reduce((acc, curr) => {
            acc[curr.status] = curr._count;
            return acc;
          }, {} as Record<string, number>),
          byType: typeBreakdown.map(item => ({
            type: item.type,
            count: item._count,
            averageCompletion: item._avg.completionPercent || 0,
          })),
          byArea: areaBreakdown.map(item => ({
            area: item.area,
            count: item._count,
            averageCompletion: item._avg.completionPercent || 0,
          })),
          bySystem: systemBreakdown.map(item => ({
            system: item.system,
            count: item._count,
            averageCompletion: item._avg.completionPercent || 0,
          })),
          byWorkflowType: progressByWorkflowType.map(item => ({
            workflowType: item.workflowType,
            count: item._count,
            averageCompletion: item._avg.completionPercent || 0,
          })),
        },
        trends: {
          dailyActivity: dailyProgress.map(item => ({
            date: item.timestamp,
            activityCount: item._count,
          })),
        },
      });
    } catch (error) {
      console.error("Project statistics error:", error);
      return c.json({
        code: "INTERNAL_ERROR",
        message: "Failed to fetch project statistics",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 500);
    }
  })

  // Get project activity/audit log
  .get("/:id/activity", async (c) => {
    try {
      const id = c.req.param("id");
      const userId = c.get("user")?.id;
      const limit = parseInt(c.req.query("limit") || "50");
      const offset = parseInt(c.req.query("offset") || "0");

      if (!userId) {
        return c.json({
          code: "UNAUTHENTICATED",
          message: "User not authenticated"
        }, 401);
      }

      // Verify user has access to the project
      const project = await prisma.project.findFirst({
        where: {
          id,
          organization: {
            members: {
              some: { userId },
            },
          },
        },
      });

      if (!project) {
        return c.json({
          code: "ACCESS_DENIED",
          message: "Project not found or access denied"
        }, 403);
      }

      const [activity, total] = await Promise.all([
        prisma.auditLog.findMany({
          where: { projectId: id },
          orderBy: { timestamp: "desc" },
          take: limit,
          skip: offset,
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
            component: {
              select: { id: true, componentId: true, displayId: true },
            },
          },
        }),
        prisma.auditLog.count({ where: { projectId: id } }),
      ]);

      return c.json({
        data: activity,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      });
    } catch (error) {
      console.error("Project activity fetch error:", error);
      return c.json({
        code: "INTERNAL_ERROR",
        message: "Failed to fetch project activity",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 500);
    }
  });