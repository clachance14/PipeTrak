import { db as prisma } from "@repo/database";
import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth";
import { broadcastReportGeneration } from "./realtime";

// Progress Summary Report specific schema (new)
const ProgressSummaryReportSchema = z.object({
	projectId: z.string(),
	weekEnding: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format")
		.optional(),
	groupBy: z.enum(["area", "system", "testPackage", "iwp"]).default("area"),
	options: z
		.object({
			showDeltas: z.boolean().default(true),
			includeZeroProgress: z.boolean().default(true),
			includeSubtotals: z.boolean().default(true),
			includeGrandTotal: z.boolean().default(true),
		})
		.optional()
		.default({}),
	outputFormat: z.enum(["json", "pdf", "excel", "csv"]).default("json"),
});

// Report generation schemas
const ProgressReportSchema = z.object({
	projectId: z.string(),
	filters: z
		.object({
			areas: z.array(z.string()).optional(),
			systems: z.array(z.string()).optional(),
			testPackages: z.array(z.string()).optional(),
			componentTypes: z.array(z.string()).optional(),
			statuses: z.array(z.string()).optional(),
			completionRange: z
				.object({
					min: z.number().min(0).max(100),
					max: z.number().min(0).max(100),
				})
				.optional(),
			dateRange: z
				.object({
					start: z.string().datetime(),
					end: z.string().datetime(),
				})
				.optional(),
		})
		.optional()
		.default({}),
	options: z
		.object({
			includeTrends: z.boolean().default(true),
			includeVelocity: z.boolean().default(true),
			includeForecasts: z.boolean().default(false),
			cacheTimeout: z.number().min(60).max(3600).default(300), // 5 minutes default
		})
		.optional()
		.default({}),
});

const ComponentDetailsSchema = z.object({
	projectId: z.string(),
	filters: z
		.object({
			areas: z.array(z.string()).optional(),
			systems: z.array(z.string()).optional(),
			testPackages: z.array(z.string()).optional(),
			statuses: z.array(z.string()).optional(),
			componentTypes: z.array(z.string()).optional(),
			completionMin: z.number().min(0).max(100).optional(),
			completionMax: z.number().min(0).max(100).optional(),
			stalledDays: z.number().min(1).optional(),
			searchQuery: z.string().optional(),
		})
		.optional()
		.default({}),
	pagination: z
		.object({
			limit: z.number().min(10).max(10000).default(1000),
			offset: z.number().min(0).default(0),
		})
		.optional()
		.default({}),
	sorting: z
		.object({
			field: z
				.enum([
					"componentId",
					"type",
					"area",
					"system",
					"completionPercent",
					"status",
					"updatedAt",
					"testPackage",
				])
				.default("componentId"),
			direction: z.enum(["asc", "desc"]).default("asc"),
		})
		.optional()
		.default({}),
});

const TestPackageReadinessSchema = z.object({
	projectId: z.string(),
	filters: z
		.object({
			testPackages: z.array(z.string()).optional(),
			areas: z.array(z.string()).optional(),
			systems: z.array(z.string()).optional(),
			readinessStatus: z
				.array(
					z.enum([
						"ready",
						"nearly_ready",
						"in_progress",
						"not_started",
					]),
				)
				.optional(),
		})
		.optional()
		.default({}),
	options: z
		.object({
			includeBlockingComponents: z.boolean().default(true),
			includeVelocityAnalysis: z.boolean().default(true),
			includeForecast: z.boolean().default(true),
		})
		.optional()
		.default({}),
});

const TrendAnalysisSchema = z.object({
	projectId: z.string(),
	timeframe: z
		.object({
			days: z.number().min(7).max(365).default(30),
			granularity: z.enum(["daily", "weekly"]).default("daily"),
		})
		.optional()
		.default({}),
	options: z
		.object({
			includeForecasting: z.boolean().default(true),
			includeVelocityTrends: z.boolean().default(true),
			includeMilestoneBreakdown: z.boolean().default(false),
		})
		.optional()
		.default({}),
});

const AuditTrailSchema = z.object({
	projectId: z.string(),
	filters: z
		.object({
			entityTypes: z
				.array(z.enum(["Component", "Milestone", "Project"]))
				.optional(),
			userIds: z.array(z.string()).optional(),
			actions: z.array(z.string()).optional(),
			startDate: z.string().datetime().optional(),
			endDate: z.string().datetime().optional(),
		})
		.optional()
		.default({}),
	pagination: z
		.object({
			limit: z.number().min(10).max(1000).default(100),
			offset: z.number().min(0).default(0),
		})
		.optional()
		.default({}),
});

const BulkReportGenerationSchema = z.object({
	projectId: z.string(),
	reportTypes: z.array(
		z.enum([
			"progress_summary",
			"component_details",
			"test_readiness",
			"trend_analysis",
			"audit_trail",
		]),
	),
	outputFormat: z.enum(["json", "excel", "pdf"]).default("excel"),
	deliveryMethod: z.enum(["download", "email"]).default("download"),
	options: z
		.object({
			combineReports: z.boolean().default(true),
			includeCharts: z.boolean().default(true),
			emailRecipients: z.array(z.string().email()).optional(),
		})
		.optional()
		.default({}),
});

// Helper functions for Progress Summary Report
function calculateDeltas(currentData: any[], previousData: any[]): any {
	if (!previousData || previousData.length === 0) {
		return {};
	}

	const deltaMap: any = {};
	const previousMap = new Map();

	// Create map of previous week data by key (area/system/testPackage)
	previousData.forEach((row: any) => {
		const key = row.area || row.system || row.test_package;
		previousMap.set(key, row);
	});

	// Calculate deltas for current week data
	currentData.forEach((currentRow: any) => {
		const key =
			currentRow.area || currentRow.system || currentRow.test_package;
		const previousRow = previousMap.get(key);

		if (previousRow) {
			deltaMap[key] = {
				received:
					Number(currentRow.received_percent) -
					Number(previousRow.received_percent),
				installed:
					Number(currentRow.installed_percent) -
					Number(previousRow.installed_percent),
				punched:
					Number(currentRow.punched_percent) -
					Number(previousRow.punched_percent),
				tested:
					Number(currentRow.tested_percent) -
					Number(previousRow.tested_percent),
				restored:
					Number(currentRow.restored_percent) -
					Number(previousRow.restored_percent),
				overall:
					Number(currentRow.overall_percent) -
					Number(previousRow.overall_percent),
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

function calculateOverallProgress(data: any[]): number {
	if (!data || data.length === 0) {
		return 0;
	}

	let totalComponents = 0;
	let weightedProgress = 0;

	data.forEach((row: any) => {
		const componentCount = Number(row.component_count);
		const overallPercent = Number(row.overall_percent);

		totalComponents += componentCount;
		weightedProgress += componentCount * overallPercent;
	});

	return totalComponents > 0
		? Math.round((weightedProgress / totalComponents) * 100) / 100
		: 0;
}

export const reportsRouter = new Hono()
	.use("*", authMiddleware)

	// Generate weekly Progress Summary Report (new)
	.post("/progress-summary", async (c) => {
		try {
			const body = await c.req.json();

			const { projectId, weekEnding, groupBy, options } =
				ProgressSummaryReportSchema.parse(body);
			const userId = c.get("user")?.id;

			// Verify project access through organization membership
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
				return c.json(
					{ error: "Project not found or access denied" },
					403,
				);
			}

			// Determine week ending date - default to last Sunday if not provided
			let weekEndingDate: Date;
			if (weekEnding) {
				weekEndingDate = new Date(weekEnding);
			} else {
				// Get last Sunday (week ending date)
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
						orderBy: { milestoneOrder: "asc" },
					},
				},
			});

			// Process data based on grouping
			const currentWeekData: any[] = [];
			const groupedData = new Map();

			components.forEach((component) => {
				const groupKey =
					groupBy === "system"
						? component.system
						: groupBy === "testPackage"
							? component.testPackage
							: component.area;

				if (!groupKey) {
					return;
				}

				if (!groupedData.has(groupKey)) {
					groupedData.set(groupKey, {
						components: [],
						milestoneData: new Map(), // Track milestones by name dynamically
					});
				}

				const group = groupedData.get(groupKey);
				group.components.push(component.id);

				// Process all milestones for this component
				component.milestones.forEach((m) => {
					// Skip if effectiveDate is in the future
					if (
						m.effectiveDate &&
						new Date(m.effectiveDate) > weekEndingDate
					) {
						return;
					}

					// Initialize milestone tracking if not exists
					if (!group.milestoneData.has(m.milestoneName)) {
						group.milestoneData.set(m.milestoneName, {
							completedCount: 0,
							totalCount: 0,
							percentageSum: 0,
						});
					}

					const milestoneStats = group.milestoneData.get(
						m.milestoneName,
					);
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
				// The database uses past tense (Received, Welded, etc.) while the report uses present tense
				const milestoneMapping: Record<string, string[]> = {
					Receive: ["Receive", "Received"],
					Install: [
						"Install",
						"Installed",
						"Fit-up",
						"Fitted",
						"Weld",
						"Welded",
						"Erect",
						"Erected",
					],
					Punch: ["Punch", "Punched"],
					Test: ["Test", "Tested"],
					Restore: ["Restore", "Restored", "Insulate", "Insulated"],
				};

				const milestonePercentages: Record<string, number> = {};

				// Calculate percentages for each report column by aggregating related milestones
				Object.entries(milestoneMapping).forEach(
					([reportColumn, dbMilestoneNames]) => {
						let totalCount = 0;
						let percentageSum = 0;

						// Aggregate all related milestone types
						dbMilestoneNames.forEach((dbName) => {
							const stats = data.milestoneData.get(dbName);
							if (stats && stats.totalCount > 0) {
								totalCount += stats.totalCount;
								percentageSum += stats.percentageSum;
							}
						});

						// Calculate average percentage for this column
						milestonePercentages[reportColumn] =
							totalCount > 0 ? percentageSum / totalCount : 0;
					},
				);

				// Calculate overall percentage (average of all milestone percentages)
				const avgValues = Object.values(milestonePercentages);
				const overallPercent =
					avgValues.length > 0
						? avgValues.reduce((a, b) => a + b, 0) /
							avgValues.length
						: 0;

				const rowData = {
					[groupBy === "system"
						? "system_name"
						: groupBy === "testPackage"
							? "test_package"
							: "area"]: key,
					component_count: data.components.length,
					received_percent:
						Math.round(milestonePercentages.Receive * 100) / 100,
					installed_percent:
						Math.round(milestonePercentages.Install * 100) / 100,
					punched_percent:
						Math.round(milestonePercentages.Punch * 100) / 100,
					tested_percent:
						Math.round(milestonePercentages.Test * 100) / 100,
					restored_percent:
						Math.round(milestonePercentages.Restore * 100) / 100,
					overall_percent: Math.round(overallPercent * 100) / 100,
				};

				currentWeekData.push(rowData);
			});

			// Get previous week data for delta calculation if requested
			let previousWeekData: any[] = [];
			let deltaData = {};
			if (options.showDeltas) {
				const previousWeekDate = new Date(weekEndingDate);
				previousWeekDate.setDate(previousWeekDate.getDate() - 7);

				// Get snapshot from previous week if available
				const previousSnapshot =
					await prisma.progressSnapshots.findFirst({
						where: {
							projectId,
							snapshotDate: previousWeekDate,
						},
						orderBy: { snapshotTime: "desc" },
					});

				if (previousSnapshot) {
					// The snapshot data may be stored in different fields depending on the groupBy parameter
					previousWeekData = []; // Initialize empty for now as the exact data structure needs to be determined
				}

				// Calculate deltas
				deltaData = calculateDeltas(currentWeekData, previousWeekData);
			}

			// Check if we're past Tuesday 9 AM cutoff for this week
			const tuesday9AM = new Date(weekEndingDate);
			tuesday9AM.setDate(tuesday9AM.getDate() + 2); // Tuesday
			tuesday9AM.setHours(9, 0, 0, 0);
			const isLocked = new Date() > tuesday9AM;

			// Generate report response
			const reportData = {
				reportInfo: {
					projectId: project.id,
					projectName: project.jobName,
					jobNumber: project.jobNumber,
					organization: project.organization.name,
					weekEnding: weekEndingDate.toISOString().split("T")[0],
					reportStatus: isLocked ? "FINAL" : "PRELIMINARY",
					generatedAt: new Date().toISOString(),
					groupBy,
				},
				data: currentWeekData,
				deltas: options.showDeltas ? deltaData : null,
				summary: {
					totalComponents: (currentWeekData as any[]).reduce(
						(sum, row) => sum + Number(row.component_count),
						0,
					),
					overallProgress: calculateOverallProgress(
						currentWeekData as any[],
					),
				},
			};

			// Log summary
			console.log(
				`[Progress Summary] Generated report with ${currentWeekData.length} rows, ${reportData.summary.totalComponents} components, ${reportData.summary.overallProgress}% overall progress`,
			);

			// Store snapshot if it's a final report
			if (isLocked) {
				try {
					await prisma.progressSnapshots.create({
						data: {
							projectId,
							snapshotDate: weekEndingDate,
							snapshotTime: new Date(),
							totalComponents: (currentWeekData as any[]).reduce(
								(sum, row) => sum + Number(row.component_count),
								0,
							),
							completedComponents: 0, // Would need to calculate based on 100% milestones
							overallCompletionPercent: calculateOverallProgress(
								currentWeekData as any[],
							),
							rocWeightedPercent: calculateOverallProgress(
								currentWeekData as any[],
							), // Same as overall for now
							areaBreakdown: currentWeekData,
							systemBreakdown: [],
							testPackageBreakdown: [],
							generatedBy: userId || "system",
						},
					});
				} catch (err) {
					// Snapshot might already exist, that's okay
					console.log("Snapshot already exists or error:", err);
				}
			}

			return c.json({
				success: true,
				data: reportData,
			});
		} catch (error) {
			if (error instanceof z.ZodError) {
				console.error("[API] Validation error:", error.errors);
				return c.json(
					{
						error: "Invalid request parameters",
						details: error.errors,
					},
					400,
				);
			}
			console.error(
				"[API] Progress Summary Report generation error:",
				error,
			);
			console.error(
				"[API] Error stack:",
				error instanceof Error ? error.stack : "No stack trace",
			);
			return c.json(
				{
					error: "Failed to generate Progress Summary Report",
					message:
						error instanceof Error ? error.message : String(error),
				},
				500,
			);
		}
	})

	// Generate progress summary report with ROC calculations
	.post("/generate/progress", async (c) => {
		try {
			const body = await c.req.json();
			const {
				projectId,
				filters = {},
				options = {},
			} = ProgressReportSchema.parse(body);
			const userId = c.get("user")?.id;

			// Verify project access through organization membership
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
				return c.json(
					{ error: "Project not found or access denied" },
					403,
				);
			}

			// Create report generation audit record
			await prisma.$executeRaw`
        INSERT INTO "ReportGenerations" (
          "projectId", "reportType", "requestedBy", "filters", 
          "outputFormat", "deliveryMethod", "status"
        ) VALUES (
          ${projectId}, 'progress_summary', ${userId}, ${JSON.stringify(filters)},
          'json', 'api', 'processing'
        ) RETURNING id
      `;

			// Call the RPC function for ROC-weighted progress
			const rocResult = (await prisma.$queryRaw`
        SELECT calculate_roc_weighted_progress(${projectId}, ${JSON.stringify(filters)}) as result
      `) as any[];

			// Call the comprehensive progress report function
			const progressResult = (await prisma.$queryRaw`
        SELECT generate_progress_report(${projectId}, ${JSON.stringify(options)}) as result  
      `) as any[];

			const combinedResult = {
				rocWeightedProgress: rocResult[0]?.result,
				comprehensiveReport: progressResult[0]?.result,
				generatedAt: new Date().toISOString(),
				projectInfo: {
					id: project.id,
					jobNumber: project.jobNumber,
					jobName: project.jobName,
					organization: project.organization.name,
				},
			};

			// Update report generation status to completed
			await prisma.$executeRaw`
        UPDATE "ReportGenerations" 
        SET "status" = 'completed', "completedAt" = NOW(), 
            "resultRowCount" = ${combinedResult.comprehensiveReport?.data?.overview?.totalComponents || 0}
        WHERE "projectId" = ${projectId} 
        AND "requestedBy" = ${userId}
        AND "reportType" = 'progress_summary'
        AND "status" = 'processing'
      `;

			// Broadcast real-time update
			await broadcastReportGeneration(
				projectId,
				"progress_summary",
				"completed",
				userId || "system",
			);

			return c.json({
				success: true,
				data: combinedResult,
			});
		} catch (error) {
			if (error instanceof z.ZodError) {
				return c.json(
					{
						error: "Invalid request parameters",
						details: error.errors,
					},
					400,
				);
			}
			console.error("Progress report generation error:", error);
			return c.json({ error: "Failed to generate progress report" }, 500);
		}
	})

	// Get detailed component report with pagination
	.post("/generate/components", async (c) => {
		try {
			const body = await c.req.json();
			const {
				projectId,
				filters = {},
				pagination = {},
			} = ComponentDetailsSchema.parse(body);
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
				return c.json(
					{ error: "Project not found or access denied" },
					403,
				);
			}

			// Call the RPC function for component details
			const result = (await prisma.$queryRaw`
        SELECT get_component_details_report(
          ${projectId}, 
          ${JSON.stringify(filters)}, 
          ${JSON.stringify(pagination)}
        ) as result
      `) as any[];

			return c.json({
				success: true,
				data: result[0]?.result,
			});
		} catch (error) {
			if (error instanceof z.ZodError) {
				return c.json(
					{
						error: "Invalid request parameters",
						details: error.errors,
					},
					400,
				);
			}
			console.error("Component details report error:", error);
			return c.json(
				{ error: "Failed to generate component details report" },
				500,
			);
		}
	})

	// Generate test package readiness report
	.post("/generate/test-packages", async (c) => {
		try {
			const body = await c.req.json();
			const {
				projectId,
				filters = {},
				options = {},
			} = TestPackageReadinessSchema.parse(body);
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
				return c.json(
					{ error: "Project not found or access denied" },
					403,
				);
			}

			// Call the enhanced test package readiness function
			const result = (await prisma.$queryRaw`
        SELECT get_test_package_readiness_detailed(${projectId}, ${JSON.stringify(filters)}) as result
      `) as any[];

			return c.json({
				success: true,
				data: result[0]?.result,
				options,
			});
		} catch (error) {
			if (error instanceof z.ZodError) {
				return c.json(
					{
						error: "Invalid request parameters",
						details: error.errors,
					},
					400,
				);
			}
			console.error("Test package readiness report error:", error);
			return c.json(
				{ error: "Failed to generate test package readiness report" },
				500,
			);
		}
	})

	// Generate trend analysis report
	.post("/generate/trends", async (c) => {
		try {
			const body = await c.req.json();
			const {
				projectId,
				timeframe = {},
				options = {},
			} = TrendAnalysisSchema.parse(body);
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
				return c.json(
					{ error: "Project not found or access denied" },
					403,
				);
			}

			// Call the trend analysis function
			const days = (timeframe as any).days || 30; // Default to 30 days
			const result = (await prisma.$queryRaw`
        SELECT calculate_trend_analysis(${projectId}, ${days}) as result
      `) as any[];

			return c.json({
				success: true,
				data: result[0]?.result,
				timeframe,
				options,
			});
		} catch (error) {
			if (error instanceof z.ZodError) {
				return c.json(
					{
						error: "Invalid request parameters",
						details: error.errors,
					},
					400,
				);
			}
			console.error("Trend analysis report error:", error);
			return c.json(
				{ error: "Failed to generate trend analysis report" },
				500,
			);
		}
	})

	// Get audit trail report
	.post("/generate/audit", async (c) => {
		try {
			const body = await c.req.json();
			const {
				projectId,
				filters = {},
				pagination = {},
			} = AuditTrailSchema.parse(body);
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
				return c.json(
					{ error: "Project not found or access denied" },
					403,
				);
			}

			// Build audit log query with filters
			const whereConditions: any = {
				projectId,
			};

			if (filters.entityTypes?.length) {
				whereConditions.entityType = {
					in: filters.entityTypes,
				};
			}

			if (filters.userIds?.length) {
				whereConditions.userId = {
					in: filters.userIds,
				};
			}

			if (filters.actions?.length) {
				whereConditions.action = {
					in: filters.actions,
				};
			}

			if (filters.startDate || filters.endDate) {
				whereConditions.timestamp = {};
				if (filters.startDate) {
					whereConditions.timestamp.gte = new Date(filters.startDate);
				}
				if (filters.endDate) {
					whereConditions.timestamp.lte = new Date(filters.endDate);
				}
			}

			// Get total count
			const totalCount = await prisma.auditLog.count({
				where: whereConditions,
			});

			// Get audit logs with pagination
			const auditLogs = await prisma.auditLog.findMany({
				where: whereConditions,
				include: {
					user: {
						select: {
							name: true,
							email: true,
						},
					},
				},
				orderBy: {
					timestamp: "desc",
				},
				take: (pagination as any).limit || 100,
				skip: (pagination as any).offset || 0,
			});

			// Transform for response
			const transformedLogs = auditLogs.map((log) => ({
				id: log.id,
				timestamp: log.timestamp,
				entityType: log.entityType,
				entityId: log.entityId,
				action: log.action,
				changes: log.changes,
				user: {
					name: log.user?.name || "Unknown User",
					email: log.user?.email,
				},
			}));

			return c.json({
				success: true,
				data: {
					auditLogs: transformedLogs,
					pagination: {
						totalCount,
						limit: (pagination as any).limit || 100,
						offset: (pagination as any).offset || 0,
						hasMore:
							((pagination as any).offset || 0) +
								((pagination as any).limit || 100) <
							totalCount,
					},
					filters,
				},
			});
		} catch (error) {
			if (error instanceof z.ZodError) {
				return c.json(
					{
						error: "Invalid request parameters",
						details: error.errors,
					},
					400,
				);
			}
			console.error("Audit trail report error:", error);
			return c.json(
				{ error: "Failed to generate audit trail report" },
				500,
			);
		}
	})

	// Get report generation status and history
	.get("/status/:projectId", async (c) => {
		try {
			const projectId = c.req.param("projectId");
			const userId = c.get("user")?.id;
			const limit = Number.parseInt(c.req.query("limit") || "20");

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
				return c.json(
					{ error: "Project not found or access denied" },
					403,
				);
			}

			// Get recent report generations
			const reportGenerations = (await prisma.$queryRaw`
        SELECT 
          id, "reportType", "requestedBy", "requestedAt", "status",
          "startedAt", "completedAt", duration, "resultRowCount",
          "outputFormat", "deliveryMethod", "cacheHit", "errorMessage"
        FROM "ReportGenerations"
        WHERE "projectId" = ${projectId}
        AND ("requestedBy" = ${userId} OR EXISTS (
          SELECT 1 FROM "member" m 
          JOIN "Project" p ON p."organizationId" = m."organizationId"
          WHERE p.id = ${projectId} 
          AND m."userId" = ${userId} 
          AND m.role IN ('owner', 'admin')
        ))
        ORDER BY "requestedAt" DESC
        LIMIT ${limit}
      `) as any[];

			// Get cache statistics
			const cacheStats = (await prisma.$queryRaw`
        SELECT 
          "reportType",
          COUNT(*) as cache_entries,
          AVG("calculationDuration") as avg_calculation_time,
          MAX("calculatedAt") as last_cached
        FROM "ReportingCache"
        WHERE "projectId" = ${projectId}
        AND "expiresAt" > NOW()
        GROUP BY "reportType"
      `) as any[];

			return c.json({
				success: true,
				data: {
					recentGenerations: reportGenerations,
					cacheStatistics: cacheStats,
					projectId,
				},
			});
		} catch (error) {
			console.error("Report status error:", error);
			return c.json({ error: "Failed to get report status" }, 500);
		}
	})

	// Clear report cache
	.delete("/cache/:projectId", async (c) => {
		try {
			const projectId = c.req.param("projectId");
			const reportType = c.req.query("reportType");
			const userId = c.get("user")?.id;

			// Verify project access and admin permissions
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
				return c.json(
					{ error: "Project not found or insufficient permissions" },
					403,
				);
			}

			// Clear cache entries
			const deletedCount = await prisma.$executeRaw`
        DELETE FROM "ReportingCache" 
        WHERE "projectId" = ${projectId}
        ${reportType ? `AND "reportType" = ${reportType}` : ""}
      `;

			return c.json({
				success: true,
				data: {
					deletedEntries: deletedCount,
					reportType: reportType || "all",
				},
			});
		} catch (error) {
			console.error("Cache clear error:", error);
			return c.json({ error: "Failed to clear cache" }, 500);
		}
	})

	// Bulk report generation (async)
	.post("/generate/bulk", async (c) => {
		try {
			const body = await c.req.json();
			const { projectId, reportTypes, outputFormat, deliveryMethod } =
				BulkReportGenerationSchema.parse(body);
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
				return c.json(
					{ error: "Project not found or access denied" },
					403,
				);
			}

			// Create report generation records
			const reportGenerationIds = [];
			for (const reportType of reportTypes) {
				const reportGeneration = await prisma.$executeRaw`
          INSERT INTO "ReportGenerations" (
            "projectId", "reportType", "requestedBy", "filters",
            "outputFormat", "deliveryMethod", "status"
          ) VALUES (
            ${projectId}, ${reportType}, ${userId}, '{}',
            ${outputFormat}, ${deliveryMethod}, 'pending'
          ) RETURNING id
        `;
				reportGenerationIds.push(reportGeneration);
			}

			// Trigger background job for bulk report generation
			// This would typically queue the job in a job queue system
			// For now, we'll return the pending status

			return c.json({
				success: true,
				data: {
					reportGenerationIds,
					status: "pending",
					estimatedCompletionTime: "2-5 minutes",
					deliveryMethod,
					outputFormat,
				},
			});
		} catch (error) {
			if (error instanceof z.ZodError) {
				return c.json(
					{
						error: "Invalid request parameters",
						details: error.errors,
					},
					400,
				);
			}
			console.error("Bulk report generation error:", error);
			return c.json(
				{ error: "Failed to start bulk report generation" },
				500,
			);
		}
	})

	// Validate milestone backdating (for Progress Summary Report workflow)
	.post("/validate-backdating", async (c) => {
		try {
			const body = await c.req.json();
			const { effectiveDate } = z
				.object({
					effectiveDate: z
						.string()
						.regex(
							/^\d{4}-\d{2}-\d{2}$/,
							"Must be YYYY-MM-DD format",
						),
				})
				.parse(body);

			// Call SQL validation function
			const validationResult = (await prisma.$queryRaw`
        SELECT is_backdating_allowed(${effectiveDate}::DATE) as is_allowed
      `) as any[];

			const isAllowed = validationResult[0]?.is_allowed || false;

			// Get additional context for the response
			const weekEndingResult = (await prisma.$queryRaw`
        SELECT get_week_ending_date(CURRENT_DATE) as current_week_ending,
               get_week_ending_date(${effectiveDate}::DATE) as effective_week_ending
      `) as any[];

			const currentWeekEnding = weekEndingResult[0]?.current_week_ending;
			const effectiveWeekEnding =
				weekEndingResult[0]?.effective_week_ending;

			// Calculate Tuesday 9 AM cutoff
			const tuesday9AM = new Date(currentWeekEnding);
			tuesday9AM.setDate(tuesday9AM.getDate() + 2);
			tuesday9AM.setHours(9, 0, 0, 0);

			let validationMessage = "";
			if (!isAllowed) {
				const now = new Date();
				const effectiveDateObj = new Date(effectiveDate);

				if (effectiveDateObj > now) {
					validationMessage =
						"Cannot set completion date in the future";
				} else if (
					now > tuesday9AM &&
					effectiveDateObj < currentWeekEnding
				) {
					validationMessage = `Cannot modify last week's data after Tuesday 9:00 AM (cutoff was ${tuesday9AM.toLocaleDateString()})`;
				} else {
					validationMessage = "Cannot modify data older than 1 week";
				}
			}

			return c.json({
				success: true,
				data: {
					isAllowed,
					effectiveDate,
					currentWeekEnding: currentWeekEnding
						.toISOString()
						.split("T")[0],
					effectiveWeekEnding: effectiveWeekEnding
						.toISOString()
						.split("T")[0],
					tuesday9AMCutoff: tuesday9AM.toISOString(),
					isAfterCutoff: new Date() > tuesday9AM,
					validationMessage:
						validationMessage || "Backdating is allowed",
				},
			});
		} catch (error) {
			if (error instanceof z.ZodError) {
				return c.json(
					{
						error: "Invalid request parameters",
						details: error.errors,
					},
					400,
				);
			}
			console.error("Backdating validation error:", error);
			return c.json({ error: "Failed to validate backdating" }, 500);
		}
	})

	// Generate and store progress snapshot (for automated weekly reporting)
	.post("/snapshot/:projectId", async (c) => {
		try {
			const projectId = c.req.param("projectId");
			const body = await c.req.json().catch(() => ({}));
			const { snapshotDate } = z
				.object({
					snapshotDate: z
						.string()
						.regex(
							/^\d{4}-\d{2}-\d{2}$/,
							"Must be YYYY-MM-DD format",
						)
						.optional(),
				})
				.parse(body);

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
				return c.json(
					{ error: "Project not found or access denied" },
					403,
				);
			}

			// Default to last Sunday if no date provided
			let snapshotDateFinal = snapshotDate;
			if (!snapshotDateFinal) {
				const lastSundayResult = (await prisma.$queryRaw`
          SELECT get_week_ending_date(CURRENT_DATE) as week_ending
        `) as any[];
				snapshotDateFinal = lastSundayResult[0].week_ending
					.toISOString()
					.split("T")[0];
			}

			// Generate snapshot using SQL function
			const snapshotResult = (await prisma.$queryRaw`
        SELECT generate_progress_snapshot(${projectId}, ${snapshotDateFinal}::DATE, ${userId}) as snapshot_id
      `) as any[];

			const snapshotId = snapshotResult[0]?.snapshot_id;

			return c.json({
				success: true,
				data: {
					snapshotId,
					snapshotDate: snapshotDateFinal,
					projectId,
					message: "Progress snapshot generated successfully",
				},
			});
		} catch (error) {
			if (error instanceof z.ZodError) {
				return c.json(
					{
						error: "Invalid request parameters",
						details: error.errors,
					},
					400,
				);
			}
			console.error("Snapshot generation error:", error);
			return c.json(
				{ error: "Failed to generate progress snapshot" },
				500,
			);
		}
	})

	// Get available report filters/options for a project
	.get("/filters/:projectId", async (c) => {
		try {
			const projectId = c.req.param("projectId");
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
				return c.json(
					{ error: "Project not found or access denied" },
					403,
				);
			}

			// Get available filter values from components
			const filterOptions = (await prisma.$queryRaw`
        SELECT 
          array_agg(DISTINCT "area") FILTER (WHERE "area" IS NOT NULL) as areas,
          array_agg(DISTINCT "system") FILTER (WHERE "system" IS NOT NULL) as systems,
          array_agg(DISTINCT "testPackage") FILTER (WHERE "testPackage" IS NOT NULL) as test_packages,
          array_agg(DISTINCT type) FILTER (WHERE type IS NOT NULL) as component_types,
          array_agg(DISTINCT status) FILTER (WHERE status IS NOT NULL) as statuses
        FROM "Component"
        WHERE "projectId" = ${projectId}
        AND status != 'DELETED'
      `) as any[];

			const options = filterOptions[0] || {};

			return c.json({
				success: true,
				data: {
					areas: options.areas || [],
					systems: options.systems || [],
					testPackages: options.test_packages || [],
					componentTypes: options.component_types || [],
					statuses: options.statuses || [],
				},
			});
		} catch (error) {
			console.error("Filter options error:", error);
			return c.json({ error: "Failed to get filter options" }, 500);
		}
	});
