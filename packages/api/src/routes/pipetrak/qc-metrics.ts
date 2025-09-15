import { db } from "@repo/database";
import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth";

export const qcMetricsRouter = new Hono()
	.use("*", authMiddleware)

	// GET /qc-metrics/:projectId - Get QC metrics summary for a project
	.get("/:projectId", async (c) => {
		const projectId = c.req.param("projectId");

		try {
			// Verify project exists
			const project = await db.project.findUnique({
				where: { id: projectId },
				select: { id: true, jobName: true },
			});

			if (!project) {
				return c.json({ error: "Project not found" }, 404);
			}

			// Get current date for trend calculations
			const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
			const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

			// Parallel execution of all database queries
			const [
				totalWelds,
				acceptedWelds,
				rejectedWelds,
				pendingWelds,
				pwhtRequiredWelds,
				pwhtCompleteWelds,
				activeWelders,
				weldsLastWeek,
				weldsLastTwoWeeks,
				acceptanceRateLastWeek,
			] = await Promise.all([
				// Total field welds
				db.fieldWeld.count({
					where: { projectId },
				}),

				// Accepted welds
				db.fieldWeld.count({
					where: {
						projectId,
						ndeResult: "Accept",
					},
				}),

				// Rejected welds
				db.fieldWeld.count({
					where: {
						projectId,
						ndeResult: "Reject",
					},
				}),

				// Pending NDE
				db.fieldWeld.count({
					where: {
						projectId,
						OR: [{ ndeResult: "Pending" }, { ndeResult: null }],
					},
				}),

				// PWHT required
				db.fieldWeld.count({
					where: {
						projectId,
						pwhtRequired: true,
					},
				}),

				// PWHT complete
				db.fieldWeld.count({
					where: {
						projectId,
						pwhtRequired: true,
						datePwht: { not: null },
					},
				}),

				// Active welders
				db.welder.count({
					where: {
						projectId,
						active: true,
					},
				}),

				// Welds created in last week (for trends)
				db.fieldWeld.count({
					where: {
						projectId,
						createdAt: { gte: oneWeekAgo },
					},
				}),

				// Welds created 1-2 weeks ago (for comparison)
				db.fieldWeld.count({
					where: {
						projectId,
						createdAt: {
							gte: twoWeeksAgo,
							lt: oneWeekAgo,
						},
					},
				}),

				// Acceptance rate for welds completed last week
				db.fieldWeld.findMany({
					where: {
						projectId,
						ndeDate: { gte: oneWeekAgo },
						ndeResult: { in: ["Accept", "Reject"] },
					},
					select: { ndeResult: true },
				}),
			]);

			// Calculate metrics
			const acceptanceRate =
				acceptedWelds + rejectedWelds > 0
					? Math.round(
							(acceptedWelds / (acceptedWelds + rejectedWelds)) * 100,
						)
					: 0;

			const pwhtCompletionRate =
				pwhtRequiredWelds > 0
					? Math.round((pwhtCompleteWelds / pwhtRequiredWelds) * 100)
					: 0;

			// Calculate acceptance rate for last week
			const lastWeekAccepted = acceptanceRateLastWeek.filter(
				(w) => w.ndeResult === "Accept",
			).length;
			const lastWeekRejected = acceptanceRateLastWeek.filter(
				(w) => w.ndeResult === "Reject",
			).length;
			const lastWeekAcceptanceRate =
				lastWeekAccepted + lastWeekRejected > 0
					? Math.round(
							(lastWeekAccepted / (lastWeekAccepted + lastWeekRejected)) * 100,
						)
					: 0;

			// Calculate trends
			const weldsWeekOverWeekChange =
				weldsLastTwoWeeks > 0
					? Math.round(((weldsLastWeek - weldsLastTwoWeeks) / weldsLastTwoWeeks) * 100)
					: weldsLastWeek > 0
						? 100
						: 0;

			const acceptanceRateChange = lastWeekAcceptanceRate - acceptanceRate;

			return c.json({
				metrics: {
					// Core metrics
					totalWelds,
					acceptedWelds,
					rejectedWelds,
					pendingWelds,
					acceptanceRate,

					// PWHT metrics
					pwhtRequired: pwhtRequiredWelds,
					pwhtComplete: pwhtCompleteWelds,
					pwhtCompletionRate,

					// Welder metrics
					activeWelders,

					// Trends (for dashboard cards)
					trends: {
						weldsLastWeek,
						weldsWeekOverWeekChange,
						acceptanceRateChange,
						pwhtCompletionRate,
					},
				},
				project: {
					id: project.id,
					name: project.jobName,
				},
			});
		} catch (error: any) {
			console.error("Error fetching QC metrics:", error);
			return c.json(
				{ error: "Failed to fetch QC metrics" },
				500,
			);
		}
	})

	// GET /qc-metrics/:projectId/summary - Get high-level QC summary
	.get("/:projectId/summary", async (c) => {
		const projectId = c.req.param("projectId");

		try {
			// Quick summary with minimal queries for dashboard overview
			const [totalWelds, activeWelders, acceptanceStats] = await Promise.all([
				db.fieldWeld.count({
					where: { projectId },
				}),

				db.welder.count({
					where: {
						projectId,
						active: true,
					},
				}),

				db.fieldWeld.groupBy({
					by: ["ndeResult"],
					where: {
						projectId,
						ndeResult: { in: ["Accept", "Reject"] },
					},
					_count: true,
				}),
			]);

			const acceptedCount = acceptanceStats.find(
				(stat) => stat.ndeResult === "Accept",
			)?._count || 0;
			const rejectedCount = acceptanceStats.find(
				(stat) => stat.ndeResult === "Reject",
			)?._count || 0;

			const acceptanceRate =
				acceptedCount + rejectedCount > 0
					? Math.round((acceptedCount / (acceptedCount + rejectedCount)) * 100)
					: 0;

			return c.json({
				summary: {
					totalWelds,
					activeWelders,
					acceptanceRate,
					totalInspected: acceptedCount + rejectedCount,
				},
			});
		} catch (error: any) {
			console.error("Error fetching QC summary:", error);
			return c.json(
				{ error: "Failed to fetch QC summary" },
				500,
			);
		}
	});