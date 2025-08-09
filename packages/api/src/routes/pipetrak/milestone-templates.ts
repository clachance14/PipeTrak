import { db as prisma } from "@repo/database";
import { z } from "zod";
import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth";

const MilestoneTemplateCreateSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  milestones: z.array(z.object({
    name: z.string(),
    weight: z.number().min(0).max(100),
    order: z.number(),
  })),
  isDefault: z.boolean().default(false),
});

export const milestoneTemplatesRouter = new Hono()
  .use("*", authMiddleware)
  
  // Get milestone templates for a project
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

      const templates = await prisma.milestoneTemplate.findMany({
        where: { projectId },
        orderBy: [{ isDefault: "desc" }, { name: "asc" }],
      });

      return c.json(templates);
    } catch (error) {
      return c.json({ error: "Failed to fetch milestone templates" }, 500);
    }
  })

  // Create milestone template
  .post("/", async (c) => {
    try {
      const body = await c.req.json();
      const data = MilestoneTemplateCreateSchema.parse(body);
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

      const template = await prisma.milestoneTemplate.create({
        data,
      });

      return c.json(template, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ error: "Invalid input", details: error.errors }, 400);
      }
      return c.json({ error: "Failed to create milestone template" }, 500);
    }
  });