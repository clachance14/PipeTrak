import { db } from "@repo/database";

export async function getProjectDashboard(projectId: string) {

	// Get project details
	const project = await db.project.findUnique({
		where: { id: projectId },
		include: {
			organization: {
				select: {
					name: true,
				},
			},
		},
	});

	if (!project) {
		return null;
	}

	// Get component statistics
	const components = await db.component.findMany({
		where: { projectId },
		select: {
			id: true,
			status: true,
			completionPercent: true,
			area: true,
			system: true,
			testPackage: true,
		},
	});

	// Calculate overall statistics
	const totalComponents = components.length;
	const completedComponents = components.filter(
		(c: any) => c.status === "COMPLETED",
	).length;
	const inProgressComponents = components.filter(
		(c: any) => c.status === "IN_PROGRESS",
	).length;
	const notStartedComponents = components.filter(
		(c: any) => c.status === "NOT_STARTED",
	).length;

	const overallProgress =
		totalComponents > 0
			? components.reduce((sum: any, c: any) => sum + c.completionPercent, 0) /
				totalComponents
			: 0;

	// Get progress by area
	const areaProgress = new Map<string, { count: number; progress: number }>();
	components.forEach((c: any) => {
		if (c.area) {
			const current = areaProgress.get(c.area) || {
				count: 0,
				progress: 0,
			};
			areaProgress.set(c.area, {
				count: current.count + 1,
				progress: current.progress + c.completionPercent,
			});
		}
	});

	const areaStats = Array.from(areaProgress.entries())
		.map(([area, stats]) => ({
			area,
			componentCount: stats.count,
			averageProgress: stats.progress / stats.count,
		}))
		.sort((a, b) => a.area.localeCompare(b.area));

	// Get progress by system
	const systemProgress = new Map<
		string,
		{ count: number; progress: number }
	>();
	components.forEach((c: any) => {
		if (c.system) {
			const current = systemProgress.get(c.system) || {
				count: 0,
				progress: 0,
			};
			systemProgress.set(c.system, {
				count: current.count + 1,
				progress: current.progress + c.completionPercent,
			});
		}
	});

	const systemStats = Array.from(systemProgress.entries())
		.map(([system, stats]) => ({
			system,
			componentCount: stats.count,
			averageProgress: stats.progress / stats.count,
		}))
		.sort((a, b) => a.system.localeCompare(b.system));

	// Get drawing count
	const drawingCount = await db.drawing.count({
		where: { projectId },
	});

	// Get recent milestone updates
	const recentMilestones = await db.componentMilestone.findMany({
		where: {
			component: {
				projectId,
			},
			completedAt: {
				not: null,
				gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
			},
		},
		select: {
			id: true,
			milestoneName: true,
			completedAt: true,
			component: {
				select: {
					componentId: true,
					type: true,
					area: true,
					system: true,
				},
			},
		},
		orderBy: {
			completedAt: "desc",
		},
		take: 10,
	});

	// Calculate ROC (Rate of Completion) - simplified version
	// In a real implementation, this would use milestone weights from templates
	const rocValue = overallProgress;

	return {
		project,
		stats: {
			totalComponents,
			completedComponents,
			inProgressComponents,
			notStartedComponents,
			overallProgress,
			drawingCount,
			rocValue,
		},
		areaStats,
		systemStats,
		recentMilestones,
	};
}

export async function getProjectSummary(projectId: string) {

	const summary = await db.component.aggregate({
		where: { projectId },
		_count: true,
		_avg: {
			completionPercent: true,
		},
	});

	return {
		componentCount: summary._count,
		averageProgress: summary._avg.completionPercent || 0,
	};
}
