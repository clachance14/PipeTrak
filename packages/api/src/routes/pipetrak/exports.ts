import { db as prisma } from "@repo/database";
import { z } from "zod";
import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth";
import { ComponentStatus } from "@repo/database/prisma/generated/client";
import { ExcelProcessor } from "../../lib/file-processing";
import * as ExcelJS from "exceljs";

// Export validation schemas
const ComponentExportSchema = z.object({
  projectId: z.string(),
  format: z.enum(["csv", "excel"]).default("excel"),
  filters: z.object({
    drawingId: z.string().optional(),
    area: z.string().optional(),
    system: z.string().optional(),
    testPackage: z.string().optional(),
    status: z.nativeEnum(ComponentStatus).optional(),
    type: z.string().optional(),
    completionRange: z.object({
      min: z.number().min(0).max(100),
      max: z.number().min(0).max(100),
    }).optional(),
    dateRange: z.object({
      start: z.string().datetime(),
      end: z.string().datetime(),
    }).optional(),
  }).optional().default({}),
  options: z.object({
    includeMilestones: z.boolean().default(true),
    includeAuditTrail: z.boolean().default(false),
    includeInstanceDetails: z.boolean().default(true),
    groupByDrawing: z.boolean().default(false),
    sortBy: z.enum(["componentId", "type", "area", "system", "completionPercent", "updatedAt"]).default("componentId"),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
  }).optional().default({}),
});

const ProgressReportSchema = z.object({
  projectId: z.string(),
  format: z.enum(["excel"]).default("excel"),
  options: z.object({
    includeCharts: z.boolean().default(true),
    includeDetailedBreakdown: z.boolean().default(true),
    includeTrendAnalysis: z.boolean().default(false),
    groupBy: z.enum(["area", "system", "testPackage", "drawing"]).default("area"),
  }).optional().default({}),
});

const CustomExportSchema = z.object({
  projectId: z.string(),
  templateId: z.string().optional(),
  format: z.enum(["csv", "excel"]).default("excel"),
  columns: z.array(z.string()).optional(),
  filters: z.record(z.any()).optional().default({}),
  options: z.record(z.any()).optional().default({}),
});

export const exportsRouter = new Hono()
  .use("*", authMiddleware)

  // Export components with various options
  .post("/components", async (c) => {
    try {
      const body = await c.req.json();
      const { projectId, format, filters = {}, options = {} } = ComponentExportSchema.parse(body);
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
        include: {
          organization: {
            select: { name: true },
          },
        },
      });

      if (!project) {
        return c.json({ error: "Project not found or access denied" }, 403);
      }

      // Build query filters
      const where: any = {
        projectId,
        status: { not: "DELETED" },
      };

      if (filters.drawingId) where.drawingId = filters.drawingId;
      if (filters.area) where.area = filters.area;
      if (filters.system) where.system = filters.system;
      if (filters.testPackage) where.testPackage = filters.testPackage;
      if (filters.status) where.status = filters.status;
      if (filters.type) where.type = filters.type;

      if (filters.completionRange) {
        where.completionPercent = {
          gte: filters.completionRange.min,
          lte: filters.completionRange.max,
        };
      }

      if (filters.dateRange) {
        where.updatedAt = {
          gte: new Date(filters.dateRange.start),
          lte: new Date(filters.dateRange.end),
        };
      }

      // Fetch components with related data
      const components = await prisma.component.findMany({
        where,
        include: {
          drawing: {
            select: { number: true, title: true, revision: true },
          },
          milestoneTemplate: {
            select: { name: true, workflowType: true },
          },
          milestones: options.includeMilestones ? {
            select: {
              milestoneName: true,
              isCompleted: true,
              completedAt: true,
              percentageValue: true,
              quantityValue: true,
              milestoneOrder: true,
              weight: true,
              completer: {
                select: { name: true, email: true },
              },
            },
            orderBy: { milestoneOrder: "asc" },
          } : false,
          installer: {
            select: { name: true, email: true },
          },
          auditLogs: options.includeAuditTrail ? {
            select: {
              action: true,
              timestamp: true,
              changes: true,
              user: {
                select: { name: true, email: true },
              },
            },
            orderBy: { timestamp: "desc" },
            take: 10,
          } : false,
        },
        orderBy: { [options.sortBy]: options.sortOrder },
      });

      // Generate export based on format
      if (format === "csv") {
        const csvData = await generateComponentCSV(components, options);
        
        c.header("Content-Type", "text/csv");
        c.header("Content-Disposition", `attachment; filename="${project.jobNumber}_components_export.csv"`);
        return c.body(csvData);
        
      } else {
        const excelBuffer = await generateComponentExcel(components, project, options);
        
        c.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        c.header("Content-Disposition", `attachment; filename="${project.jobNumber}_components_export.xlsx"`);
        return c.body(excelBuffer);
      }

    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ error: "Invalid export parameters", details: error.errors }, 400);
      }
      console.error("Component export error:", error);
      return c.json({ error: "Failed to export components" }, 500);
    }
  })

  // Export comprehensive progress report
  .post("/progress-report", async (c) => {
    try {
      const body = await c.req.json();
      const { projectId, format, options = {} } = ProgressReportSchema.parse(body);
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
        include: {
          organization: {
            select: { name: true },
          },
        },
      });

      if (!project) {
        return c.json({ error: "Project not found or access denied" }, 403);
      }

      // Get comprehensive project data
      const [
        components,
        drawings,
        overallStats,
        statusStats,
        areaStats,
        systemStats,
        testPackageStats
      ] = await Promise.all([
        // Components with full details
        prisma.component.findMany({
          where: { projectId, status: { not: "DELETED" } },
          include: {
            drawing: { select: { number: true, title: true } },
            milestoneTemplate: { select: { name: true } },
            milestones: {
              select: {
                milestoneName: true,
                isCompleted: true,
                completedAt: true,
                milestoneOrder: true,
              },
              orderBy: { milestoneOrder: "asc" },
            },
          },
        }),
        
        // Drawings summary
        prisma.drawing.findMany({
          where: { projectId },
          include: {
            _count: {
              select: { components: { where: { status: { not: "DELETED" } } } },
            },
          },
        }),

        // Overall statistics
        prisma.component.aggregate({
          where: { projectId, status: { not: "DELETED" } },
          _count: true,
          _avg: { completionPercent: true },
        }),

        // Status breakdown
        prisma.component.groupBy({
          by: ["status"],
          where: { projectId, status: { not: "DELETED" } },
          _count: true,
          _avg: { completionPercent: true },
        }),

        // Area breakdown
        prisma.component.groupBy({
          by: ["area"],
          where: { projectId, area: { not: null }, status: { not: "DELETED" } },
          _count: true,
          _avg: { completionPercent: true },
        }),

        // System breakdown
        prisma.component.groupBy({
          by: ["system"],
          where: { projectId, system: { not: null }, status: { not: "DELETED" } },
          _count: true,
          _avg: { completionPercent: true },
        }),

        // Test Package breakdown
        prisma.component.groupBy({
          by: ["testPackage"],
          where: { projectId, testPackage: { not: null }, status: { not: "DELETED" } },
          _count: true,
          _avg: { completionPercent: true },
        }),
      ]);

      const excelBuffer = await generateProgressReportExcel({
        project,
        components,
        drawings,
        statistics: {
          overall: overallStats,
          byStatus: statusStats,
          byArea: areaStats,
          bySystem: systemStats,
          byTestPackage: testPackageStats,
        },
        options,
      });

      c.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      c.header("Content-Disposition", `attachment; filename="${project.jobNumber}_progress_report.xlsx"`);
      return c.body(excelBuffer);

    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ error: "Invalid report parameters", details: error.errors }, 400);
      }
      console.error("Progress report export error:", error);
      return c.json({ error: "Failed to generate progress report" }, 500);
    }
  })

  // Get available export templates
  .get("/templates", async (c) => {
    try {
      const projectId = c.req.query("projectId");
      const userId = c.get("user")?.id;

      if (!projectId) {
        return c.json({ error: "Project ID is required" }, 400);
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
        return c.json({ error: "Project not found or access denied" }, 403);
      }

      // Return standard export templates
      const templates = [
        {
          id: "standard_components",
          name: "Standard Components Export",
          description: "Basic component data with essential fields",
          format: "excel",
          columns: [
            "componentId", "displayId", "type", "status", "completionPercent",
            "area", "system", "testPackage", "drawing", "description"
          ],
        },
        {
          id: "detailed_components",
          name: "Detailed Components Export", 
          description: "Complete component data with milestones and specifications",
          format: "excel",
          columns: [
            "componentId", "displayId", "type", "workflowType", "status", "completionPercent",
            "area", "system", "testPackage", "drawing", "spec", "size", "material",
            "pressureRating", "description", "milestones", "installer", "lastUpdated"
          ],
        },
        {
          id: "milestone_tracking",
          name: "Milestone Tracking Export",
          description: "Focus on milestone completion and progress",
          format: "excel", 
          columns: [
            "componentId", "displayId", "type", "area", "system", "completionPercent",
            "milestoneTemplate", "completedMilestones", "remainingMilestones", "lastMilestoneUpdate"
          ],
        },
        {
          id: "instance_tracking",
          name: "Instance Tracking Export",
          description: "Detailed instance tracking per drawing",
          format: "excel",
          columns: [
            "componentId", "displayId", "instanceNumber", "totalInstances", "drawing",
            "type", "status", "completionPercent", "area", "system"
          ],
        },
      ];

      return c.json({ templates });

    } catch (error) {
      console.error("Templates fetch error:", error);
      return c.json({ error: "Failed to fetch export templates" }, 500);
    }
  })

  // Export with custom template
  .post("/custom", async (c) => {
    try {
      const body = await c.req.json();
      const { projectId, templateId, format, columns, filters = {}, options = {} } = CustomExportSchema.parse(body);
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

      // Apply template if specified
      let exportColumns = columns;
      let exportOptions = options;

      if (templateId) {
        const template = getExportTemplate(templateId);
        if (template) {
          exportColumns = template.columns;
          exportOptions = { ...template.options, ...options };
        }
      }

      // Build filters
      const where: any = {
        projectId,
        status: { not: "DELETED" },
        ...filters,
      };

      // Fetch components based on required columns
      const includeOptions = buildIncludeOptions(exportColumns || []);
      
      const components = await prisma.component.findMany({
        where,
        include: includeOptions,
        orderBy: { componentId: "asc" },
      });

      // Generate custom export
      if (format === "csv") {
        const csvData = await generateCustomCSV(components, exportColumns || [], exportOptions);
        
        c.header("Content-Type", "text/csv");
        c.header("Content-Disposition", `attachment; filename="${project.jobNumber}_custom_export.csv"`);
        return c.body(csvData);
        
      } else {
        const excelBuffer = await generateCustomExcel(components, project, exportColumns || [], exportOptions);
        
        c.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        c.header("Content-Disposition", `attachment; filename="${project.jobNumber}_custom_export.xlsx"`);
        return c.body(excelBuffer);
      }

    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ error: "Invalid custom export parameters", details: error.errors }, 400);
      }
      console.error("Custom export error:", error);
      return c.json({ error: "Failed to generate custom export" }, 500);
    }
  })

  // Enhanced ROC-weighted progress export
  .post("/roc-progress", async (c) => {
    try {
      const body = await c.req.json();
      const { projectId, format = "excel", filters = {}, options = {} } = z.object({
        projectId: z.string(),
        format: z.enum(["csv", "excel", "pdf"]).default("excel"),
        filters: z.object({
          areas: z.array(z.string()).optional(),
          systems: z.array(z.string()).optional(),
          testPackages: z.array(z.string()).optional(),
        }).optional().default({}),
        options: z.object({
          includeBreakdowns: z.boolean().default(true),
          includeCharts: z.boolean().default(true),
          includeVelocity: z.boolean().default(false),
        }).optional().default({}),
      }).parse(body);

      const userId = c.get("user")?.id;

      // Verify project access
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          organization: {
            members: {
              some: { userId },
            },
          },
        },
        include: {
          organization: {
            select: { name: true },
          },
        },
      });

      if (!project) {
        return c.json({ error: "Project not found or access denied" }, 403);
      }

      // Call ROC calculation RPC function
      const rocResult = await prisma.$queryRaw`
        SELECT calculate_roc_weighted_progress(${projectId}, ${JSON.stringify(filters)}) as result
      ` as any[];

      const rocData = rocResult[0]?.result?.data;

      if (!rocData) {
        return c.json({ error: "Failed to calculate ROC data" }, 500);
      }

      if (format === "csv") {
        const csvData = await generateROCProgressCSV(rocData);
        
        c.header("Content-Type", "text/csv");
        c.header("Content-Disposition", `attachment; filename="${project.jobNumber}_roc_progress.csv"`);
        return c.body(csvData);
        
      } else if (format === "pdf") {
        const pdfBuffer = await generateROCProgressPDF(rocData, project, options);
        
        c.header("Content-Type", "application/pdf");
        c.header("Content-Disposition", `attachment; filename="${project.jobNumber}_roc_progress.pdf"`);
        return c.body(pdfBuffer);
        
      } else {
        const excelBuffer = await generateROCProgressExcel(rocData, project, options);
        
        c.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        c.header("Content-Disposition", `attachment; filename="${project.jobNumber}_roc_progress.xlsx"`);
        return c.body(excelBuffer);
      }

    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ error: "Invalid export parameters", details: error.errors }, 400);
      }
      console.error("ROC progress export error:", error);
      return c.json({ error: "Failed to export ROC progress report" }, 500);
    }
  })

  // Streaming large dataset export
  .post("/components/stream", async (c) => {
    try {
      const body = await c.req.json();
      const { projectId, format = "excel", filters = {}, options = {} } = ComponentExportSchema.parse(body);
      const userId = c.get("user")?.id;

      // Verify project access
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

      // For large datasets, use streaming approach
      const CHUNK_SIZE = 5000;
      let offset = 0;
      let hasMore = true;
      const tempFilePath = `/tmp/${projectId}_${Date.now()}_components.${format}`;

      if (format === "excel") {
        // Initialize streaming Excel workbook
        const streamedBuffer = await generateStreamedExcel(
          projectId, filters, options, project, CHUNK_SIZE
        );
        
        c.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        c.header("Content-Disposition", `attachment; filename="${project.jobNumber}_components_streamed.xlsx"`);
        return c.body(streamedBuffer);
        
      } else {
        // For CSV, use simple streaming
        c.header("Content-Type", "text/csv");
        c.header("Content-Disposition", `attachment; filename="${project.jobNumber}_components_streamed.csv"`);
        
        let csvOutput = "";
        let isFirstChunk = true;
        
        while (hasMore) {
          const componentChunk = await getComponentChunk(projectId, filters, options, offset, CHUNK_SIZE);
          
          if (componentChunk.length === 0) {
            hasMore = false;
            break;
          }
          
          if (isFirstChunk) {
            csvOutput += await generateComponentCSV(componentChunk, options);
            isFirstChunk = false;
          } else {
            // Skip headers for subsequent chunks
            const chunkCSV = await generateComponentCSV(componentChunk, options);
            const lines = chunkCSV.split('\n');
            csvOutput += '\n' + lines.slice(1).join('\n');
          }
          
          offset += CHUNK_SIZE;
          hasMore = componentChunk.length === CHUNK_SIZE;
        }
        
        return c.body(csvOutput);
      }

    } catch (error) {
      console.error("Streaming export error:", error);
      return c.json({ error: "Failed to stream component export" }, 500);
    }
  })

  // Progress Summary Report export (new for weekly reporting)
  .post("/progress-summary", async (c) => {
    try {
      const body = await c.req.json();
      const { projectId, weekEnding, groupBy = 'area', format = 'excel', options = {} } = z.object({
        projectId: z.string(),
        weekEnding: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format").optional(),
        groupBy: z.enum(['area', 'system', 'testPackage', 'iwp']).default('area'),
        format: z.enum(['csv', 'excel', 'pdf']).default('excel'),
        options: z.object({
          showDeltas: z.boolean().default(true),
          includeZeroProgress: z.boolean().default(true),
          includeSubtotals: z.boolean().default(true),
          includeGrandTotal: z.boolean().default(true),
        }).optional().default({}),
      }).parse(body);

      const userId = c.get("user")?.id;

      // Verify project access
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          organization: {
            members: {
              some: { userId },
            },
          },
        },
        include: {
          organization: {
            select: { name: true },
          },
        },
      });

      if (!project) {
        return c.json({ error: "Project not found or access denied" }, 403);
      }

      // Determine week ending date - default to current Sunday if not provided
      let weekEndingDate: Date;
      if (weekEnding) {
        weekEndingDate = new Date(weekEnding);
      } else {
        // Get current Sunday
        const today = new Date();
        const dayOfWeek = today.getDay();
        const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
        weekEndingDate = new Date(today);
        weekEndingDate.setDate(today.getDate() + daysUntilSunday);
        weekEndingDate.setHours(23, 59, 59, 999);
      }

      // Get components with milestones for the project
      const components = await prisma.component.findMany({
        where: { projectId },
        include: {
          milestones: {
            orderBy: { milestoneOrder: 'asc' }
          }
        }
      });

      // Process data based on grouping - same logic as progress-summary endpoint
      let currentWeekData = [];
      const groupedData = new Map();

      components.forEach(component => {
        const groupKey = groupBy === 'system' ? component.system : 
                         groupBy === 'testPackage' ? component.testPackage : 
                         component.area;
        
        if (!groupKey) return;

        if (!groupedData.has(groupKey)) {
          groupedData.set(groupKey, {
            components: [],
            milestoneData: new Map()
          });
        }

        const group = groupedData.get(groupKey);
        group.components.push(component.id);

        // Process all milestones for this component
        component.milestones.forEach(m => {
          // Skip if effectiveDate is in the future
          if (m.effectiveDate && new Date(m.effectiveDate) > weekEndingDate) return;
          
          // Initialize milestone tracking if not exists
          if (!group.milestoneData.has(m.milestoneName)) {
            group.milestoneData.set(m.milestoneName, {
              completedCount: 0,
              totalCount: 0,
              percentageSum: 0
            });
          }
          
          const milestoneStats = group.milestoneData.get(m.milestoneName);
          milestoneStats.totalCount++;
          
          if (m.isCompleted) {
            milestoneStats.completedCount++;
            milestoneStats.percentageSum += 100;
          } else if (m.percentageValue) {
            milestoneStats.percentageSum += m.percentageValue;
          }
        });
      });

      // Calculate percentages for each group
      groupedData.forEach((data, key) => {
        // Map database milestone names to report columns
        const milestoneMapping: Record<string, string[]> = {
          'Receive': ['Receive', 'Received'],
          'Install': ['Install', 'Installed', 'Fit-up', 'Fitted', 'Weld', 'Welded', 'Erect', 'Erected'],
          'Punch': ['Punch', 'Punched'],
          'Test': ['Test', 'Tested'],
          'Restore': ['Restore', 'Restored', 'Insulate', 'Insulated']
        };
        
        const milestonePercentages: Record<string, number> = {};
        
        // Calculate percentages for each report column by aggregating related milestones
        Object.entries(milestoneMapping).forEach(([reportColumn, dbMilestoneNames]) => {
          let totalCount = 0;
          let percentageSum = 0;
          
          // Aggregate all related milestone types
          dbMilestoneNames.forEach(dbName => {
            const stats = data.milestoneData.get(dbName);
            if (stats && stats.totalCount > 0) {
              totalCount += stats.totalCount;
              percentageSum += stats.percentageSum;
            }
          });
          
          // Calculate average percentage for this column
          milestonePercentages[reportColumn] = totalCount > 0 ? percentageSum / totalCount : 0;
        });
        
        // Calculate overall percentage (average of all milestone percentages)
        const avgValues = Object.values(milestonePercentages);
        const overallPercent = avgValues.length > 0 
          ? avgValues.reduce((a, b) => a + b, 0) / avgValues.length 
          : 0;
        
        const rowData = {
          [groupBy === 'system' ? 'system_name' : groupBy === 'testPackage' ? 'test_package' : 'area']: key,
          component_count: data.components.length,
          received_percent: Math.round(milestonePercentages['Receive'] * 100) / 100,
          installed_percent: Math.round(milestonePercentages['Install'] * 100) / 100,
          punched_percent: Math.round(milestonePercentages['Punch'] * 100) / 100,
          tested_percent: Math.round(milestonePercentages['Test'] * 100) / 100,
          restored_percent: Math.round(milestonePercentages['Restore'] * 100) / 100,
          overall_percent: Math.round(overallPercent * 100) / 100
        };
        
        currentWeekData.push(rowData);
      });

      // Get previous week data for delta calculation
      let previousWeekData = [];
      if (options.showDeltas) {
        const previousWeekDate = new Date(weekEndingDate);
        previousWeekDate.setDate(previousWeekDate.getDate() - 7);

        // Get snapshot from previous week if available
        const previousSnapshot = await prisma.progressSnapshots.findFirst({
          where: {
            projectId,
            snapshotDate: previousWeekDate
          },
          orderBy: { snapshotTime: 'desc' }
        });

        if (previousSnapshot && previousSnapshot.snapshotData) {
          const snapshotData = previousSnapshot.snapshotData as any;
          previousWeekData = snapshotData.data || [];
        }
      }

      const reportData = {
        projectId: project.id,
        projectName: project.jobName,
        jobNumber: project.jobNumber,
        organization: project.organization.name,
        weekEnding: weekEndingDate.toISOString().split('T')[0],
        groupBy,
        currentWeekData: currentWeekData as any[],
        previousWeekData: previousWeekData as any[],
        options,
      };

      // Generate export based on format
      if (format === "csv") {
        const csvData = await generateProgressSummaryCSV(reportData);
        
        c.header("Content-Type", "text/csv");
        c.header("Content-Disposition", `attachment; filename="PipeTrak_Progress_${project.jobNumber}_WE_${reportData.weekEnding}_FINAL.csv"`);
        return c.body(csvData);
        
      } else if (format === "pdf") {
        const pdfBuffer = await generateProgressSummaryPDF(reportData);
        
        c.header("Content-Type", "application/pdf");
        c.header("Content-Disposition", `attachment; filename="PipeTrak_Progress_${project.jobNumber}_WE_${reportData.weekEnding}_FINAL.pdf"`);
        return c.body(pdfBuffer);
        
      } else {
        const excelBuffer = await generateProgressSummaryExcel(reportData);
        
        c.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        c.header("Content-Disposition", `attachment; filename="PipeTrak_Progress_${project.jobNumber}_WE_${reportData.weekEnding}_FINAL.xlsx"`);
        return c.body(excelBuffer);
      }

    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ error: "Invalid export parameters", details: error.errors }, 400);
      }
      console.error("Progress Summary Report export error:", error);
      return c.json({ error: "Failed to export Progress Summary Report" }, 500);
    }
  })

  // Test package readiness export with blocking analysis
  .post("/test-packages", async (c) => {
    try {
      const body = await c.req.json();
      const { projectId, format = "excel", filters = {}, options = {} } = z.object({
        projectId: z.string(),
        format: z.enum(["csv", "excel", "pdf"]).default("excel"),
        filters: z.object({
          testPackages: z.array(z.string()).optional(),
          areas: z.array(z.string()).optional(),
          readinessStatus: z.array(z.string()).optional(),
        }).optional().default({}),
        options: z.object({
          includeBlockingDetails: z.boolean().default(true),
          includeVelocityAnalysis: z.boolean().default(true),
          includeForecast: z.boolean().default(true),
        }).optional().default({}),
      }).parse(body);

      const userId = c.get("user")?.id;

      // Verify project access
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          organization: {
            members: {
              some: { userId },
            },
          },
        },
        include: {
          organization: {
            select: { name: true },
          },
        },
      });

      if (!project) {
        return c.json({ error: "Project not found or access denied" }, 403);
      }

      // Call test package readiness RPC function
      const testPackageResult = await prisma.$queryRaw`
        SELECT get_test_package_readiness_detailed(${projectId}, ${JSON.stringify(filters)}) as result
      ` as any[];

      const testPackageData = testPackageResult[0]?.result?.data;

      if (!testPackageData) {
        return c.json({ error: "Failed to get test package data" }, 500);
      }

      if (format === "csv") {
        const csvData = await generateTestPackageCSV(testPackageData, options);
        
        c.header("Content-Type", "text/csv");
        c.header("Content-Disposition", `attachment; filename="${project.jobNumber}_test_packages.csv"`);
        return c.body(csvData);
        
      } else if (format === "pdf") {
        const pdfBuffer = await generateTestPackagePDF(testPackageData, project, options);
        
        c.header("Content-Type", "application/pdf");
        c.header("Content-Disposition", `attachment; filename="${project.jobNumber}_test_packages.pdf"`);
        return c.body(pdfBuffer);
        
      } else {
        const excelBuffer = await generateTestPackageExcel(testPackageData, project, options);
        
        c.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        c.header("Content-Disposition", `attachment; filename="${project.jobNumber}_test_packages.xlsx"`);
        return c.body(excelBuffer);
      }

    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ error: "Invalid export parameters", details: error.errors }, 400);
      }
      console.error("Test package export error:", error);
      return c.json({ error: "Failed to export test package report" }, 500);
    }
  });

// Helper functions for generating exports

async function generateComponentCSV(components: any[], options: any): Promise<string> {
  const headers = [
    "Component ID", "Display ID", "Type", "Status", "Completion %",
    "Area", "System", "Test Package", "Drawing", "Description",
    "Spec", "Size", "Material", "Pressure Rating"
  ];

  if (options.includeMilestones) {
    headers.push("Milestones Completed", "Total Milestones", "Latest Milestone");
  }

  if (options.includeInstanceDetails) {
    headers.push("Instance Number", "Total Instances");
  }

  const rows = components.map(component => {
    const row = [
      component.componentId,
      component.displayId,
      component.type,
      component.status,
      component.completionPercent,
      component.area || "",
      component.system || "",
      component.testPackage || "",
      component.drawing?.number || "",
      component.description || "",
      component.spec || "",
      component.size || "",
      component.material || "",
      component.pressureRating || "",
    ];

    if (options.includeMilestones && component.milestones) {
      const completedMilestones = component.milestones.filter((m: any) => m.isCompleted).length;
      const totalMilestones = component.milestones.length;
      const latestMilestone = component.milestones
        .filter((m: any) => m.completedAt)
        .sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0];

      row.push(
        completedMilestones.toString(),
        totalMilestones.toString(),
        latestMilestone ? latestMilestone.milestoneName : ""
      );
    }

    if (options.includeInstanceDetails) {
      row.push(
        component.instanceNumber?.toString() || "1",
        component.totalInstancesOnDrawing?.toString() || "1"
      );
    }

    return row;
  });

  // Convert to CSV format
  const csvRows = [headers, ...rows];
  return csvRows.map(row => 
    row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')
  ).join('\n');
}

async function generateComponentExcel(components: any[], project: any, options: any): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  
  // Set workbook properties
  workbook.creator = "PipeTrak";
  workbook.lastModifiedBy = "PipeTrak";
  workbook.created = new Date();
  workbook.modified = new Date();

  // Components sheet
  const worksheet = workbook.addWorksheet("Components");
  
  // Define headers
  const headers = [
    { key: "componentId", header: "Component ID", width: 20 },
    { key: "displayId", header: "Display ID", width: 25 },
    { key: "type", header: "Type", width: 15 },
    { key: "status", header: "Status", width: 12 },
    { key: "completionPercent", header: "Completion %", width: 12 },
    { key: "area", header: "Area", width: 15 },
    { key: "system", header: "System", width: 15 },
    { key: "testPackage", header: "Test Package", width: 15 },
    { key: "drawing", header: "Drawing", width: 15 },
    { key: "description", header: "Description", width: 30 },
    { key: "spec", header: "Specification", width: 20 },
    { key: "size", header: "Size", width: 10 },
    { key: "material", header: "Material", width: 15 },
    { key: "pressureRating", header: "Pressure Rating", width: 15 },
  ];

  if (options.includeInstanceDetails) {
    headers.push(
      { key: "instanceNumber", header: "Instance #", width: 10 },
      { key: "totalInstances", header: "Total Instances", width: 12 }
    );
  }

  if (options.includeMilestones) {
    headers.push(
      { key: "milestonesCompleted", header: "Milestones Completed", width: 15 },
      { key: "totalMilestones", header: "Total Milestones", width: 12 },
      { key: "latestMilestone", header: "Latest Milestone", width: 20 }
    );
  }

  worksheet.columns = headers;

  // Add data rows
  for (const component of components) {
    const rowData: any = {
      componentId: component.componentId,
      displayId: component.displayId,
      type: component.type,
      status: component.status,
      completionPercent: component.completionPercent,
      area: component.area,
      system: component.system,
      testPackage: component.testPackage,
      drawing: component.drawing?.number,
      description: component.description,
      spec: component.spec,
      size: component.size,
      material: component.material,
      pressureRating: component.pressureRating,
    };

    if (options.includeInstanceDetails) {
      rowData.instanceNumber = component.instanceNumber || 1;
      rowData.totalInstances = component.totalInstancesOnDrawing || 1;
    }

    if (options.includeMilestones && component.milestones) {
      const completedMilestones = component.milestones.filter((m: any) => m.isCompleted).length;
      const totalMilestones = component.milestones.length;
      const latestMilestone = component.milestones
        .filter((m: any) => m.completedAt)
        .sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0];

      rowData.milestonesCompleted = completedMilestones;
      rowData.totalMilestones = totalMilestones;
      rowData.latestMilestone = latestMilestone?.milestoneName || '';
    }

    worksheet.addRow(rowData);
  }

  // Style the header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '2E86AB' }
  };
  headerRow.alignment = { horizontal: 'center' };

  // Add alternating row colors
  for (let i = 2; i <= worksheet.rowCount; i++) {
    if (i % 2 === 0) {
      const row = worksheet.getRow(i);
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F8F9FA' }
      };
    }
  }

  // Add conditional formatting for completion percentage
  const completionColumn = worksheet.getColumn('completionPercent');
  completionColumn.eachCell((cell, rowNumber) => {
    if (rowNumber > 1) { // Skip header
      const value = cell.value as number;
      if (value >= 100) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'D4EDDA' }
        };
      } else if (value >= 50) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF3CD' }
        };
      } else if (value > 0) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F8D7DA' }
        };
      }
    }
  });

  return workbook.xlsx.writeBuffer() as Promise<Buffer>;
}

async function generateProgressReportExcel(data: any): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const { project, components, drawings, statistics, options } = data;
  
  // Set workbook properties
  workbook.creator = "PipeTrak";
  workbook.title = `${project.jobNumber} Progress Report`;
  workbook.created = new Date();

  // Summary sheet
  const summarySheet = workbook.addWorksheet("Summary");
  
  // Project header
  summarySheet.mergeCells('A1:D1');
  summarySheet.getCell('A1').value = `${project.jobName} (${project.jobNumber}) Progress Report`;
  summarySheet.getCell('A1').font = { size: 16, bold: true };
  summarySheet.getCell('A1').alignment = { horizontal: 'center' };
  
  summarySheet.mergeCells('A2:D2');
  summarySheet.getCell('A2').value = `Organization: ${project.organization.name}`;
  summarySheet.getCell('A2').font = { size: 12 };
  summarySheet.getCell('A2').alignment = { horizontal: 'center' };

  summarySheet.mergeCells('A3:D3');
  summarySheet.getCell('A3').value = `Generated: ${new Date().toLocaleDateString()}`;
  summarySheet.getCell('A3').font = { size: 10 };
  summarySheet.getCell('A3').alignment = { horizontal: 'center' };

  // Overall statistics
  let currentRow = 5;
  summarySheet.getCell(`A${currentRow}`).value = "Overall Progress";
  summarySheet.getCell(`A${currentRow}`).font = { size: 14, bold: true };
  currentRow += 2;

  summarySheet.getCell(`A${currentRow}`).value = "Total Components:";
  summarySheet.getCell(`B${currentRow}`).value = statistics.overall._count;
  currentRow++;

  summarySheet.getCell(`A${currentRow}`).value = "Average Completion:";
  summarySheet.getCell(`B${currentRow}`).value = `${(statistics.overall._avg.completionPercent || 0).toFixed(1)}%`;
  currentRow++;

  summarySheet.getCell(`A${currentRow}`).value = "Total Drawings:";
  summarySheet.getCell(`B${currentRow}`).value = drawings.length;
  currentRow += 2;

  // Status breakdown
  summarySheet.getCell(`A${currentRow}`).value = "Status Breakdown";
  summarySheet.getCell(`A${currentRow}`).font = { size: 14, bold: true };
  currentRow++;

  summarySheet.getCell(`A${currentRow}`).value = "Status";
  summarySheet.getCell(`B${currentRow}`).value = "Count";
  summarySheet.getCell(`C${currentRow}`).value = "Percentage";
  summarySheet.getRow(currentRow).font = { bold: true };
  currentRow++;

  for (const stat of statistics.byStatus) {
    summarySheet.getCell(`A${currentRow}`).value = stat.status;
    summarySheet.getCell(`B${currentRow}`).value = stat._count;
    summarySheet.getCell(`C${currentRow}`).value = `${((stat._count / statistics.overall._count) * 100).toFixed(1)}%`;
    currentRow++;
  }

  // Components detail sheet
  const componentsSheet = workbook.addWorksheet("Components");
  await addComponentsToSheet(componentsSheet, components);

  // Area breakdown sheet
  if (statistics.byArea.length > 0) {
    const areaSheet = workbook.addWorksheet("By Area");
    await addStatisticsToSheet(areaSheet, statistics.byArea, "Area");
  }

  // System breakdown sheet
  if (statistics.bySystem.length > 0) {
    const systemSheet = workbook.addWorksheet("By System");
    await addStatisticsToSheet(systemSheet, statistics.bySystem, "System");
  }

  // Drawings sheet
  const drawingsSheet = workbook.addWorksheet("Drawings");
  await addDrawingsToSheet(drawingsSheet, drawings);

  return workbook.xlsx.writeBuffer() as Promise<Buffer>;
}

async function addComponentsToSheet(worksheet: ExcelJS.Worksheet, components: any[]) {
  const headers = [
    { key: "componentId", header: "Component ID", width: 20 },
    { key: "displayId", header: "Display ID", width: 25 },
    { key: "type", header: "Type", width: 15 },
    { key: "status", header: "Status", width: 12 },
    { key: "completionPercent", header: "Completion %", width: 12 },
    { key: "area", header: "Area", width: 15 },
    { key: "system", header: "System", width: 15 },
    { key: "drawing", header: "Drawing", width: 15 },
  ];

  worksheet.columns = headers;

  // Add data
  for (const component of components) {
    worksheet.addRow({
      componentId: component.componentId,
      displayId: component.displayId,
      type: component.type,
      status: component.status,
      completionPercent: component.completionPercent,
      area: component.area,
      system: component.system,
      drawing: component.drawing?.number,
    });
  }

  // Style header
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '2E86AB' }
  };
}

async function addStatisticsToSheet(worksheet: ExcelJS.Worksheet, stats: any[], groupName: string) {
  const headers = [
    { key: "group", header: groupName, width: 20 },
    { key: "count", header: "Count", width: 12 },
    { key: "avgCompletion", header: "Avg Completion %", width: 15 },
  ];

  worksheet.columns = headers;

  for (const stat of stats) {
    worksheet.addRow({
      group: stat[groupName.toLowerCase()],
      count: stat._count,
      avgCompletion: (stat._avg.completionPercent || 0).toFixed(1),
    });
  }

  // Style header
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '2E86AB' }
  };
}

async function addDrawingsToSheet(worksheet: ExcelJS.Worksheet, drawings: any[]) {
  const headers = [
    { key: "number", header: "Drawing Number", width: 20 },
    { key: "title", header: "Title", width: 30 },
    { key: "revision", header: "Revision", width: 10 },
    { key: "componentCount", header: "Components", width: 12 },
  ];

  worksheet.columns = headers;

  for (const drawing of drawings) {
    worksheet.addRow({
      number: drawing.number,
      title: drawing.title,
      revision: drawing.revision,
      componentCount: drawing._count.components,
    });
  }

  // Style header
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '2E86AB' }
  };
}

function getExportTemplate(templateId: string): any {
  const templates: Record<string, any> = {
    standard_components: {
      columns: ["componentId", "displayId", "type", "status", "completionPercent", "area", "system", "testPackage", "drawing", "description"],
      options: { includeMilestones: false, includeInstanceDetails: true },
    },
    detailed_components: {
      columns: ["componentId", "displayId", "type", "workflowType", "status", "completionPercent", "area", "system", "testPackage", "drawing", "spec", "size", "material", "pressureRating", "description"],
      options: { includeMilestones: true, includeInstanceDetails: true, includeAuditTrail: false },
    },
    milestone_tracking: {
      columns: ["componentId", "displayId", "type", "area", "system", "completionPercent", "milestones"],
      options: { includeMilestones: true, includeInstanceDetails: false },
    },
    instance_tracking: {
      columns: ["componentId", "displayId", "instanceNumber", "totalInstances", "drawing", "type", "status", "completionPercent", "area", "system"],
      options: { includeMilestones: false, includeInstanceDetails: true },
    },
  };

  return templates[templateId];
}

function buildIncludeOptions(columns: string[]): any {
  const includeOptions: any = {};

  if (columns.includes("drawing") || columns.includes("drawingNumber") || columns.includes("drawingTitle")) {
    includeOptions.drawing = {
      select: { number: true, title: true, revision: true },
    };
  }

  if (columns.includes("milestones") || columns.includes("milestoneName")) {
    includeOptions.milestones = {
      select: {
        milestoneName: true,
        isCompleted: true,
        completedAt: true,
        milestoneOrder: true,
      },
      orderBy: { milestoneOrder: "asc" },
    };
  }

  if (columns.includes("milestoneTemplate")) {
    includeOptions.milestoneTemplate = {
      select: { name: true, workflowType: true },
    };
  }

  if (columns.includes("installer")) {
    includeOptions.installer = {
      select: { name: true, email: true },
    };
  }

  return includeOptions;
}

async function generateCustomCSV(components: any[], columns: string[], options: any): Promise<string> {
  // Map columns to headers and extract values
  const headerMap: Record<string, string> = {
    componentId: "Component ID",
    displayId: "Display ID", 
    type: "Type",
    status: "Status",
    completionPercent: "Completion %",
    area: "Area",
    system: "System",
    testPackage: "Test Package",
    drawing: "Drawing",
    description: "Description",
    spec: "Specification",
    size: "Size",
    material: "Material",
    pressureRating: "Pressure Rating",
    instanceNumber: "Instance #",
    totalInstances: "Total Instances",
  };

  const headers = columns.map(col => headerMap[col] || col);
  
  const rows = components.map(component => {
    return columns.map(col => {
      switch (col) {
        case "drawing":
          return component.drawing?.number || "";
        case "instanceNumber":
          return component.instanceNumber?.toString() || "1";
        case "totalInstances":
          return component.totalInstancesOnDrawing?.toString() || "1";
        default:
          return component[col] || "";
      }
    });
  });

  // Convert to CSV
  const csvRows = [headers, ...rows];
  return csvRows.map(row => 
    row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')
  ).join('\n');
}

async function generateCustomExcel(components: any[], project: any, columns: string[], options: any): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Export");

  // Define column mappings
  const columnMap: Record<string, any> = {
    componentId: { key: "componentId", header: "Component ID", width: 20 },
    displayId: { key: "displayId", header: "Display ID", width: 25 },
    type: { key: "type", header: "Type", width: 15 },
    status: { key: "status", header: "Status", width: 12 },
    completionPercent: { key: "completionPercent", header: "Completion %", width: 12 },
    area: { key: "area", header: "Area", width: 15 },
    system: { key: "system", header: "System", width: 15 },
    testPackage: { key: "testPackage", header: "Test Package", width: 15 },
    drawing: { key: "drawing", header: "Drawing", width: 15 },
    description: { key: "description", header: "Description", width: 30 },
    spec: { key: "spec", header: "Specification", width: 20 },
    size: { key: "size", header: "Size", width: 10 },
    material: { key: "material", header: "Material", width: 15 },
    pressureRating: { key: "pressureRating", header: "Pressure Rating", width: 15 },
    instanceNumber: { key: "instanceNumber", header: "Instance #", width: 10 },
    totalInstances: { key: "totalInstances", header: "Total Instances", width: 12 },
  };

  const worksheetColumns = columns.map(col => columnMap[col]).filter(Boolean);
  worksheet.columns = worksheetColumns;

  // Add data rows
  for (const component of components) {
    const rowData: any = {};
    
    for (const col of columns) {
      switch (col) {
        case "drawing":
          rowData[col] = component.drawing?.number || "";
          break;
        case "instanceNumber":
          rowData[col] = component.instanceNumber || 1;
          break;
        case "totalInstances":
          rowData[col] = component.totalInstancesOnDrawing || 1;
          break;
        default:
          rowData[col] = component[col];
      }
    }
    
    worksheet.addRow(rowData);
  }

  // Style the header
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '2E86AB' }
  };

  return workbook.xlsx.writeBuffer() as Promise<Buffer>;
}

// Enhanced export functions for ROC and test packages

async function generateROCProgressCSV(rocData: any): Promise<string> {
  const headers = ["Category", "Total Components", "Completed Components", "Simple Completion %", "ROC Weighted %"];
  const rows = [];

  // Summary row
  const summary = rocData.summary;
  rows.push([
    "Overall",
    summary.totalComponents,
    summary.completedComponents,
    summary.overallCompletionPercent,
    summary.rocWeightedPercent
  ]);

  // Area breakdown
  if (rocData.breakdowns?.areas) {
    rocData.breakdowns.areas.forEach((area: any) => {
      rows.push([
        `Area: ${area.area}`,
        area.totalCount,
        area.completedCount,
        area.avgCompletionPercent,
        area.avgROCPercent
      ]);
    });
  }

  // System breakdown
  if (rocData.breakdowns?.systems) {
    rocData.breakdowns.systems.forEach((system: any) => {
      rows.push([
        `System: ${system.system}`,
        system.totalCount,
        system.completedCount,
        system.avgCompletionPercent,
        system.avgROCPercent
      ]);
    });
  }

  const csvRows = [headers, ...rows];
  return csvRows.map(row => 
    row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')
  ).join('\n');
}

async function generateROCProgressExcel(rocData: any, project: any, options: any): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  
  // Set workbook properties
  workbook.creator = "PipeTrak";
  workbook.title = `${project.jobNumber} ROC Progress Report`;
  workbook.created = new Date();

  // Summary sheet
  const summarySheet = workbook.addWorksheet("ROC Summary");
  
  // Project header
  summarySheet.mergeCells('A1:F1');
  summarySheet.getCell('A1').value = `${project.jobName} (${project.jobNumber}) ROC Progress Report`;
  summarySheet.getCell('A1').font = { size: 16, bold: true };
  summarySheet.getCell('A1').alignment = { horizontal: 'center' };

  // ROC configuration
  let currentRow = 3;
  summarySheet.getCell(`A${currentRow}`).value = "ROC Configuration (Milestone Weights):";
  summarySheet.getCell(`A${currentRow}`).font = { bold: true };
  currentRow++;

  if (rocData.summary?.rocConfiguration) {
    Object.entries(rocData.summary.rocConfiguration).forEach(([milestone, weight]) => {
      summarySheet.getCell(`B${currentRow}`).value = `${milestone}: ${weight}%`;
      currentRow++;
    });
  }
  currentRow++;

  // Overall summary
  summarySheet.getCell(`A${currentRow}`).value = "Overall Progress Summary";
  summarySheet.getCell(`A${currentRow}`).font = { size: 14, bold: true };
  currentRow += 2;

  const summaryHeaders = ["Metric", "Value"];
  summaryHeaders.forEach((header, index) => {
    const cell = summarySheet.getCell(currentRow, index + 1);
    cell.value = header;
    cell.font = { bold: true };
  });
  currentRow++;

  const summaryData = [
    ["Total Components", rocData.summary.totalComponents],
    ["Completed Components", rocData.summary.completedComponents],
    ["Simple Completion %", `${rocData.summary.overallCompletionPercent}%`],
    ["ROC Weighted %", `${rocData.summary.rocWeightedPercent}%`],
  ];

  summaryData.forEach((row) => {
    row.forEach((value, index) => {
      summarySheet.getCell(currentRow, index + 1).value = value;
    });
    currentRow++;
  });

  // Area breakdown sheet
  if (rocData.breakdowns?.areas?.length > 0) {
    const areaSheet = workbook.addWorksheet("Areas");
    await addBreakdownToSheet(areaSheet, rocData.breakdowns.areas, "Area");
  }

  // System breakdown sheet
  if (rocData.breakdowns?.systems?.length > 0) {
    const systemSheet = workbook.addWorksheet("Systems");
    await addBreakdownToSheet(systemSheet, rocData.breakdowns.systems, "System");
  }

  // Test package breakdown sheet
  if (rocData.breakdowns?.testPackages?.length > 0) {
    const testPackageSheet = workbook.addWorksheet("Test Packages");
    await addBreakdownToSheet(testPackageSheet, rocData.breakdowns.testPackages, "Test Package");
  }

  return workbook.xlsx.writeBuffer() as Promise<Buffer>;
}

async function generateROCProgressPDF(rocData: any, project: any, options: any): Promise<Buffer> {
  // For PDF generation, we'll use a simple HTML-to-PDF approach
  // In a production environment, you'd use a library like puppeteer or similar
  const htmlContent = `
    <html>
    <head>
      <title>${project.jobNumber} ROC Progress Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin-bottom: 20px; }
        .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .summary-box { background-color: #f9f9f9; padding: 15px; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${project.jobName} (${project.jobNumber})</h1>
        <h2>ROC Progress Report</h2>
        <p>Generated: ${new Date().toLocaleDateString()}</p>
      </div>

      <div class="section">
        <div class="section-title">Overall Progress Summary</div>
        <div class="summary-box">
          <p><strong>Total Components:</strong> ${rocData.summary.totalComponents}</p>
          <p><strong>Completed Components:</strong> ${rocData.summary.completedComponents}</p>
          <p><strong>Simple Completion:</strong> ${rocData.summary.overallCompletionPercent}%</p>
          <p><strong>ROC Weighted Progress:</strong> ${rocData.summary.rocWeightedPercent}%</p>
        </div>
      </div>

      ${rocData.breakdowns?.areas?.length > 0 ? `
      <div class="section">
        <div class="section-title">Area Breakdown</div>
        <table>
          <thead>
            <tr>
              <th>Area</th>
              <th>Total</th>
              <th>Completed</th>
              <th>Simple %</th>
              <th>ROC %</th>
            </tr>
          </thead>
          <tbody>
            ${rocData.breakdowns.areas.map((area: any) => `
              <tr>
                <td>${area.area}</td>
                <td>${area.totalCount}</td>
                <td>${area.completedCount}</td>
                <td>${area.avgCompletionPercent}%</td>
                <td>${area.avgROCPercent}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}
    </body>
    </html>
  `;

  // For now, return a placeholder PDF (in production, use proper PDF generation)
  return Buffer.from(htmlContent);
}

async function generateTestPackageCSV(testPackageData: any, options: any): Promise<string> {
  const headers = [
    "Test Package", "Total Components", "Completed", "Ready Status", 
    "Completion %", "Blocking Components", "Estimated Days to Ready"
  ];
  
  const rows = testPackageData.testPackages.map((pkg: any) => [
    pkg.packageId,
    pkg.totalComponents,
    pkg.completedComponents,
    pkg.readinessStatus,
    pkg.avgCompletionPercent,
    pkg.blockingComponents?.length || 0,
    pkg.estimatedDaysToReady || "N/A"
  ]);

  const csvRows = [headers, ...rows];
  return csvRows.map(row => 
    row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')
  ).join('\n');
}

async function generateTestPackageExcel(testPackageData: any, project: any, options: any): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "PipeTrak";
  workbook.title = `${project.jobNumber} Test Package Readiness`;

  // Summary sheet
  const summarySheet = workbook.addWorksheet("Summary");
  
  summarySheet.mergeCells('A1:G1');
  summarySheet.getCell('A1').value = `${project.jobName} Test Package Readiness Report`;
  summarySheet.getCell('A1').font = { size: 16, bold: true };
  summarySheet.getCell('A1').alignment = { horizontal: 'center' };

  // Overall statistics
  const summary = testPackageData.summary;
  let currentRow = 3;
  
  const summaryData = [
    ["Total Test Packages", summary.totalTestPackages],
    ["Ready Packages", summary.readyPackages],
    ["Nearly Ready Packages", summary.nearlyReadyPackages],
    ["In Progress Packages", summary.inProgressPackages],
    ["Not Started Packages", summary.notStartedPackages],
    ["Overall Readiness %", `${summary.overallReadinessPercent}%`]
  ];

  summaryData.forEach(([label, value]) => {
    summarySheet.getCell(`A${currentRow}`).value = label;
    summarySheet.getCell(`B${currentRow}`).value = value;
    summarySheet.getCell(`A${currentRow}`).font = { bold: true };
    currentRow++;
  });

  // Detailed test packages sheet
  const detailSheet = workbook.addWorksheet("Test Packages");
  
  const headers = [
    { key: "packageId", header: "Test Package", width: 20 },
    { key: "totalComponents", header: "Total Components", width: 15 },
    { key: "completedComponents", header: "Completed", width: 12 },
    { key: "readinessStatus", header: "Status", width: 15 },
    { key: "avgCompletionPercent", header: "Completion %", width: 12 },
    { key: "blockingCount", header: "Blocking Components", width: 18 },
    { key: "estimatedDaysToReady", header: "Est. Days to Ready", width: 16 }
  ];

  detailSheet.columns = headers;

  testPackageData.testPackages.forEach((pkg: any) => {
    detailSheet.addRow({
      packageId: pkg.packageId,
      totalComponents: pkg.totalComponents,
      completedComponents: pkg.completedComponents,
      readinessStatus: pkg.readinessStatus,
      avgCompletionPercent: pkg.avgCompletionPercent,
      blockingCount: pkg.blockingComponents?.length || 0,
      estimatedDaysToReady: pkg.estimatedDaysToReady || "Ready"
    });
  });

  // Style headers
  [summarySheet, detailSheet].forEach(sheet => {
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '2E86AB' }
    };
  });

  // Blocking components sheet if requested
  if (options.includeBlockingDetails) {
    const blockingSheet = workbook.addWorksheet("Blocking Components");
    
    const blockingHeaders = [
      { key: "testPackage", header: "Test Package", width: 20 },
      { key: "componentId", header: "Component ID", width: 20 },
      { key: "type", header: "Type", width: 15 },
      { key: "area", header: "Area", width: 15 },
      { key: "status", header: "Status", width: 12 },
      { key: "completionPercent", header: "Completion %", width: 12 },
      { key: "blockingMilestones", header: "Blocking Milestones", width: 25 }
    ];

    blockingSheet.columns = blockingHeaders;

    testPackageData.testPackages.forEach((pkg: any) => {
      if (pkg.blockingComponents?.length > 0) {
        pkg.blockingComponents.forEach((component: any) => {
          const blockingMilestones = component.blockingMilestones
            ?.map((m: any) => m.milestoneName)
            .join(', ') || '';

          blockingSheet.addRow({
            testPackage: pkg.packageId,
            componentId: component.componentId,
            type: component.type,
            area: component.area,
            status: component.status,
            completionPercent: component.completionPercent,
            blockingMilestones
          });
        });
      }
    });

    // Style blocking sheet header
    const blockingHeaderRow = blockingSheet.getRow(1);
    blockingHeaderRow.font = { bold: true };
    blockingHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '2E86AB' }
    };
  }

  return workbook.xlsx.writeBuffer() as Promise<Buffer>;
}

async function generateTestPackagePDF(testPackageData: any, project: any, options: any): Promise<Buffer> {
  // Simplified PDF content generation
  const htmlContent = `
    <html>
    <head>
      <title>${project.jobNumber} Test Package Readiness</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .ready { background-color: #d4edda; }
        .nearly-ready { background-color: #fff3cd; }
        .in-progress { background-color: #cce5ff; }
        .not-started { background-color: #f8d7da; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${project.jobName} Test Package Readiness</h1>
        <p>Generated: ${new Date().toLocaleDateString()}</p>
      </div>

      <h2>Summary</h2>
      <ul>
        <li>Total Test Packages: ${testPackageData.summary.totalTestPackages}</li>
        <li>Ready: ${testPackageData.summary.readyPackages}</li>
        <li>Nearly Ready: ${testPackageData.summary.nearlyReadyPackages}</li>
        <li>Overall Readiness: ${testPackageData.summary.overallReadinessPercent}%</li>
      </ul>

      <h2>Test Package Details</h2>
      <table>
        <thead>
          <tr>
            <th>Test Package</th>
            <th>Status</th>
            <th>Components</th>
            <th>Completion %</th>
            <th>Est. Days to Ready</th>
          </tr>
        </thead>
        <tbody>
          ${testPackageData.testPackages.map((pkg: any) => `
            <tr class="${pkg.readinessStatus.replace('_', '-')}">
              <td>${pkg.packageId}</td>
              <td>${pkg.readinessStatus.replace('_', ' ').toUpperCase()}</td>
              <td>${pkg.completedComponents}/${pkg.totalComponents}</td>
              <td>${pkg.avgCompletionPercent}%</td>
              <td>${pkg.estimatedDaysToReady || 'Ready'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  // Return HTML content as buffer (in production, convert to actual PDF)
  return Buffer.from(htmlContent);
}

async function addBreakdownToSheet(worksheet: ExcelJS.Worksheet, breakdownData: any[], categoryName: string) {
  const headers = [
    { key: "category", header: categoryName, width: 20 },
    { key: "totalCount", header: "Total", width: 12 },
    { key: "completedCount", header: "Completed", width: 12 },
    { key: "simplePercent", header: "Simple %", width: 12 },
    { key: "rocPercent", header: "ROC %", width: 12 }
  ];

  worksheet.columns = headers;

  breakdownData.forEach((item: any) => {
    worksheet.addRow({
      category: item[categoryName.toLowerCase()],
      totalCount: item.totalCount,
      completedCount: item.completedCount,
      simplePercent: item.avgCompletionPercent,
      rocPercent: item.avgROCPercent
    });
  });

  // Style the header
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '2E86AB' }
  };
}

async function generateStreamedExcel(
  projectId: string, 
  filters: any, 
  options: any, 
  project: any, 
  chunkSize: number
): Promise<Buffer> {
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
    filename: `/tmp/streamed_${projectId}.xlsx`
  });

  const worksheet = workbook.addWorksheet("Components", {
    pageSetup: { paperSize: 9, orientation: 'landscape' }
  });

  // Define headers
  const headers = [
    { key: "componentId", header: "Component ID", width: 20 },
    { key: "displayId", header: "Display ID", width: 25 },
    { key: "type", header: "Type", width: 15 },
    { key: "status", header: "Status", width: 12 },
    { key: "completionPercent", header: "Completion %", width: 12 },
    { key: "area", header: "Area", width: 15 },
    { key: "system", header: "System", width: 15 },
    { key: "testPackage", header: "Test Package", width: 15 }
  ];

  worksheet.columns = headers;

  // Style header
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '2E86AB' }
  };
  headerRow.commit();

  // Stream data in chunks
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const componentChunk = await getComponentChunk(projectId, filters, options, offset, chunkSize);
    
    if (componentChunk.length === 0) {
      hasMore = false;
      break;
    }

    for (const component of componentChunk) {
      worksheet.addRow({
        componentId: component.componentId,
        displayId: component.displayId,
        type: component.type,
        status: component.status,
        completionPercent: component.completionPercent,
        area: component.area,
        system: component.system,
        testPackage: component.testPackage
      }).commit();
    }

    offset += chunkSize;
    hasMore = componentChunk.length === chunkSize;
  }

  await workbook.commit();

  // Read the file back as buffer
  const fs = require('fs');
  const buffer = fs.readFileSync(`/tmp/streamed_${projectId}.xlsx`);
  
  // Clean up temp file
  fs.unlinkSync(`/tmp/streamed_${projectId}.xlsx`);
  
  return buffer;
}

async function getComponentChunk(
  projectId: string, 
  filters: any, 
  options: any, 
  offset: number, 
  limit: number
): Promise<any[]> {
  // Build where clause based on filters
  const where: any = {
    projectId,
    status: { not: "DELETED" },
  };

  if (filters.drawingId) where.drawingId = filters.drawingId;
  if (filters.area) where.area = filters.area;
  if (filters.system) where.system = filters.system;
  if (filters.testPackage) where.testPackage = filters.testPackage;
  if (filters.status) where.status = filters.status;
  if (filters.type) where.type = filters.type;

  if (filters.completionRange) {
    where.completionPercent = {
      gte: filters.completionRange.min,
      lte: filters.completionRange.max,
    };
  }

  const components = await prisma.component.findMany({
    where,
    select: {
      id: true,
      componentId: true,
      displayId: true,
      type: true,
      status: true,
      completionPercent: true,
      area: true,
      system: true,
      testPackage: true,
      drawing: {
        select: { number: true }
      }
    },
    orderBy: { componentId: "asc" },
    skip: offset,
    take: limit
  });

  return components;
}

// Progress Summary Report Export Functions (new)

async function generateProgressSummaryCSV(reportData: any): Promise<string> {
  const { currentWeekData, previousWeekData, options, groupBy } = reportData;
  
  // Calculate deltas
  const deltaMap = calculateProgressDeltas(currentWeekData, previousWeekData);
  
  // Determine column headers based on grouping
  const groupColumn = groupBy === 'testPackage' ? 'Test Package' : 
                     groupBy === 'system' ? 'System' : 'Area';
  
  const headers = [
    groupColumn, 'Budget', 'Received', 'Installed', 'Punched', 'Tested', 'Restored', 'Total'
  ];
  
  if (options.showDeltas) {
    headers.splice(2, 0, 'Received Δ', 'Installed Δ', 'Punched Δ', 'Tested Δ', 'Restored Δ', 'Total Δ');
  }
  
  const rows: string[][] = [];
  
  // Data rows
  currentWeekData.forEach((row: any) => {
    const key = row.area || row.system || row.test_package;
    const delta = deltaMap[key] || {};
    
    const dataRow = [
      key,
      row.component_count?.toString() || '0',
      `${row.received_percent || 0}%`,
      `${row.installed_percent || 0}%`,
      `${row.punched_percent || 0}%`,
      `${row.tested_percent || 0}%`,
      `${row.restored_percent || 0}%`,
      `${row.overall_percent || 0}%`
    ];
    
    if (options.showDeltas) {
      dataRow.splice(2, 0, 
        formatDelta(delta.received),
        formatDelta(delta.installed),
        formatDelta(delta.punched),
        formatDelta(delta.tested),
        formatDelta(delta.restored),
        formatDelta(delta.overall)
      );
    }
    
    rows.push(dataRow);
  });
  
  // Add total row if requested
  if (options.includeGrandTotal) {
    const totalComponents = currentWeekData.reduce((sum: number, row: any) => sum + Number(row.component_count), 0);
    const totalRow = ['TOTAL', totalComponents.toString()];
    
    // Calculate weighted averages for totals
    const weightedTotals = calculateWeightedTotals(currentWeekData);
    totalRow.push(
      `${weightedTotals.received}%`,
      `${weightedTotals.installed}%`,
      `${weightedTotals.punched}%`,
      `${weightedTotals.tested}%`,
      `${weightedTotals.restored}%`,
      `${weightedTotals.overall}%`
    );
    
    rows.push(totalRow);
  }
  
  // Convert to CSV format
  const csvRows = [headers, ...rows];
  return csvRows.map(row => 
    row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')
  ).join('\n');
}

async function generateProgressSummaryExcel(reportData: any): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const { currentWeekData, previousWeekData, options, groupBy, projectName, jobNumber, weekEnding } = reportData;
  
  // Set workbook properties
  workbook.creator = "PipeTrak";
  workbook.title = `Progress Summary Report - ${jobNumber}`;
  workbook.created = new Date();
  
  // Calculate deltas
  const deltaMap = calculateProgressDeltas(currentWeekData, previousWeekData);
  
  // Main summary sheet
  const worksheet = workbook.addWorksheet("Progress Summary");
  
  // Report header
  worksheet.mergeCells('A1:H1');
  worksheet.getCell('A1').value = `PipeTrak Progress Report`;
  worksheet.getCell('A1').font = { size: 18, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };
  
  worksheet.mergeCells('A2:H2');
  worksheet.getCell('A2').value = `Project: ${projectName} (${jobNumber})`;
  worksheet.getCell('A2').font = { size: 14, bold: true };
  worksheet.getCell('A2').alignment = { horizontal: 'center' };
  
  worksheet.mergeCells('A3:H3');
  worksheet.getCell('A3').value = `Week Ending: ${weekEnding}`;
  worksheet.getCell('A3').font = { size: 12 };
  worksheet.getCell('A3').alignment = { horizontal: 'center' };
  
  // Determine report status (locked vs preliminary)
  const tuesday9AM = new Date(weekEnding);
  tuesday9AM.setDate(tuesday9AM.getDate() + 2);
  tuesday9AM.setHours(9, 0, 0, 0);
  const isLocked = new Date() > tuesday9AM;
  
  worksheet.mergeCells('A4:H4');
  worksheet.getCell('A4').value = `Report Status: ${isLocked ? 'FINAL' : 'PRELIMINARY'} ${isLocked ? `(Locked ${tuesday9AM.toLocaleDateString()}, 9:00 AM)` : ''}`;
  worksheet.getCell('A4').font = { size: 10, italic: true };
  worksheet.getCell('A4').alignment = { horizontal: 'center' };
  
  worksheet.mergeCells('A5:H5');
  worksheet.getCell('A5').value = `Generated: ${new Date().toLocaleDateString()}, ${new Date().toLocaleTimeString()}`;
  worksheet.getCell('A5').font = { size: 10 };
  worksheet.getCell('A5').alignment = { horizontal: 'center' };
  
  // Progress table starts at row 7
  let currentRow = 7;
  
  // Table header
  const groupColumn = groupBy === 'testPackage' ? 'Test Package' : 
                     groupBy === 'system' ? 'System' : 'Area';
  
  worksheet.getCell(`A${currentRow}`).value = `Progress by ${groupColumn}:`;
  worksheet.getCell(`A${currentRow}`).font = { size: 14, bold: true };
  currentRow += 2;
  
  // Column headers
  const headers = [
    { key: 'group', header: groupColumn, width: 15 },
    { key: 'budget', header: 'Budget', width: 10 },
    { key: 'received', header: 'Received', width: 12 },
    { key: 'installed', header: 'Installed', width: 12 },
    { key: 'punched', header: 'Punched', width: 12 },
    { key: 'tested', header: 'Tested', width: 12 },
    { key: 'restored', header: 'Restored', width: 12 },
    { key: 'total', header: 'Total', width: 12 }
  ];
  
  // Set column definitions
  worksheet.columns = headers;
  
  // Add header row at current position
  const headerRow = worksheet.getRow(currentRow);
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header.header;
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '2E86AB' }
    };
    cell.alignment = { horizontal: 'center' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  currentRow++;
  
  // Data rows
  currentWeekData.forEach((row: any) => {
    const key = row.area || row.system || row.test_package;
    const delta = deltaMap[key] || {};
    
    const dataRow = worksheet.getRow(currentRow);
    
    // Main values
    dataRow.getCell(1).value = key;
    dataRow.getCell(2).value = Number(row.component_count || 0);
    dataRow.getCell(3).value = `${Math.round(row.received_percent || 0)}%`;
    dataRow.getCell(4).value = `${Math.round(row.installed_percent || 0)}%`;
    dataRow.getCell(5).value = `${Math.round(row.punched_percent || 0)}%`;
    dataRow.getCell(6).value = `${Math.round(row.tested_percent || 0)}%`;
    dataRow.getCell(7).value = `${Math.round(row.restored_percent || 0)}%`;
    dataRow.getCell(8).value = `${Math.round(row.overall_percent || 0)}%`;
    
    // Style main values
    for (let col = 1; col <= 8; col++) {
      const cell = dataRow.getCell(col);
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      if (col === 1 || col === 2) {
        cell.alignment = { horizontal: 'left' };
      } else {
        cell.alignment = { horizontal: 'center' };
        cell.font = { bold: true };
      }
    }
    currentRow++;
    
    // Delta row if showing deltas
    if (options.showDeltas) {
      const deltaRow = worksheet.getRow(currentRow);
      deltaRow.getCell(1).value = '';
      deltaRow.getCell(2).value = '';
      deltaRow.getCell(3).value = formatDelta(delta.received);
      deltaRow.getCell(4).value = formatDelta(delta.installed);
      deltaRow.getCell(5).value = formatDelta(delta.punched);
      deltaRow.getCell(6).value = formatDelta(delta.tested);
      deltaRow.getCell(7).value = formatDelta(delta.restored);
      deltaRow.getCell(8).value = formatDelta(delta.overall);
      
      // Style delta row
      for (let col = 3; col <= 8; col++) {
        const cell = deltaRow.getCell(col);
        cell.font = { size: 9, color: { argb: '666666' } };
        cell.alignment = { horizontal: 'center' };
        const deltaValue = delta[['received', 'installed', 'punched', 'tested', 'restored', 'overall'][col-3]];
        if (deltaValue > 0) {
          cell.font.color = { argb: '008000' }; // Green for positive
        } else if (deltaValue < 0) {
          cell.font.color = { argb: 'FF0000' }; // Red for negative
        }
      }
      currentRow++;
    }
  });
  
  // Add total row if requested
  if (options.includeGrandTotal) {
    const totalComponents = currentWeekData.reduce((sum: number, row: any) => sum + Number(row.component_count), 0);
    const weightedTotals = calculateWeightedTotals(currentWeekData);
    
    const totalRow = worksheet.getRow(currentRow);
    totalRow.getCell(1).value = 'TOTAL';
    totalRow.getCell(2).value = totalComponents;
    totalRow.getCell(3).value = `${weightedTotals.received}%`;
    totalRow.getCell(4).value = `${weightedTotals.installed}%`;
    totalRow.getCell(5).value = `${weightedTotals.punched}%`;
    totalRow.getCell(6).value = `${weightedTotals.tested}%`;
    totalRow.getCell(7).value = `${weightedTotals.restored}%`;
    totalRow.getCell(8).value = `${weightedTotals.overall}%`;
    
    // Style total row
    for (let col = 1; col <= 8; col++) {
      const cell = totalRow.getCell(col);
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F0F0F0' }
      };
      cell.border = {
        top: { style: 'medium' },
        left: { style: 'thin' },
        bottom: { style: 'medium' },
        right: { style: 'thin' }
      };
      cell.alignment = { horizontal: col <= 2 ? 'left' : 'center' };
    }
  }
  
  // Add raw percentages sheet for P6 import
  const rawDataSheet = workbook.addWorksheet("P6 Import Data");
  rawDataSheet.columns = [
    { key: 'group', header: groupColumn, width: 15 },
    { key: 'received', header: 'Received %', width: 12 },
    { key: 'installed', header: 'Installed %', width: 12 },
    { key: 'punched', header: 'Punched %', width: 12 },
    { key: 'tested', header: 'Tested %', width: 12 },
    { key: 'restored', header: 'Restored %', width: 12 },
    { key: 'overall', header: 'Overall %', width: 12 }
  ];
  
  // Add raw data
  currentWeekData.forEach((row: any) => {
    const key = row.area || row.system || row.test_package;
    rawDataSheet.addRow({
      group: key,
      received: Number(row.received_percent || 0),
      installed: Number(row.installed_percent || 0),
      punched: Number(row.punched_percent || 0),
      tested: Number(row.tested_percent || 0),
      restored: Number(row.restored_percent || 0),
      overall: Number(row.overall_percent || 0)
    });
  });
  
  // Style raw data sheet header
  const rawHeaderRow = rawDataSheet.getRow(1);
  rawHeaderRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  rawHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '2E86AB' }
  };
  
  // Add metadata sheet
  const metadataSheet = workbook.addWorksheet("Metadata");
  metadataSheet.addRows([
    ['Report Type', 'Progress Summary Report'],
    ['Generated By', 'PipeTrak'],
    ['Project ID', reportData.projectId],
    ['Project Name', projectName],
    ['Job Number', jobNumber],
    ['Organization', reportData.organization],
    ['Week Ending', weekEnding],
    ['Group By', groupBy],
    ['Show Deltas', options.showDeltas],
    ['Include Zero Progress', options.includeZeroProgress],
    ['Include Subtotals', options.includeSubtotals],
    ['Include Grand Total', options.includeGrandTotal],
    ['Generated At', new Date().toISOString()],
    ['Report Status', isLocked ? 'FINAL' : 'PRELIMINARY'],
    ['Data Cutoff', isLocked ? tuesday9AM.toISOString() : 'N/A']
  ]);
  
  return workbook.xlsx.writeBuffer() as Promise<Buffer>;
}

async function generateProgressSummaryPDF(reportData: any): Promise<Buffer> {
  const { currentWeekData, options, groupBy, projectName, jobNumber, weekEnding, organization } = reportData;
  
  // Calculate weighted totals for summary
  const weightedTotals = calculateWeightedTotals(currentWeekData);
  const totalComponents = currentWeekData.reduce((sum: number, row: any) => sum + Number(row.component_count), 0);
  
  // Determine group column name
  const groupColumn = groupBy === 'testPackage' ? 'Test Package' : 
                     groupBy === 'system' ? 'System' : 'Area';
  
  // Determine report status
  const tuesday9AM = new Date(weekEnding);
  tuesday9AM.setDate(tuesday9AM.getDate() + 2);
  tuesday9AM.setHours(9, 0, 0, 0);
  const isLocked = new Date() > tuesday9AM;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>PipeTrak Progress Report - ${jobNumber}</title>
      <style>
        @page { 
          size: landscape; 
          margin: 0.5in;
          @bottom-right {
            content: "Page " counter(page) " of " counter(pages);
            font-size: 10pt;
          }
        }
        body { 
          font-family: Arial, sans-serif; 
          font-size: 10pt;
          line-height: 1.2;
          margin: 0;
          padding: 0;
        }
        .header { 
          text-align: center; 
          margin-bottom: 20px; 
          border-bottom: 2px solid #2E86AB;
          padding-bottom: 10px;
        }
        .header h1 { 
          font-size: 18pt; 
          margin: 0 0 5px 0; 
          color: #2E86AB;
        }
        .header h2 { 
          font-size: 14pt; 
          margin: 0 0 5px 0; 
        }
        .header p { 
          font-size: 10pt; 
          margin: 2px 0; 
        }
        .report-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
          font-size: 9pt;
        }
        .status-final { color: #008000; font-weight: bold; }
        .status-preliminary { color: #FF8C00; font-weight: bold; }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 15px;
          font-size: 10pt;
        }
        th, td { 
          border: 1px solid #ddd; 
          padding: 6px; 
          text-align: center; 
        }
        th { 
          background-color: #2E86AB; 
          color: white;
          font-weight: bold;
          font-size: 9pt;
        }
        td:first-child { 
          text-align: left; 
          font-weight: bold;
        }
        .delta-row { 
          font-size: 8pt; 
          color: #666; 
          font-style: italic;
        }
        .delta-positive { color: #008000; }
        .delta-negative { color: #FF0000; }
        .delta-zero { color: #666; }
        .total-row { 
          background-color: #f0f0f0; 
          font-weight: bold;
          border-top: 2px solid #2E86AB;
        }
        .summary-stats {
          display: flex;
          justify-content: space-around;
          margin-bottom: 20px;
          text-align: center;
        }
        .stat-box {
          border: 1px solid #ddd;
          padding: 10px;
          border-radius: 5px;
          flex: 1;
          margin: 0 5px;
        }
        .stat-value {
          font-size: 16pt;
          font-weight: bold;
          color: #2E86AB;
        }
        .stat-label {
          font-size: 9pt;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>PipeTrak Progress Report</h1>
        <h2>Project: ${projectName} (${jobNumber})</h2>
        <p>Week Ending: Sunday, ${new Date(weekEnding).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p class="${isLocked ? 'status-final' : 'status-preliminary'}">
          Report Status: ${isLocked ? 'FINAL' : 'PRELIMINARY'} 
          ${isLocked ? `(Locked ${tuesday9AM.toLocaleDateString()}, 9:00 AM)` : ''}
        </p>
        <p>Generated: ${new Date().toLocaleDateString()}, ${new Date().toLocaleTimeString()}</p>
      </div>
      
      <div class="summary-stats">
        <div class="stat-box">
          <div class="stat-value">${totalComponents}</div>
          <div class="stat-label">Total Components</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${weightedTotals.received}%</div>
          <div class="stat-label">Received</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${weightedTotals.installed}%</div>
          <div class="stat-label">Installed</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${weightedTotals.tested}%</div>
          <div class="stat-label">Tested</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${weightedTotals.overall}%</div>
          <div class="stat-label">Overall Progress</div>
        </div>
      </div>

      <h3>Progress by ${groupColumn}:</h3>
      <table>
        <thead>
          <tr>
            <th>${groupColumn}</th>
            <th>Budget</th>
            <th>Received</th>
            <th>Installed</th>
            <th>Punched</th>
            <th>Tested</th>
            <th>Restored</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${currentWeekData.map((row: any) => {
            const key = row.area || row.system || row.test_package;
            return `
              <tr>
                <td>${key}</td>
                <td>${row.component_count}</td>
                <td>${Math.round(row.received_percent || 0)}%</td>
                <td>${Math.round(row.installed_percent || 0)}%</td>
                <td>${Math.round(row.punched_percent || 0)}%</td>
                <td>${Math.round(row.tested_percent || 0)}%</td>
                <td>${Math.round(row.restored_percent || 0)}%</td>
                <td>${Math.round(row.overall_percent || 0)}%</td>
              </tr>
            `;
          }).join('')}
          ${options.includeGrandTotal ? `
          <tr class="total-row">
            <td>TOTAL</td>
            <td>${totalComponents}</td>
            <td>${weightedTotals.received}%</td>
            <td>${weightedTotals.installed}%</td>
            <td>${weightedTotals.punched}%</td>
            <td>${weightedTotals.tested}%</td>
            <td>${weightedTotals.restored}%</td>
            <td>${weightedTotals.overall}%</td>
          </tr>
          ` : ''}
        </tbody>
      </table>

      <div style="margin-top: 30px; font-size: 9pt; color: #666; border-top: 1px solid #ddd; padding-top: 10px;">
        <p><strong>Notes:</strong></p>
        <ul>
          <li>Progress percentages represent completion of milestone activities for components in each ${groupColumn.toLowerCase()}.</li>
          <li>Data reflects work completed through ${new Date(weekEnding).toLocaleDateString()}.</li>
          <li>Report generated using PipeTrak construction progress tracking system.</li>
          ${!isLocked ? '<li><strong>PRELIMINARY:</strong> Data may be updated until Tuesday 9:00 AM cutoff.</li>' : ''}
        </ul>
      </div>
    </body>
    </html>
  `;

  // For now, return HTML content as buffer (in production, use proper PDF generation library like puppeteer)
  return Buffer.from(htmlContent);
}

// Helper functions for Progress Summary Report

function calculateProgressDeltas(currentData: any[], previousData: any[]): any {
  if (!previousData || previousData.length === 0) return {};
  
  const deltaMap: any = {};
  const previousMap = new Map();
  
  // Create map of previous week data by key
  previousData.forEach((row: any) => {
    const key = row.area || row.system || row.test_package;
    previousMap.set(key, row);
  });
  
  // Calculate deltas for current week data
  currentData.forEach((currentRow: any) => {
    const key = currentRow.area || currentRow.system || currentRow.test_package;
    const previousRow = previousMap.get(key);
    
    if (previousRow) {
      deltaMap[key] = {
        received: Number(currentRow.received_percent) - Number(previousRow.received_percent),
        installed: Number(currentRow.installed_percent) - Number(previousRow.installed_percent),
        punched: Number(currentRow.punched_percent) - Number(previousRow.punched_percent),
        tested: Number(currentRow.tested_percent) - Number(previousRow.tested_percent),
        restored: Number(currentRow.restored_percent) - Number(previousRow.restored_percent),
        overall: Number(currentRow.overall_percent) - Number(previousRow.overall_percent),
      };
    } else {
      // New entry, all values are deltas from 0
      deltaMap[key] = {
        received: Number(currentRow.received_percent),
        installed: Number(currentRow.installed_percent),
        punched: Number(currentRow.punched_percent),
        tested: Number(currentRow.tested_percent),
        restored: Number(currentRow.restored_percent),
        overall: Number(currentRow.overall_percent),
      };
    }
  });
  
  return deltaMap;
}

function calculateWeightedTotals(data: any[]): any {
  if (!data || data.length === 0) return {
    received: 0, installed: 0, punched: 0, tested: 0, restored: 0, overall: 0
  };
  
  let totalComponents = 0;
  let weightedReceived = 0;
  let weightedInstalled = 0;
  let weightedPunched = 0;
  let weightedTested = 0;
  let weightedRestored = 0;
  let weightedOverall = 0;
  
  data.forEach((row: any) => {
    const componentCount = Number(row.component_count);
    totalComponents += componentCount;
    
    weightedReceived += (componentCount * Number(row.received_percent || 0));
    weightedInstalled += (componentCount * Number(row.installed_percent || 0));
    weightedPunched += (componentCount * Number(row.punched_percent || 0));
    weightedTested += (componentCount * Number(row.tested_percent || 0));
    weightedRestored += (componentCount * Number(row.restored_percent || 0));
    weightedOverall += (componentCount * Number(row.overall_percent || 0));
  });
  
  if (totalComponents === 0) {
    return { received: 0, installed: 0, punched: 0, tested: 0, restored: 0, overall: 0 };
  }
  
  return {
    received: Math.round((weightedReceived / totalComponents) * 100) / 100,
    installed: Math.round((weightedInstalled / totalComponents) * 100) / 100,
    punched: Math.round((weightedPunched / totalComponents) * 100) / 100,
    tested: Math.round((weightedTested / totalComponents) * 100) / 100,
    restored: Math.round((weightedRestored / totalComponents) * 100) / 100,
    overall: Math.round((weightedOverall / totalComponents) * 100) / 100,
  };
}

function formatDelta(delta: number | undefined): string {
  if (!delta || delta === 0) return '(0%)';
  const sign = delta > 0 ? '+' : '';
  return `(${sign}${Math.round(delta)}%)`;
}