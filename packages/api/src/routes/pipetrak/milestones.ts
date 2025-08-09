import { db as prisma } from "@repo/database";
import { z } from "zod";
import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth";

// Milestone update schemas
const MilestoneUpdateSchema = z.object({
  componentId: z.string(),
  milestoneName: z.string(),
  isCompleted: z.boolean().optional(),
  percentageValue: z.number().min(0).max(100).optional(),
  quantityValue: z.number().min(0).optional(),
});

const BulkMilestoneUpdateSchema = z.object({
  updates: z.array(MilestoneUpdateSchema),
});

export const milestonesRouter = new Hono()
  .use("*", authMiddleware)

  // Get milestones for a component
  .get("/component/:componentId", async (c) => {
    try {
      const componentId = c.req.param("componentId");
      const userId = c.get("user")?.id;

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
      });

      if (!component) {
        return c.json({ error: "Component not found or access denied" }, 403);
      }

      const milestones = await prisma.componentMilestone.findMany({
        where: { componentId },
        orderBy: { milestoneOrder: "asc" },
        include: {
          completer: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return c.json(milestones);
    } catch (error) {
      return c.json({ error: "Failed to fetch milestones" }, 500);
    }
  })

  // Update single milestone
  .patch("/:id", async (c) => {
    try {
      const id = c.req.param("id");
      const body = await c.req.json();
      const userId = c.get("user")?.id;
      
      if (!userId) {
        return c.json({ error: "User not authenticated" }, 401);
      }

      // Get existing milestone with component info
      const existing = await prisma.componentMilestone.findFirst({
        where: { id },
        include: {
          component: {
            include: {
              project: true,
            },
          },
        },
      });

      if (!existing) {
        return c.json({ error: "Milestone not found" }, 404);
      }

      // Verify user has access
      const hasAccess = await prisma.member.findFirst({
        where: {
          userId,
          organizationId: existing.component.project.organizationId,
        },
      });

      if (!hasAccess) {
        return c.json({ 
          error: `User is not a member of organization ${existing.component.project.organization?.name || existing.component.project.organizationId}`,
          organizationId: existing.component.project.organizationId
        }, 403);
      }

      // Prepare update data based on workflow type
      const updateData: any = {};
      const workflowType = existing.component.workflowType;

      if (workflowType === "MILESTONE_DISCRETE" && "isCompleted" in body) {
        updateData.isCompleted = body.isCompleted;
        if (body.isCompleted) {
          updateData.completedAt = new Date();
          updateData.completedBy = userId;
        } else {
          updateData.completedAt = null;
          updateData.completedBy = null;
        }
      } else if (workflowType === "MILESTONE_PERCENTAGE" && "percentageValue" in body) {
        updateData.percentageComplete = body.percentageValue;
        updateData.isCompleted = body.percentageValue >= 100;
        if (updateData.isCompleted) {
          updateData.completedAt = new Date();
          updateData.completedBy = userId;
        } else {
          updateData.completedAt = null;
          updateData.completedBy = null;
        }
      } else if (workflowType === "MILESTONE_QUANTITY" && "quantityValue" in body) {
        updateData.quantityComplete = body.quantityValue;
        updateData.isCompleted = body.quantityValue >= (existing.quantityTotal || 0);
        if (updateData.isCompleted) {
          updateData.completedAt = new Date();
          updateData.completedBy = userId;
        } else {
          updateData.completedAt = null;
          updateData.completedBy = null;
        }
      } else {
        return c.json({ error: "Invalid update for workflow type" }, 400);
      }

      // Update milestone
      const milestone = await prisma.componentMilestone.update({
        where: { id },
        data: updateData,
        include: {
          completer: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Recalculate component completion
      await recalculateComponentCompletion(existing.componentId);

      // Create audit log
      await prisma.auditLog.create({
        data: {
          projectId: existing.component.projectId,
          userId,
          entityType: "component_milestone",
          entityId: id,
          action: "UPDATE",
          changes: Object.keys(updateData).reduce((acc, key) => {
            acc[key] = {
              old: (existing as any)[key],
              new: (milestone as any)[key],
            };
            return acc;
          }, {} as any),
        },
      });

      return c.json(milestone);
    } catch (error) {
      return c.json({ error: "Failed to update milestone" }, 500);
    }
  })

  // Bulk update milestones
  .post("/bulk-update", async (c) => {
    try {
      const body = await c.req.json();
      const { updates } = BulkMilestoneUpdateSchema.parse(body);
      const userId = c.get("user")?.id;
      
      if (!userId) {
        return c.json({ error: "User not authenticated" }, 401);
      }

      const results = [];
      const componentIds = new Set<string>();

      for (const update of updates) {
        // Find milestone by component and name
        const milestone = await prisma.componentMilestone.findFirst({
          where: {
            componentId: update.componentId,
            milestoneName: update.milestoneName,
          },
          include: {
            component: {
              include: {
                project: true,
              },
            },
          },
        });

        if (!milestone) {
          results.push({
            componentId: update.componentId,
            milestoneName: update.milestoneName,
            error: "Milestone not found",
          });
          continue;
        }

        // Verify user has access
        const hasAccess = await prisma.member.findFirst({
          where: {
            userId,
            organizationId: milestone.component.project.organizationId,
          },
        });

        if (!hasAccess) {
          results.push({
            componentId: update.componentId,
            milestoneName: update.milestoneName,
            error: `User is not a member of organization ${milestone.component.project.organization?.name || milestone.component.project.organizationId}`,
          });
          continue;
        }

        // Prepare update data based on workflow type
        const updateData: any = {};
        const workflowType = milestone.component.workflowType;

        if (workflowType === "MILESTONE_DISCRETE" && update.isCompleted !== undefined) {
          updateData.isCompleted = update.isCompleted;
          if (update.isCompleted) {
            updateData.completedAt = new Date();
            updateData.completedBy = userId;
          } else {
            updateData.completedAt = null;
            updateData.completedBy = null;
          }
        } else if (workflowType === "MILESTONE_PERCENTAGE" && update.percentageValue !== undefined) {
          updateData.percentageComplete = update.percentageValue;
          updateData.isCompleted = update.percentageValue >= 100;
          if (updateData.isCompleted) {
            updateData.completedAt = new Date();
            updateData.completedBy = userId;
          } else {
            updateData.completedAt = null;
            updateData.completedBy = null;
          }
        } else if (workflowType === "MILESTONE_QUANTITY" && update.quantityValue !== undefined) {
          updateData.quantityComplete = update.quantityValue;
          updateData.isCompleted = update.quantityValue >= (milestone.quantityTotal || 0);
          if (updateData.isCompleted) {
            updateData.completedAt = new Date();
            updateData.completedBy = userId;
          } else {
            updateData.completedAt = null;
            updateData.completedBy = null;
          }
        } else {
          results.push({
            componentId: update.componentId,
            milestoneName: update.milestoneName,
            error: "Invalid update for workflow type",
          });
          continue;
        }

        // Update milestone
        const updatedMilestone = await prisma.componentMilestone.update({
          where: { id: milestone.id },
          data: updateData,
        });

        componentIds.add(update.componentId);

        // Create audit log
        await prisma.auditLog.create({
          data: {
            projectId: milestone.component.projectId,
            userId,
            entityType: "component_milestone",
            entityId: milestone.id,
            action: "UPDATE",
            changes: Object.keys(updateData).reduce((acc, key) => {
              acc[key] = {
                old: (milestone as any)[key],
                new: (updatedMilestone as any)[key],
              };
              return acc;
            }, {} as any),
          },
        });

        results.push({
          componentId: update.componentId,
          milestoneName: update.milestoneName,
          success: true,
          milestone: updatedMilestone,
        });
      }

      // Recalculate completion for all affected components
      for (const componentId of componentIds) {
        await recalculateComponentCompletion(componentId);
      }

      return c.json({
        results,
        totalUpdated: results.filter(r => r.success).length,
        totalFailed: results.filter(r => r.error).length,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ error: "Invalid input", details: error.errors }, 400);
      }
      return c.json({ error: "Failed to update milestones" }, 500);
    }
  })

  // Get milestone statistics for a project
  .get("/stats/:projectId", async (c) => {
    try {
      const projectId = c.req.param("projectId");
      const userId = c.get("user")?.id;

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
        return c.json({ error: "Project not found or access denied" }, 403);
      }

      // Get milestone statistics
      const milestoneStats = await prisma.$queryRaw`
        SELECT 
          cm.milestoneName,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE cm.isCompleted = true) as completed,
          AVG(cm.percentageComplete) as avgPercentage
        FROM component_milestone cm
        JOIN component c ON cm.componentId = c.id
        WHERE c.projectId = ${projectId}
        GROUP BY cm.milestoneName
        ORDER BY MIN(cm.milestoneOrder)
      `;

      const recentUpdates = await prisma.componentMilestone.findMany({
        where: {
          component: { projectId },
          completedAt: { not: null },
        },
        orderBy: { completedAt: "desc" },
        take: 20,
        include: {
          component: {
            select: { id: true, componentId: true, type: true },
          },
          completer: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return c.json({
        milestoneStats,
        recentUpdates,
      });
    } catch (error) {
      return c.json({ error: "Failed to fetch milestone statistics" }, 500);
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
      const weight = milestoneData[milestone.milestoneOrder]?.weight || 1;
      totalWeight += weight;
      if (milestone.isCompleted) {
        completedWeight += weight;
      }
    });

    completionPercent = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;

  } else if (component.workflowType === "MILESTONE_PERCENTAGE") {
    // Average the percentages with weights
    let totalWeight = 0;
    let weightedSum = 0;

    component.milestones.forEach((milestone) => {
      const weight = milestoneData[milestone.milestoneOrder]?.weight || 1;
      totalWeight += weight;
      weightedSum += (milestone.percentageComplete || 0) * weight;
    });

    completionPercent = totalWeight > 0 ? weightedSum / totalWeight : 0;

  } else if (component.workflowType === "MILESTONE_QUANTITY") {
    // Calculate based on quantities with weights
    let totalWeight = 0;
    let weightedSum = 0;

    component.milestones.forEach((milestone) => {
      const weight = milestoneData[milestone.milestoneOrder]?.weight || 1;
      totalWeight += weight;
      if (milestone.quantityTotal && milestone.quantityTotal > 0) {
        const percentage = ((milestone.quantityComplete || 0) / milestone.quantityTotal) * 100;
        weightedSum += percentage * weight;
      }
    });

    completionPercent = totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  // Ensure completion is between 0 and 100
  completionPercent = Math.min(Math.max(completionPercent, 0), 100);

  // Update component status based on completion
  const status = 
    completionPercent === 0 ? "NOT_STARTED" :
    completionPercent < 100 ? "IN_PROGRESS" :
    "COMPLETED";

  await prisma.component.update({
    where: { id: componentId },
    data: {
      completionPercent,
      status,
    },
  });
}