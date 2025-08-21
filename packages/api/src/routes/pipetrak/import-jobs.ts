import { db as prisma } from "@repo/database";
import { z } from "zod";
import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth";
import { ImportStatus, ComponentType } from "@repo/database/prisma/generated/client";
import { broadcastImportProgress } from "./realtime";
import { 
  CSVProcessor, 
  ExcelProcessor, 
  ColumnMapper, 
  DataValidator, 
  InstanceTracker, 
  BatchProcessor, 
  TemplateResolver 
} from "../../lib/file-processing";

const ImportJobCreateSchema = z.object({
  projectId: z.string(),
  filename: z.string(),
  originalPath: z.string().optional(),
});

const FileUploadSchema = z.object({
  projectId: z.string(),
});

const ProcessImportSchema = z.object({
  mappings: z.array(z.object({
    sourceColumn: z.string(),
    targetField: z.string(),
    required: z.boolean().optional(),
  })),
  options: z.object({
    skipRows: z.number().optional(),
    maxRows: z.number().optional(),
    rollbackOnError: z.boolean().optional(),
    updateExisting: z.boolean().optional(),
    batchSize: z.number().optional(),
  }).optional(),
});

export const importJobsRouter = new Hono()
  .use("*", authMiddleware)
  
  // Note: Upload endpoint moved to Next.js API route at /app/api/pipetrak/import/upload/route.ts
  // for better FormData handling

  // Validate import data
  .post("/validate", async (c) => {
    try {
      const userId = c.get("user")?.id;
      const body = await c.req.json();
      
      const { uploadId, fileData, mappings, options } = body;
      
      if (!fileData || !mappings) {
        return c.json({ error: "File data and mappings are required" }, 400);
      }

      // Verify user has access to project
      const project = await prisma.project.findFirst({
        where: {
          id: fileData.projectId,
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

      // Convert base64 back to buffer
      const buffer = Buffer.from(fileData.buffer, 'base64');
      
      // Parse file completely
      let parseResult;
      if (fileData.mimetype === 'text/csv') {
        const processor = new CSVProcessor(options);
        parseResult = await processor.parseCSV(buffer);
      } else {
        const processor = new ExcelProcessor(options);
        parseResult = await processor.parseExcel(buffer);
      }

      // Get validation context - use drawing numbers for validation
      const existingDrawings = new Set(
        (await prisma.drawing.findMany({
          where: { projectId: fileData.projectId },
          select: { number: true },
        })).map(d => d.number)
      );

      const existingTemplates = new Set(
        (await prisma.milestoneTemplate.findMany({
          where: { projectId: fileData.projectId },
          select: { id: true },
        })).map(t => t.id)
      );

      // Validate the data
      const validator = new DataValidator();
      const validation = await validator.validateComponentData(
        parseResult.rows,
        mappings,
        {
          projectId: fileData.projectId,
          existingDrawings,
          existingTemplates,
        }
      );

      // Format preview data to match frontend expectations
      const previewData = validation.validRows.slice(0, 10).map((validRow, index) => ({
        rowNumber: index + 1,
        data: validRow,
        errors: [], // Valid rows have no errors
        warnings: validation.warnings.filter(w => w.row === index + 1) // Match warnings by row
      }));

      // Format errors to match frontend structure
      const formattedErrors = validation.errors.map(error => ({
        row: error.row,
        field: error.field,
        value: error.value,
        message: error.error, // Map 'error' field to 'message'
        severity: 'error'
      }));

      return c.json({
        isValid: validation.isValid,
        totalRows: parseResult.rows.length,
        validRows: validation.validRows.length,
        errorRows: validation.invalidRows.length,
        warningRows: validation.warnings.length,
        errors: formattedErrors,
        warnings: validation.warnings,
        preview: previewData,
      });
    } catch (error: any) {
      console.error("Validation error:", error);
      return c.json({ error: `Failed to validate data: ${error.message}` }, 500);
    }
  })

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

  // Create and start import job
  .post("/", async (c) => {
    try {
      const body = await c.req.json();
      const { projectId, filename, fileData, mappings, options } = body;
      const userId = c.get("user")?.id;

      // Verify user has admin access
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
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

      // Create import job
      const job = await prisma.importJob.create({
        data: {
          projectId,
          filename,
          status: ImportStatus.PENDING,
          userId,
        },
      });

      // Start background processing
      processImportJob(job.id, { 
        ...fileData,
        projectId,
        userId 
      }, mappings, options || {})
        .catch(async error => {
          console.error(`Import job ${job.id} failed:`, error);
          // Update job status to FAILED when background processing fails
          try {
            await prisma.importJob.update({
              where: { id: job.id },
              data: {
                status: ImportStatus.FAILED,
                completedAt: new Date(),
                errors: [{
                  error: error.message || 'Unknown error',
                  details: error.stack,
                  timestamp: new Date()
                }]
              }
            });
          } catch (updateError) {
            console.error(`Failed to update job ${job.id} status:`, updateError);
          }
        });

      return c.json({
        id: job.id,
        status: job.status,
        filename: job.filename,
        createdAt: job.createdAt,
      }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ error: "Invalid input", details: error.errors }, 400);
      }
      console.error("Create import job error:", error);
      return c.json({ error: "Failed to create import job" }, 500);
    }
  })

  // Get specific import job
  .get("/:id", async (c) => {
    try {
      const id = c.req.param("id");
      const userId = c.get("user")?.id;

      console.log(`[API] GET /api/pipetrak/import/${id} - User: ${userId}`);

      const job = await prisma.importJob.findFirst({
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
        },
      });

      if (!job) {
        console.log(`[API] Import job ${id} not found for user ${userId}`);
        return c.json({ error: "Import job not found" }, 404);
      }

      console.log(`[API] Found import job ${id} with status: ${job.status}`);
      return c.json(job);
    } catch (error) {
      console.error(`[API] Error fetching import job ${c.req.param("id")}:`, error);
      return c.json({ error: "Failed to fetch import job" }, 500);
    }
  })

  // Clean up stuck jobs (admin only)
  .post("/cleanup-stuck", async (c) => {
    try {
      const userId = c.get("user")?.id;
      
      // For now, allow any authenticated user - in production, restrict to admins
      if (!userId) {
        return c.json({ error: "Authentication required" }, 401);
      }

      // Find jobs stuck in PROCESSING for more than 10 minutes
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      
      const stuckJobs = await prisma.importJob.findMany({
        where: {
          status: ImportStatus.PROCESSING,
          startedAt: {
            lt: tenMinutesAgo,
          },
        },
        include: {
          project: {
            include: {
              organization: {
                include: {
                  members: {
                    where: { userId },
                  },
                },
              },
            },
          },
        },
      });

      // Filter jobs the user has access to
      const accessibleStuckJobs = stuckJobs.filter(job => 
        job.project.organization.members.length > 0
      );

      if (accessibleStuckJobs.length === 0) {
        return c.json({ 
          message: "No stuck jobs found",
          cleaned: 0 
        });
      }

      // Update stuck jobs to FAILED
      const updatePromises = accessibleStuckJobs.map(job =>
        prisma.importJob.update({
          where: { id: job.id },
          data: {
            status: ImportStatus.FAILED,
            completedAt: new Date(),
            errors: [{
              error: "Job timed out and was automatically cleaned up",
              timestamp: new Date(),
              details: "Job was stuck in PROCESSING status for more than 10 minutes",
            }],
          },
        })
      );

      await Promise.all(updatePromises);

      console.log(`Cleaned up ${accessibleStuckJobs.length} stuck import jobs by user ${userId}`);

      return c.json({
        message: `Cleaned up ${accessibleStuckJobs.length} stuck import jobs`,
        cleaned: accessibleStuckJobs.length,
        jobIds: accessibleStuckJobs.map(job => job.id),
      });
    } catch (error) {
      console.error("Failed to cleanup stuck jobs:", error);
      return c.json({ error: "Failed to cleanup stuck jobs" }, 500);
    }
  })

  // Download error report
  .get("/:id/errors", async (c) => {
    try {
      const id = c.req.param("id");
      const userId = c.get("user")?.id;

      const job = await prisma.importJob.findFirst({
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

      if (!job) {
        return c.json({ error: "Import job not found" }, 404);
      }

      if (!job.errors || job.errors.length === 0) {
        return c.json({ error: "No errors found for this import job" }, 404);
      }

      // Generate CSV error report
      const errors = job.errors as any[];
      const csvHeaders = ['Row', 'Component ID', 'Field', 'Error', 'Value'];
      const csvRows = errors.map(error => [
        error.componentId || '',
        error.field || '',
        error.error || '',
        String(error.value || ''),
      ]);

      const csvData = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      c.header('Content-Type', 'text/csv');
      c.header('Content-Disposition', `attachment; filename="import-errors-${job.id}.csv"`);
      return c.text(csvData);
    } catch (error) {
      return c.json({ error: "Failed to generate error report" }, 500);
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
      const updatedJob = await prisma.importJob.update({
        where: { id },
        data: {
          status: ImportStatus.PROCESSING,
          startedAt: new Date(),
        },
      });

      // Broadcast import started
      await broadcastImportProgress(
        job.projectId,
        id,
        {
          status: ImportStatus.PROCESSING,
          filename: job.filename,
        },
        userId
      );

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

      const finalJob = await prisma.importJob.update({
        where: { id },
        data: {
          status: finalStatus,
          completedAt: new Date(),
          processedRows: successCount + errorCount,
          errorRows: errorCount,
          errors: errors.length > 0 ? errors : null,
        },
      });

      // Broadcast import completion
      await broadcastImportProgress(
        job.projectId,
        id,
        {
          status: finalStatus,
          filename: job.filename,
          processedRows: successCount + errorCount,
          totalRows: successCount + errorCount,
          errorRows: errorCount,
        },
        userId
      );

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

// Helper function to convert string type to ComponentType enum
function convertToComponentType(typeString: string): ComponentType {
  const normalizedType = typeString?.toUpperCase();
  
  // Check if the normalized type exists in ComponentType enum
  if (Object.values(ComponentType).includes(normalizedType as ComponentType)) {
    return normalizedType as ComponentType;
  }
  
  // If not found, default to OTHER
  console.warn(`Unknown component type "${typeString}", defaulting to OTHER`);
  return ComponentType.OTHER;
}

// Background processing function
async function processImportJob(
  jobId: string,
  uploadData: any,
  mappings: any[],
  options: any
) {
  const jobStartTime = Date.now();
  const MAX_PROCESSING_TIME = 5 * 60 * 1000; // Reduced to 5 minutes
  
  // Set up timeout to ensure job doesn't hang indefinitely
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Import job timed out after ${MAX_PROCESSING_TIME / 1000} seconds`));
    }, MAX_PROCESSING_TIME);
  });
  
  try {
    // Wrap the entire import process in a timeout
    await Promise.race([
      processImportJobInternal(jobId, uploadData, mappings, options, jobStartTime, MAX_PROCESSING_TIME),
      timeoutPromise
    ]);
  } catch (error: any) {
    console.error(`Import job ${jobId}: Fatal error during processing:`, {
      error: error.message,
      stack: error.stack,
      processingTime: Date.now() - jobStartTime,
    });
    
    // Determine error type for better user feedback
    let userFriendlyMessage = error.message;
    if (error.message.includes('timeout')) {
      userFriendlyMessage = `Import timed out after processing for ${Math.round((Date.now() - jobStartTime) / 1000)} seconds. Please try importing smaller batches or contact support if the issue persists.`;
    } else if (error.message.includes('instanceNumber')) {
      userFriendlyMessage = 'There was an issue with component instance calculations. This may be caused by duplicate components in your import file. Please review your data and try again.';
    } else if (error.message.includes('validation')) {
      userFriendlyMessage = 'Data validation failed. Please check your import file format and ensure all required fields are present.';
    } else if (error.message.includes('connection pool')) {
      userFriendlyMessage = 'Database connection issue. Please try importing smaller batches or try again in a few minutes.';
    }
    
    // Always update job status to failed, even if update fails
    try {
      await prisma.importJob.update({
        where: { id: jobId },
        data: {
          status: ImportStatus.FAILED,
          completedAt: new Date(),
          errors: [{
            error: userFriendlyMessage,
            originalError: error.message,
            timestamp: new Date(),
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            processingTimeMs: Date.now() - jobStartTime,
          }],
        },
      });
      
      // Broadcast failure to frontend
      await broadcastImportProgress(
        uploadData.projectId,
        jobId,
        {
          status: ImportStatus.FAILED,
          filename: uploadData.originalName,
          errorMessage: userFriendlyMessage,
          completed: true,
        },
        uploadData.userId
      );
    } catch (updateError) {
      console.error(`Import job ${jobId}: Failed to update job status to FAILED:`, updateError);
      // This is critical - job will be stuck in PROCESSING if this fails
    }
    
    throw error;
  }
}

// Split the main processing logic into a separate function
async function processImportJobInternal(
  jobId: string,
  uploadData: any,
  mappings: any[],
  options: any,
  jobStartTime: number,
  MAX_PROCESSING_TIME: number
) {
  try {
    // Update job status to processing
    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: ImportStatus.PROCESSING,
        startedAt: new Date(),
      },
    });
    
    console.log(`Import job ${jobId}: Starting background processing with ${MAX_PROCESSING_TIME / 1000}s timeout`);

    // Broadcast import started
    await broadcastImportProgress(
      uploadData.projectId,
      jobId,
      {
        status: ImportStatus.PROCESSING,
        filename: uploadData.originalName,
      },
      uploadData.userId
    );

    // Convert base64 buffer back to Buffer
    const buffer = Buffer.from(uploadData.buffer, 'base64');
    
    // Re-parse the full file
    let rows: any[] = [];
    try {
      if (uploadData.mimetype.includes('csv')) {
        const csvProcessor = new CSVProcessor(options);
        const result = await csvProcessor.parseCSV(buffer);
        rows = result.rows;
      } else {
        const excelProcessor = new ExcelProcessor(options);
        const result = await excelProcessor.parseExcel(buffer);
        rows = result.rows;
      }
    } catch (parseError) {
      throw new Error(`Failed to parse file: ${parseError}`);
    }

    // Apply skip and max row limits
    const processRows = rows.slice(options.skipRows || 0, options.maxRows || 10000);
    
    // Extract unique drawing numbers from import data
    console.log(`Import job ${jobId}: Extracting drawing numbers from import data...`);
    const uniqueDrawingNumbers = new Set<string>();
    
    for (const row of processRows) {
      // Find the drawing ID column from mappings
      const drawingMapping = mappings.find(m => m.targetField === 'drawingId');
      if (drawingMapping && row[drawingMapping.sourceColumn]) {
        const drawingNumber = row[drawingMapping.sourceColumn].toString().trim();
        if (drawingNumber) {
          uniqueDrawingNumbers.add(drawingNumber);
        }
      }
    }
    
    console.log(`Import job ${jobId}: Found ${uniqueDrawingNumbers.size} unique drawing numbers`);
    
    // Get existing drawings and create missing ones in bulk
    const drawingNumberToIdMap = new Map<string, string>();
    
    // Get all existing drawings in one query
    const existingDrawings = await prisma.drawing.findMany({
      where: {
        projectId: uploadData.projectId,
        number: { in: Array.from(uniqueDrawingNumbers) }
      },
      select: { id: true, number: true }
    });
    
    // Build map from existing drawings
    existingDrawings.forEach(d => drawingNumberToIdMap.set(d.number, d.id));
    
    // Identify missing drawings
    const missingDrawings = Array.from(uniqueDrawingNumbers)
      .filter(num => !drawingNumberToIdMap.has(num))
      .map(number => ({
        projectId: uploadData.projectId,
        number,
        title: `Auto-created drawing ${number}`
      }));
    
    // Create all missing drawings in one bulk operation
    if (missingDrawings.length > 0) {
      const createdDrawings = await prisma.drawing.createManyAndReturn({
        data: missingDrawings
      });
      
      // Add newly created drawings to map
      createdDrawings.forEach(d => drawingNumberToIdMap.set(d.number, d.id));
      
      console.log(`Import job ${jobId}: Created ${createdDrawings.length} missing drawings in bulk`);
    }
    
    console.log(`Import job ${jobId}: Drawing number to ID mapping created with ${drawingNumberToIdMap.size} entries`);
    
    // Get validation context - pass drawing numbers for validation
    const existingDrawingNumbers = new Set(Array.from(drawingNumberToIdMap.keys()));

    const existingTemplates = new Set(
      (await prisma.milestoneTemplate.findMany({
        where: { projectId: uploadData.projectId },
        select: { id: true },
      })).map(t => t.id)
    );

    // Validate the data
    const validator = new DataValidator();
    const validation = await validator.validateComponentData(
      processRows,
      mappings,
      {
        projectId: uploadData.projectId,
        existingDrawings: existingDrawingNumbers,
        existingTemplates,
      }
    );

    if (!validation.isValid && options.rollbackOnError) {
      throw new Error(`Validation failed with ${validation.errors.length} errors`);
    }

    console.log(`Import job ${jobId}: Validation completed with ${validation.validRows.length} valid rows, ${validation.errors.length} errors`);
    
    // Debug: Check if we have valid rows
    if (validation.validRows.length === 0) {
      console.error(`Import job ${jobId}: CRITICAL - No valid rows after validation! This is likely the problem.`);
      console.error('Sample validation error (if any):', validation.errors[0]);
      console.error('Total raw rows processed:', processRows.length);
      throw new Error('No valid components found after validation');
    }
    
    // Get existing component instances for instance tracking - optimized query
    const existingComponents = new Map();
    let existingComponentData: any[] = [];
    
    try {
      console.log(`Import job ${jobId}: Fetching existing components for project ${uploadData.projectId}`);
      existingComponentData = await prisma.component.findMany({
        where: {
          projectId: uploadData.projectId,
          drawingId: { not: null }, // Only get components with drawings for instance tracking
        },
        select: {
          drawingId: true,
          componentId: true,
          size: true,
          instanceNumber: true,
        },
        // Add ordering to make query more predictable
        orderBy: [
          { drawingId: 'asc' },
          { componentId: 'asc' },
          { instanceNumber: 'asc' }
        ]
      });
      console.log(`Import job ${jobId}: Found ${existingComponentData.length} existing components`);
    } catch (existingError: any) {
      console.error(`Import job ${jobId}: Failed to fetch existing components:`, existingError.message);
      console.error('Error details:', existingError);
      // Continue with empty array - assume no existing components
      existingComponentData = [];
    }

    for (const comp of existingComponentData) {
      // Build map for instance tracking (drawingId already filtered to be non-null)
      const key = `${comp.drawingId}|${comp.componentId}|${comp.size || ''}`;
      if (!existingComponents.has(key)) {
        existingComponents.set(key, []);
      }
      existingComponents.get(key).push(comp);
    }
    
    console.log(`Import job ${jobId}: Built existing components map with ${existingComponents.size} unique drawing+component combinations`);

    // Ensure milestone templates exist and assign them to components
    console.log(`Import job ${jobId}: Ensuring milestone templates exist for project`);
    const templatesByName = await TemplateResolver.ensureTemplatesExist(uploadData.projectId);
    console.log(`Import job ${jobId}: Created/loaded ${templatesByName.size} templates:`, Array.from(templatesByName.keys()));
    
    if (!templatesByName || templatesByName.size === 0) {
      console.error(`Import job ${jobId}: CRITICAL - No templates created or found!`);
      throw new Error('No milestone templates available for project');
    }
    
    // Create templates Map keyed by ID for milestone creation
    const templatesById = new Map();
    for (const template of templatesByName.values()) {
      templatesById.set(template.id, template);
    }
    console.log(`Import job ${jobId}: Built templates by ID map with ${templatesById.size} templates`);
    
    // Assign templates to components that don't have them
    const componentsWithTemplates = validation.validRows.map(component => {
      if (!component.milestoneTemplateId) {
        const templateId = TemplateResolver.resolveTemplateForComponent(
          component.type,
          component.componentId,
          templatesByName
        );
        component.milestoneTemplateId = templateId;
      }
      return component;
    });
    
    // Convert drawing numbers to drawing IDs
    console.log(`Import job ${jobId}: Converting drawing numbers to drawing IDs...`);
    const failedDrawingMappings: string[] = [];
    const componentsWithDrawingIds = componentsWithTemplates.map(component => {
      if (component.drawingId) {
        const originalDrawingNumber = component.drawingId;
        const drawingId = drawingNumberToIdMap.get(component.drawingId);
        if (drawingId) {
          component.drawingId = drawingId;
        } else {
          console.warn(`Import job ${jobId}: Warning - no drawing ID found for drawing number: ${originalDrawingNumber}`);
          failedDrawingMappings.push(originalDrawingNumber);
          // Keep the original drawing number for now, will be caught in validation
        }
      }
      return component;
    });
    
    console.log(`Import job ${jobId}: Converted drawing numbers to IDs for ${componentsWithDrawingIds.length} components`);
    
    // Debug: Log conversion results
    if (failedDrawingMappings.length > 0) {
      console.warn(`Import job ${jobId}: Failed to map ${failedDrawingMappings.length} drawing numbers:`, failedDrawingMappings);
    }
    
    // Validate all components have valid drawing IDs
    const componentsWithoutDrawing = componentsWithDrawingIds.filter(component => 
      !component.drawingId || failedDrawingMappings.includes(component.drawingId)
    );
    
    if (componentsWithoutDrawing.length > 0) {
      const missingDrawings = [...new Set(componentsWithoutDrawing.map(c => c.drawingId || 'MISSING'))];
      const errorMessage = failedDrawingMappings.length > 0 
        ? `Import failed: The following drawing numbers could not be found in the project: ${failedDrawingMappings.join(', ')}. Please create these drawings first or verify the drawing numbers in your import file.`
        : `Import failed: ${componentsWithoutDrawing.length} components are missing drawing IDs. All components must be associated with a drawing.`;
      
      console.error(`Import job ${jobId}: ${errorMessage}`);
      
      // Update job status to failed with specific error
      await prisma.importJob.update({
        where: { id: jobId },
        data: { 
          status: ImportStatus.FAILED,
          errors: [{
            row: 0,
            field: 'drawingId',
            error: errorMessage,
            value: missingDrawings.join(', ')
          }]
        }
      });
      
      throw new Error(errorMessage);
    }
    
    // Process instance tracking
    console.log(`Import job ${jobId}: Starting instance tracking for ${componentsWithDrawingIds.length} valid rows`);
    
    const componentsWithInstances = await InstanceTracker.calculateInstanceNumbers(
      componentsWithDrawingIds,
      existingComponents
    );

    console.log(`Import job ${jobId}: Instance tracking completed. Processing ${componentsWithInstances.length} components with instances`);
    
    if (componentsWithInstances.length === 0) {
      console.error(`Import job ${jobId}: NO COMPONENTS TO PROCESS! This is the problem.`);
      console.error('Validation valid rows:', validation.validRows.length);
      console.error('Instance tracker returned empty array');
      console.error('Sample validation row:', validation.validRows[0]);
      throw new Error('No valid components to process after instance tracking');
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: any[] = [];

    // Process components in batches
    console.log(`Import job ${jobId}: Starting batch processing of ${componentsWithInstances.length} components`);
    
    // Use smaller batch sizes to prevent connection pool exhaustion and timeouts
    const hasFieldWelds = componentsWithInstances.some(c => c.type === 'FIELD_WELD');
    const batchSize = hasFieldWelds ? 5 : 20;
    
    console.log(`Import job ${jobId}: Using batch size ${batchSize} (has field welds: ${hasFieldWelds})`);
    
    await BatchProcessor.processInBatches(
      componentsWithInstances,
      async (batch) => {
        // Check if we've exceeded the maximum processing time
        if (Date.now() - jobStartTime > MAX_PROCESSING_TIME) {
          console.error(`Import job ${jobId}: Timeout exceeded (${MAX_PROCESSING_TIME / 1000}s), stopping processing`);
          throw new Error(`Import processing timed out after ${MAX_PROCESSING_TIME / 1000} seconds. This may indicate a problem with the import data or system performance.`);
        }
        
        const results: any[] = [];
        
        // Pre-validate field weld drawings and duplicates before transaction starts
        const fieldWeldComponents = batch.filter(comp => comp.type === 'FIELD_WELD');
        let missingDrawingIds: string[] = [];
        let existingFieldWelds: Set<string> = new Set();
        let duplicatedWeldIds: string[] = [];
        let existingComponentsByWeldId: Map<string, any> = new Map();
        
        if (fieldWeldComponents.length > 0) {
          const uniqueDrawingIds = [...new Set(fieldWeldComponents.map(fw => fw.drawingId))];
          
          const existingDrawings = await prisma.drawing.findMany({
            where: { id: { in: uniqueDrawingIds } },
            select: { id: true, number: true },
          });
          
          const existingDrawingIds = new Set(existingDrawings.map(d => d.id));
          missingDrawingIds = uniqueDrawingIds.filter(id => !existingDrawingIds.has(id));
          
          if (missingDrawingIds.length > 0) {
            console.log(`Import job ${jobId}: ${missingDrawingIds.length} missing drawings will be skipped`);
          }

          // Check for existing field welds AND components with weldIds to prevent duplicates
          const uniqueWeldIds = [...new Set(fieldWeldComponents.map(fw => fw.weldId || fw.componentId))];
          
          // Check for existing FieldWeld records
          const existingWelds = await prisma.fieldWeld.findMany({
            where: {
              projectId: uploadData.projectId,
              weldIdNumber: { in: uniqueWeldIds },
            },
            select: { weldIdNumber: true },
          });
          
          // Check for existing Component records with these weldIds
          const existingComponents = await prisma.component.findMany({
            where: {
              projectId: uploadData.projectId,
              weldId: { in: uniqueWeldIds },
            },
            select: { weldId: true, id: true, componentId: true },
          });
          
          existingFieldWelds = new Set(existingWelds.map(w => w.weldIdNumber));
          const existingComponentWeldIds = new Set(existingComponents.map(c => c.weldId).filter(Boolean));
          
          duplicatedWeldIds = uniqueWeldIds.filter(id => existingFieldWelds.has(id));
          const componentDuplicates = uniqueWeldIds.filter(id => existingComponentWeldIds.has(id));
          
          if (duplicatedWeldIds.length > 0) {
            console.log(`Import job ${jobId}: ${duplicatedWeldIds.length} existing field welds will be updated`);
          }
          
          if (componentDuplicates.length > 0) {
            console.log(`Import job ${jobId}: ${componentDuplicates.length} existing components with weldIds found`);
          }
          
          // Store component lookup for optimization
          existingComponentsByWeldId = new Map(
            existingComponents.map(c => [c.weldId, c])
          );
        }
        
        // Use optimized bulk processing with transaction
        await prisma.$transaction(async (tx) => {
          try {
            console.log(`Import job ${jobId}: Starting transaction for batch of ${batch.length} components`);
            
            // Pre-validate all components before processing
            const invalidComponents = [];
            for (const component of batch) {
              const instanceNumber = (component as any).instanceNumber;
              const totalInstances = (component as any).totalInstancesOnDrawing;
              
              if (instanceNumber && totalInstances && instanceNumber > totalInstances) {
                invalidComponents.push({
                  componentId: component.componentId,
                  instanceNumber,
                  totalInstances,
                  error: `Instance number ${instanceNumber} exceeds total instances ${totalInstances}`
                });
              }
              
              if (!component.drawingId) {
                invalidComponents.push({
                  componentId: component.componentId,
                  error: 'Missing drawingId'
                });
              }
              
              if (!component.milestoneTemplateId) {
                invalidComponents.push({
                  componentId: component.componentId,
                  error: 'Missing milestoneTemplateId'
                });
              }
            }
            
            if (invalidComponents.length > 0) {
              console.error(`Import job ${jobId}: Pre-validation failed for ${invalidComponents.length} components:`, invalidComponents);
              throw new Error(`Validation failed: ${invalidComponents.map(c => `${c.componentId}: ${c.error}`).join('; ')}`);
            }
            
            // Step 1: Separate components into new vs existing
            const existingComponentsMap = new Map();
            const newComponents = [];
            const existingComponents = [];
            
            // Check for existing components in bulk
            const existingComponentIds = await tx.component.findMany({
              where: {
                projectId: uploadData.projectId,
                drawingId: { in: batch.map(c => c.drawingId).filter(Boolean) },
                componentId: { in: batch.map(c => c.componentId) },
              },
              select: {
                id: true,
                componentId: true,
                drawingId: true,
                instanceNumber: true,
                milestoneTemplateId: true,
              }
            });
            
            // Build lookup map for existing components
            existingComponentIds.forEach(comp => {
              const key = `${comp.drawingId}|${comp.componentId}|${comp.instanceNumber}`;
              existingComponentsMap.set(key, comp);
            });
            
            // Categorize components
            for (const componentData of batch) {
              const key = `${componentData.drawingId}|${componentData.componentId}|${(componentData as any).instanceNumber || 1}`;
              
              // Ensure milestoneTemplateId is set
              if (!componentData.milestoneTemplateId) {
                const defaultTemplate = Array.from(templatesById.values())[0];
                componentData.milestoneTemplateId = defaultTemplate?.id;
                
                if (!componentData.milestoneTemplateId) {
                  throw new Error(`No milestone templates available for project ${uploadData.projectId}`);
                }
              }
              
              if (existingComponentsMap.has(key)) {
                existingComponents.push({
                  existing: existingComponentsMap.get(key),
                  data: componentData
                });
              } else {
                const { _quantityIndex, ...cleanComponentData } = componentData as any;
                newComponents.push({
                  ...cleanComponentData,
                  type: convertToComponentType(componentData.type),
                  projectId: uploadData.projectId,
                  displayId: (componentData as any).displayId,
                  instanceNumber: (componentData as any).instanceNumber || 1,
                  totalInstancesOnDrawing: (componentData as any).totalInstancesOnDrawing || 1,
                  status: "NOT_STARTED",
                  completionPercent: 0,
                });
              }
            }
            
            // Step 2: Separate field welds from regular components and create accordingly
            const createdComponents = [];
            
            // Separate field welds from regular components
            const regularComponents = newComponents.filter(comp => comp.type !== 'FIELD_WELD');
            const fieldWeldComponents = newComponents.filter(comp => comp.type === 'FIELD_WELD');
            
            // Bulk create regular components
            if (regularComponents.length > 0) {
              try {
                console.log(`Import job ${jobId}: Creating ${regularComponents.length} regular components`);
                
                // Additional validation before Prisma call
                const validateComponent = (comp: any, index: number) => {
                  if (!comp.projectId) throw new Error(`Component ${index}: missing projectId`);
                  if (!comp.componentId) throw new Error(`Component ${index}: missing componentId`);
                  if (!comp.drawingId) throw new Error(`Component ${index}: missing drawingId`);
                  if (!comp.milestoneTemplateId) throw new Error(`Component ${index}: missing milestoneTemplateId`);
                  if (comp.instanceNumber && comp.totalInstancesOnDrawing && comp.instanceNumber > comp.totalInstancesOnDrawing) {
                    throw new Error(`Component ${index} (${comp.componentId}): instanceNumber ${comp.instanceNumber} > totalInstancesOnDrawing ${comp.totalInstancesOnDrawing}`);
                  }
                };
                
                regularComponents.forEach(validateComponent);
                
                const createResult = await tx.component.createManyAndReturn({
                  data: regularComponents,
                  skipDuplicates: true,
                });
                
                console.log(`Import job ${jobId}: Successfully created ${createResult.length} regular components`);
                createdComponents.push(...createResult);
                successCount += createResult.length;
              } catch (error: any) {
                console.error(`Import job ${jobId}: Failed to create regular components:`, {
                  error: error.message,
                  code: error.code,
                  count: regularComponents.length,
                  sampleComponent: regularComponents[0]
                });
                
                // Log detailed info for debugging
                if (error.message.includes('instanceNumber')) {
                  console.error(`Import job ${jobId}: Instance number validation errors. Sample components:`, 
                    regularComponents.slice(0, 3).map(c => ({
                      componentId: c.componentId,
                      instanceNumber: c.instanceNumber,
                      totalInstancesOnDrawing: c.totalInstancesOnDrawing,
                      drawingId: c.drawingId
                    }))
                  );
                }
                
                throw error; // Re-throw to trigger transaction rollback
              }
            }
            
            // Create field welds with optimized bulk operations
            console.log(`Import job ${jobId}: Processing ${fieldWeldComponents.length} field welds in transaction`);
            
            if (fieldWeldComponents.length > 0) {
              // Filter out field welds with missing drawings
              const validFieldWelds = fieldWeldComponents.filter(fw => 
                !missingDrawingIds.includes(fw.drawingId)
              );
              
              // Track skipped welds with missing drawings
              const skippedWelds = fieldWeldComponents.filter(fw => 
                missingDrawingIds.includes(fw.drawingId)
              );
              
              skippedWelds.forEach(fw => {
                errors.push({
                  row: fw._rowIndex || 0,
                  componentId: fw.componentId,
                  field: 'drawingId',
                  error: `Drawing ${fw.drawingId} not found in project`,
                  value: fw.drawingId,
                });
                errorCount++;
              });

              if (validFieldWelds.length > 0) {
                console.log(`Import job ${jobId}: Processing ${validFieldWelds.length} valid field welds (${skippedWelds.length} skipped)`);
                
                // Separate into existing vs new field welds for optimized processing
                const existingWeldUpdates = [];
                const newFieldWeldData = [];
                const newComponentData = [];
                const componentUpdates = [];
                
                for (const fieldWeldData of validFieldWelds) {
                  // Extract field weld-specific fields that don't belong on Component model
                  const {
                    weldSize, schedule, weldTypeCode, baseMetal, 
                    xrayPercent, pwhtRequired, ndeTypes, welderId, 
                    dateWelded, tieInNumber, comments,
                    ...componentFields
                  } = fieldWeldData;

                  const weldIdentifier = fieldWeldData.weldId || fieldWeldData.componentId;
                  const isExistingWeld = existingFieldWelds.has(weldIdentifier);
                  const existingComponent = existingComponentsByWeldId.get(weldIdentifier);
                  
                  if (isExistingWeld) {
                    // Prepare data for bulk update of existing field welds
                    existingWeldUpdates.push({
                      weldId: weldIdentifier,
                      updateData: {
                        drawingId: fieldWeldData.drawingId,
                        dateWelded: dateWelded ? new Date(dateWelded) : new Date(),
                        weldSize: weldSize || fieldWeldData.size || "TBD",
                        schedule: schedule || "TBD", 
                        weldTypeCode: weldTypeCode || "BW",
                        baseMetal: baseMetal || fieldWeldData.material,
                        pwhtRequired: pwhtRequired || false,
                        ndeTypes: ndeTypes || [],
                        packageNumber: fieldWeldData.testPackage || "TBD",
                        specCode: fieldWeldData.spec || "TBD",
                        comments: comments || `Updated from ${uploadData.originalName}`,
                      }
                    });

                    // Prepare component update if it exists
                    if (existingComponent) {
                      componentUpdates.push({
                        id: existingComponent.id,
                        data: {
                          area: fieldWeldData.area || existingComponent.area || "",
                          system: fieldWeldData.system || existingComponent.system || "",
                          testPackage: fieldWeldData.testPackage || existingComponent.testPackage || "TBD",
                        }
                      });
                      createdComponents.push(existingComponent);
                    }
                  } else {
                    // Prepare data for new field welds
                    if (existingComponent) {
                      // Component exists but no FieldWeld - update Component
                      componentUpdates.push({
                        id: existingComponent.id,
                        data: {
                          type: "FIELD_WELD",
                          weldId: weldIdentifier,
                          area: fieldWeldData.area || existingComponent.area || "",
                          system: fieldWeldData.system || existingComponent.system || "",
                          testPackage: fieldWeldData.testPackage || existingComponent.testPackage || "TBD",
                        }
                      });
                      createdComponents.push(existingComponent);
                    } else {
                      // Create new Component
                      newComponentData.push({
                        ...componentFields,
                        weldId: weldIdentifier,
                        area: fieldWeldData.area || "",
                        system: fieldWeldData.system || "",
                        testPackage: fieldWeldData.testPackage || "TBD",
                      });
                    }

                    // Prepare FieldWeld creation data
                    newFieldWeldData.push({
                      projectId: uploadData.projectId,
                      weldIdNumber: weldIdentifier,
                      drawingId: fieldWeldData.drawingId,
                      dateWelded: dateWelded ? new Date(dateWelded) : new Date(),
                      weldSize: weldSize || fieldWeldData.size || "TBD",
                      schedule: schedule || "TBD", 
                      weldTypeCode: weldTypeCode || "BW",
                      baseMetal: baseMetal || fieldWeldData.material,
                      pwhtRequired: pwhtRequired || false,
                      ndeTypes: ndeTypes || [],
                      packageNumber: fieldWeldData.testPackage || "TBD",
                      testPressure: {},
                      specCode: fieldWeldData.spec || "TBD",
                      comments: comments || `Imported from ${uploadData.originalName}`,
                    });
                  }
                }

                // Execute bulk operations (reduced logging)
                if (existingWeldUpdates.length > 0 || newFieldWeldData.length > 0) {
                  console.log(`Import job ${jobId}: Bulk processing - ${existingWeldUpdates.length} updates, ${newFieldWeldData.length} new field welds`);
                }

                // Bulk update existing field welds (individual updates for complex data)
                for (const update of existingWeldUpdates) {
                  try {
                    await tx.fieldWeld.update({
                      where: {
                        projectId_weldIdNumber: {
                          projectId: uploadData.projectId,
                          weldIdNumber: update.weldId,
                        },
                      },
                      data: update.updateData,
                    });
                    successCount++;
                  } catch (error: any) {
                    console.error(`Failed to update field weld ${update.weldId}:`, error.message);
                    errorCount++;
                    errors.push({
                      row: 0,
                      componentId: update.weldId,
                      field: 'fieldWeld',
                      error: `Failed to update existing field weld: ${error.message}`,
                      value: update.weldId,
                    });
                  }
                }

                // Bulk update components - group by update fields for efficiency
                if (componentUpdates.length > 0) {
                  // Group updates by the type of change being made
                  const updateGroups = new Map<string, { ids: string[], data: any }>();
                  
                  for (const update of componentUpdates) {
                    const updateKey = JSON.stringify(update.data);
                    if (!updateGroups.has(updateKey)) {
                      updateGroups.set(updateKey, { ids: [], data: update.data });
                    }
                    updateGroups.get(updateKey)!.ids.push(update.id);
                  }
                  
                  // Execute bulk updates for each group
                  for (const [_, group] of updateGroups) {
                    try {
                      await tx.component.updateMany({
                        where: { id: { in: group.ids } },
                        data: group.data,
                      });
                    } catch (error: any) {
                      console.error(`Failed to bulk update ${group.ids.length} components:`, error.message);
                      // Fallback to individual updates for this group
                      for (const id of group.ids) {
                        try {
                          await tx.component.update({
                            where: { id },
                            data: group.data,
                          });
                        } catch (fallbackError: any) {
                          console.error(`Failed to update component ${id}:`, fallbackError.message);
                        }
                      }
                    }
                  }
                }

                // Bulk create new components for field welds
                if (newComponentData.length > 0) {
                  try {
                    const newComponents = await tx.component.createManyAndReturn({
                      data: newComponentData,
                      skipDuplicates: true,
                    });
                    createdComponents.push(...newComponents);
                    successCount += newComponents.length;
                  } catch (error: any) {
                    console.error(`Failed to bulk create components for field welds:`, error.message);
                    errorCount += newComponentData.length;
                    newComponentData.forEach(comp => {
                      errors.push({
                        row: 0,
                        componentId: comp.componentId,
                        field: 'component',
                        error: `Failed to create component: ${error.message}`,
                        value: comp.componentId,
                      });
                    });
                  }
                }

                // Bulk create new field welds
                if (newFieldWeldData.length > 0) {
                  try {
                    await tx.fieldWeld.createMany({
                      data: newFieldWeldData,
                      skipDuplicates: true,
                    });
                    successCount += newFieldWeldData.length;
                  } catch (error: any) {
                    console.error(`Failed to bulk create field welds:`, error.message);
                    errorCount += newFieldWeldData.length;
                    newFieldWeldData.forEach(fw => {
                      errors.push({
                        row: 0,
                        componentId: fw.weldIdNumber,
                        field: 'fieldWeld',
                        error: `Failed to create field weld: ${error.message}`,
                        value: fw.weldIdNumber,
                      });
                    });
                  }
                }
              }
            }
            
            // Step 3: Bulk update existing components (optimized)
            if (existingComponents.length > 0) {
              // Group existing components by their update data for bulk operations
              const existingUpdateGroups = new Map<string, { ids: string[], data: any }>();
              
              for (const { existing, data } of existingComponents) {
                const { _quantityIndex, drawingId, milestoneTemplateId, projectId, ...updateData } = data as any;
                
                const componentUpdateData = {
                  ...updateData,
                  type: convertToComponentType(data.type),
                  displayId: (data as any).displayId,
                  instanceNumber: (data as any).instanceNumber,
                  totalInstancesOnDrawing: (data as any).totalInstancesOnDrawing,
                  updatedAt: new Date(),
                };
                
                const updateKey = JSON.stringify(componentUpdateData);
                if (!existingUpdateGroups.has(updateKey)) {
                  existingUpdateGroups.set(updateKey, { ids: [], data: componentUpdateData });
                }
                existingUpdateGroups.get(updateKey)!.ids.push(existing.id);
              }
              
              // Execute bulk updates for existing components
              for (const [_, group] of existingUpdateGroups) {
                try {
                  await tx.component.updateMany({
                    where: { id: { in: group.ids } },
                    data: group.data,
                  });
                  successCount += group.ids.length;
                } catch (error: any) {
                  console.error(`Failed to bulk update ${group.ids.length} existing components:`, error.message);
                  // Fallback to individual updates
                  for (const id of group.ids) {
                    try {
                      await tx.component.update({
                        where: { id },
                        data: group.data,
                      });
                      successCount++;
                    } catch (fallbackError: any) {
                      console.error(`Failed to update existing component ${id}:`, fallbackError.message);
                      errorCount++;
                    }
                  }
                }
              }
            }
            
            // Step 4: Collect and bulk create milestones
            const allMilestones = [];
            const auditLogs = [];
            
            // For new components
            for (const component of createdComponents) {
              const template = templatesById.get(component.milestoneTemplateId);
              if (template?.milestones) {
                let milestoneData: any[] = [];
                
                if (typeof template.milestones === 'string') {
                  try {
                    milestoneData = JSON.parse(template.milestones);
                  } catch (e) {
                    console.error(`Failed to parse milestone template JSON:`, e);
                  }
                } else if (Array.isArray(template.milestones)) {
                  milestoneData = template.milestones;
                } else if (typeof template.milestones === 'object') {
                  milestoneData = (template.milestones as any).data || Object.values(template.milestones);
                }
                
                if (Array.isArray(milestoneData) && milestoneData.length > 0) {
                  const milestones = milestoneData.map((milestone, index) => ({
                    componentId: component.id,
                    milestoneName: milestone.name,
                    milestoneOrder: index,
                    weight: milestone.weight || 1,
                    isCompleted: false,
                  }));
                  allMilestones.push(...milestones);
                }
              }
              
              // Collect audit log for new component
              auditLogs.push({
                projectId: uploadData.projectId,
                userId: uploadData.userId,
                entityType: "component",
                entityId: component.id,
                action: "CREATE",
                changes: {
                  source: "import",
                  importJobId: jobId,
                  componentId: component.componentId,
                  instanceNumber: component.instanceNumber,
                },
              });
            }
            
            // For existing components that need milestones
            for (const { existing, data } of existingComponents) {
              const existingMilestoneCount = await tx.componentMilestone.count({
                where: { componentId: existing.id }
              });
              
              if (existingMilestoneCount === 0 && data.milestoneTemplateId) {
                const template = templatesById.get(data.milestoneTemplateId);
                if (template?.milestones) {
                  let milestoneData: any[] = [];
                  
                  if (typeof template.milestones === 'string') {
                    try {
                      milestoneData = JSON.parse(template.milestones);
                    } catch (e) {
                      console.error(`Failed to parse milestone template JSON:`, e);
                    }
                  } else if (Array.isArray(template.milestones)) {
                    milestoneData = template.milestones;
                  } else if (typeof template.milestones === 'object') {
                    milestoneData = (template.milestones as any).data || Object.values(template.milestones);
                  }
                  
                  if (Array.isArray(milestoneData) && milestoneData.length > 0) {
                    const milestones = milestoneData.map((milestone, index) => ({
                      componentId: existing.id,
                      milestoneName: milestone.name,
                      milestoneOrder: index,
                      weight: milestone.weight || 1,
                      isCompleted: false,
                    }));
                    allMilestones.push(...milestones);
                  }
                }
              }
              
              // Collect audit log for updated component
              auditLogs.push({
                projectId: uploadData.projectId,
                userId: uploadData.userId,
                entityType: "component",
                entityId: existing.id,
                action: "UPDATE",
                changes: {
                  source: "import",
                  importJobId: jobId,
                  componentId: data.componentId,
                  instanceNumber: (data as any).instanceNumber,
                },
              });
            }
            
            // Step 5: Bulk create milestones
            if (allMilestones.length > 0) {
              await tx.componentMilestone.createMany({
                data: allMilestones,
                skipDuplicates: true,
              });
            }
            
            // Step 6: Bulk create audit logs
            if (auditLogs.length > 0) {
              await tx.auditLog.createMany({
                data: auditLogs,
                skipDuplicates: true,
              });
            }
            
            // Mark all as successful
            for (const componentData of batch) {
              results.push({ success: true, componentId: componentData.componentId });
            }
            
          } catch (batchError: any) {
            console.error(`Import job ${jobId}: Transaction failed for batch:`, {
              error: batchError.message,
              code: batchError.code,
              batchSize: batch.length,
              fieldWeldCount: fieldWeldComponents.length,
            });
            
            // Categorize transaction-level errors for better diagnostics
            let errorCategory = 'UNKNOWN_ERROR';
            let userFriendlyMessage = batchError.message;
            
            if (batchError.code === '25P02') {
              errorCategory = 'TRANSACTION_ABORTED';
              userFriendlyMessage = 'Transaction aborted due to constraint violation. This may be caused by duplicate field welds.';
            } else if (batchError.code === 'P2002') {
              errorCategory = 'CONSTRAINT_VIOLATION';
              userFriendlyMessage = 'Duplicate records detected. Some components may already exist in the project.';
            } else if (batchError.code === 'P2003') {
              errorCategory = 'FOREIGN_KEY_VIOLATION';
              userFriendlyMessage = 'Reference to non-existent records (drawings, weld types, etc.).';
            } else if (batchError.message.includes('timeout')) {
              errorCategory = 'TIMEOUT_ERROR';
              userFriendlyMessage = 'Operation timed out. Try importing smaller batches.';
            }
            
            // If batch fails, mark all as failed with categorized error info
            for (const componentData of batch) {
              const error = {
                componentId: componentData.componentId,
                error: userFriendlyMessage,
                errorCategory: errorCategory,
                originalError: batchError.message,
                prismaCode: batchError.code,
                stack: process.env.NODE_ENV === 'development' ? batchError.stack : undefined
              };
              errors.push(error);
              results.push({ success: false, error });
              errorCount++;
            }
            
            // Log detailed error for debugging
            console.error(`Import job ${jobId}: Detailed error info:`, {
              category: errorCategory,
              prismaCode: batchError.code,
              affectedComponents: batch.length,
              fieldWeldsInBatch: fieldWeldComponents.length,
            });
            
            if (options.rollbackOnError) {
              throw batchError;
            }
          }
        }, {
          maxWait: 30000,    // Max time to wait for transaction slot (30 seconds)
          timeout: 120000,   // Reduced timeout to prevent hanging (2 minutes)
        });
        
        // Log batch completion summary (only if errors)
        const batchErrors = results.filter(r => !r.success);
        if (batchErrors.length > 0) {
          console.log(`Import job ${jobId}: Batch completed with ${batchErrors.length} errors`);
          
          // Log error details
          batchErrors.forEach(result => {
            console.error(`Import job ${jobId}: Failed component ${result.error.componentId}: ${result.error.error}`);
          });
        }
        
        // Force garbage collection and connection cleanup after each batch
        if (global.gc) {
          global.gc();
        }
        
        // Allow connection pool to reset between batches
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return results;
      },
      batchSize,  // Dynamic batch size based on component types
      async (processed, total) => {
        // Update job progress
        await prisma.importJob.update({
          where: { id: jobId },
          data: {
            processedRows: processed,
            totalRows: total,
          },
        });

        // Broadcast progress update
        await broadcastImportProgress(
          uploadData.projectId,
          jobId,
          {
            status: ImportStatus.PROCESSING,
            filename: uploadData.originalName,
            processedRows: processed,
            totalRows: total,
            progress: Math.round((processed / total) * 100),
          },
          uploadData.userId
        );
      }
    );

    // Update job with final results
    console.log(`Import job ${jobId}: Import completed. Success: ${successCount}, Errors: ${errorCount}, Total processed: ${successCount + errorCount}`);
    console.log(`Import job ${jobId}: Components with instances: ${componentsWithInstances.length}`);
    
    if (errors.length > 0) {
      console.error(`Import job ${jobId}: Errors encountered:`, errors);
    }
    
    const finalStatus = errorCount === 0 ? ImportStatus.COMPLETED : ImportStatus.FAILED;
    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: finalStatus,
        completedAt: new Date(),
        totalRows: componentsWithInstances.length,
        processedRows: successCount + errorCount,
        errorRows: errorCount,
        errors: errors.length > 0 ? errors : null,
      },
    });
    
    console.log(`Import job ${jobId}: Job status updated to ${finalStatus}`);

    // Broadcast final completion
    await broadcastImportProgress(
      uploadData.projectId,
      jobId,
      {
        status: finalStatus,
        filename: uploadData.originalName,
        processedRows: successCount + errorCount,
        totalRows: componentsWithInstances.length,
        errorRows: errorCount,
        progress: 100,
        completed: true,
      },
      uploadData.userId
    );

  } catch (error: any) {
    // Re-throw the error to be handled by the main processImportJob function
    throw error;
  }
}