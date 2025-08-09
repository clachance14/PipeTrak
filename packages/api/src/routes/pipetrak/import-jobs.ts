import { db as prisma } from "@repo/database";
import { z } from "zod";
import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth";
import { ImportStatus } from "@repo/database/prisma/generated/client";

const ImportJobCreateSchema = z.object({
  projectId: z.string(),
  filename: z.string(),
  originalPath: z.string().optional(),
});

export const importJobsRouter = new Hono()
  .use("*", authMiddleware)
  
  // Get import jobs for a project
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

      const jobs = await prisma.importJob.findMany({
        where: { projectId },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return c.json(jobs);
    } catch (error) {
      return c.json({ error: "Failed to fetch import jobs" }, 500);
    }
  })

  // Create import job
  .post("/", async (c) => {
    try {
      const body = await c.req.json();
      const data = ImportJobCreateSchema.parse(body);
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

      const job = await prisma.importJob.create({
        data: {
          ...data,
          status: ImportStatus.PENDING,
          userId,
        },
      });

      // TODO: Trigger background job to process import

      return c.json(job, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ error: "Invalid input", details: error.errors }, 400);
      }
      return c.json({ error: "Failed to create import job" }, 500);
    }
  })

  // Process import job
  .post("/:id/process", async (c) => {
    try {
      const id = c.req.param("id");
      const userId = c.get("user")?.id;

      // Get import job
      const job = await prisma.importJob.findFirst({
        where: {
          id,
          status: ImportStatus.PENDING,
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

      if (!job) {
        return c.json({ error: "Import job not found or already processed" }, 403);
      }

      // Update status to processing
      await prisma.importJob.update({
        where: { id },
        data: {
          status: ImportStatus.PROCESSING,
          startedAt: new Date(),
        },
      });

      // Process the import data
      // TODO: Get import data from file storage or request body
      const importData = { components: [] } as any;
      let successCount = 0;
      let errorCount = 0;
      const errors: any[] = [];

      for (const componentData of importData.components) {
        try {
          // Insert or update component
          await prisma.component.upsert({
            where: {
              projectId_componentId: {
                projectId: job.projectId,
                componentId: componentData.componentId,
              },
            },
            create: {
              projectId: job.projectId,
              ...componentData,
            },
            update: componentData,
          });
          successCount++;
        } catch (error: any) {
          errorCount++;
          errors.push({
            componentId: componentData.componentId,
            error: error.message,
          });
        }
      }

      // Update job status
      const finalStatus = 
        errorCount === 0 ? ImportStatus.COMPLETED : ImportStatus.FAILED;

      await prisma.importJob.update({
        where: { id },
        data: {
          status: finalStatus,
          completedAt: new Date(),
          processedRows: successCount + errorCount,
          errorRows: errorCount,
          errors: errors.length > 0 ? errors : null,
        },
      });

      return c.json({
        jobId: id,
        status: finalStatus,
        successCount,
        errorCount,
        errors,
      });
    } catch (error) {
      return c.json({ error: "Failed to process import job" }, 500);
    }
  });