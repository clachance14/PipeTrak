import { db } from "@repo/database";
import { formatDistanceToNow } from "date-fns";

export interface QCActivityItem {
	id: string;
	weldNumber: string;
	welder: {
		name: string | null;
		stencil: string | null;
	};
	dateWelded: string | null;
	effectiveDate: string | null;
	updatedBy: {
		name: string;
		initials: string;
	} | null;
	updatedAt: string;
	relativeUpdatedAt: string;
}

function getInitials(name: string): string {
	return name
		.split(" ")
		.map((word) => word.charAt(0).toUpperCase())
		.join("")
		.substring(0, 2);
}

function mapMilestoneToActivity(milestone: {
	id: string;
	effectiveDate: Date;
	completedAt: Date | null;
	completer: { name: string | null } | null;
	component: {
		displayId: string | null;
		weldId: string | null;
		fieldWelds: Array<{
			id: string;
			weldIdNumber: string;
			dateWelded: Date | null;
			welder: {
				name: string | null;
				stencil: string | null;
			} | null;
		}>;
	};
}): QCActivityItem {
	const fieldWeld = milestone.component.fieldWelds[0];
	const weldNumber =
		fieldWeld?.weldIdNumber ??
		milestone.component.weldId ??
		milestone.component.displayId ??
		"Unknown";
	const welder = fieldWeld?.welder ?? { name: null, stencil: null };
	const updatedAt = milestone.completedAt ?? milestone.effectiveDate;
	const userName = milestone.completer?.name ?? "Unknown";

	return {
		id: milestone.id,
		weldNumber,
		welder: {
			name: welder?.name ?? null,
			stencil: welder?.stencil ?? null,
		},
		dateWelded: fieldWeld?.dateWelded
			? fieldWeld.dateWelded.toISOString()
			: null,
		effectiveDate: milestone.effectiveDate.toISOString(),
		updatedBy: milestone.completer
			? {
					name: userName,
					initials: getInitials(userName),
				}
			: null,
		updatedAt: updatedAt.toISOString(),
		relativeUpdatedAt: formatDistanceToNow(updatedAt, { addSuffix: true }),
	};
}

export async function getQCActivityFeed(
	projectId: string,
	limit = 20,
	dateRange?: { from: Date; to: Date },
): Promise<QCActivityItem[]> {
	try {
		const milestones = await db.componentMilestone.findMany({
			where: {
				milestoneName: "Weld Made",
				isCompleted: true,
				component: {
					projectId,
					type: "FIELD_WELD",
				},
				...(dateRange && {
					effectiveDate: {
						gte: dateRange.from,
						lte: dateRange.to,
					},
				}),
			},
			orderBy: [{ effectiveDate: "desc" }, { completedAt: "desc" }],
			take: limit,
			include: {
				completer: {
					select: { name: true },
				},
				component: {
					select: {
						displayId: true,
						weldId: true,
						fieldWelds: {
							take: 1,
							orderBy: { updatedAt: "desc" },
							select: {
								id: true,
								weldIdNumber: true,
								dateWelded: true,
								welder: {
									select: {
										name: true,
										stencil: true,
									},
								},
							},
						},
					},
				},
			},
		});

		return milestones.map(mapMilestoneToActivity);
	} catch (error) {
		console.error("Error fetching QC activity feed:", error);
		return [];
	}
}

// Get activity feed filtered by type
export async function getQCActivityByType(
	projectId: string,
	filterType: "welds" | "welders" | "components" | "all" = "all",
	limit = 20,
	dateRange?: { from: Date; to: Date },
): Promise<QCActivityItem[]> {
	// Legacy signature retained for future filter extensions. For now, defer to weld activity.
	if (filterType === "welds" || filterType === "all") {
		return getQCActivityFeed(projectId, limit, dateRange);
	}

	return [];
}

// Get activity statistics for the project
export async function getQCActivityStats(projectId: string) {
	try {
		const [
			totalActivity,
			weldActivity,
			welderActivity,
			componentActivity,
			recentActivity,
		] = await Promise.all([
			db.auditLog.count({
				where: {
					projectId,
					entityType: { in: ["FieldWeld", "Welder", "Component"] },
				},
			}),
			db.auditLog.count({
				where: {
					projectId,
					entityType: "FieldWeld",
				},
			}),
			db.auditLog.count({
				where: {
					projectId,
					entityType: "Welder",
				},
			}),
			db.auditLog.count({
				where: {
					projectId,
					entityType: "Component",
				},
			}),
			db.auditLog.count({
				where: {
					projectId,
					entityType: { in: ["FieldWeld", "Welder", "Component"] },
					timestamp: {
						gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
					},
				},
			}),
		]);

		return {
			total: totalActivity,
			welds: weldActivity,
			welders: welderActivity,
			components: componentActivity,
			recent: recentActivity,
		};
	} catch (error) {
		console.error("Error fetching QC activity stats:", error);
		return {
			total: 0,
			welds: 0,
			welders: 0,
			components: 0,
			recent: 0,
		};
	}
}
