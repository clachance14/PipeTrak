import { db } from "@repo/database";
import type { AuditAction } from "@repo/database/prisma/generated/client";
import { formatDistanceToNow } from "date-fns";

export interface QCActivityItem {
	id: string;
	user: {
		name: string;
		initials: string;
	};
	action: string;
	target: string;
	type: "added" | "completed" | "updated" | "report" | "import";
	timestamp: string;
	rawTimestamp: Date;
}

function getInitials(name: string): string {
	return name
		.split(" ")
		.map((word) => word.charAt(0).toUpperCase())
		.join("")
		.substring(0, 2);
}

function formatActivity(
	auditLog: {
		id: string;
		timestamp: Date;
		user: { name: string };
		action: AuditAction;
		entityType: string;
		entityId: string;
		changes: any;
		component?: { componentId: string; displayId: string | null } | null;
	},
): QCActivityItem {
	const userName = auditLog.user.name || "Unknown User";
	const initials = getInitials(userName);

	// Determine activity type and description based on entity type and action
	let activityType: QCActivityItem["type"] = "updated";
	let actionDescription = "";
	let target = "";

	switch (auditLog.entityType) {
		case "FieldWeld":
			target = `Field Weld ${auditLog.entityId.substring(0, 8)}`;
			switch (auditLog.action) {
				case "CREATE":
					activityType = "added";
					actionDescription = "added field weld";
					break;
				case "UPDATE": {
					// Check if it's a completion by looking at changes
					const changes = auditLog.changes as Record<string, any>;
					if (changes?.status?.new === "COMPLETED") {
						activityType = "completed";
						actionDescription = "completed field weld";
					} else {
						actionDescription = "updated field weld";
					}
					break;
				}
				case "IMPORT":
					activityType = "import";
					actionDescription = "imported field weld";
					break;
				default:
					actionDescription = "modified field weld";
			}
			break;

		case "Welder":
			target = auditLog.entityId;
			switch (auditLog.action) {
				case "CREATE":
					activityType = "added";
					actionDescription = "registered new welder";
					break;
				case "UPDATE":
					actionDescription = "updated welder info";
					break;
				default:
					actionDescription = "modified welder";
			}
			break;

		case "Component":
			target = auditLog.component?.displayId || auditLog.component?.componentId || `Component ${auditLog.entityId.substring(0, 8)}`;
			switch (auditLog.action) {
				case "BULK_MILESTONE_UPDATE":
					activityType = "updated";
					actionDescription = "updated milestones for";
					break;
				case "UPDATE":
					actionDescription = "updated component";
					break;
				default:
					actionDescription = "modified component";
			}
			break;

		default:
			target = auditLog.entityId.substring(0, 8);
			actionDescription = `${auditLog.action.toLowerCase()} ${auditLog.entityType.toLowerCase()}`;
	}

	return {
		id: auditLog.id,
		user: {
			name: userName,
			initials,
		},
		action: actionDescription,
		target,
		type: activityType,
		timestamp: formatDistanceToNow(auditLog.timestamp, { addSuffix: true }),
		rawTimestamp: auditLog.timestamp,
	};
}

export async function getQCActivityFeed(
	projectId: string,
	limit = 20,
	dateRange?: { from: Date; to: Date },
): Promise<QCActivityItem[]> {
	try {
		// Get recent audit logs for QC-related activities
		const auditLogs = await db.auditLog.findMany({
			where: {
				projectId,
				entityType: {
					in: ["FieldWeld", "Welder", "Component"],
				},
				...(dateRange && {
					timestamp: {
						gte: dateRange.from,
						lte: dateRange.to,
					},
				}),
			},
			include: {
				user: {
					select: {
						name: true,
					},
				},
				component: {
					select: {
						componentId: true,
						displayId: true,
					},
				},
			},
			orderBy: {
				timestamp: "desc",
			},
			take: limit,
		});

		// Transform audit logs into activity items
		return auditLogs.map(formatActivity);
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
	try {
		const entityTypeMap = {
			welds: ["FieldWeld"],
			welders: ["Welder"],
			components: ["Component"],
			all: ["FieldWeld", "Welder", "Component"],
		};

		const auditLogs = await db.auditLog.findMany({
			where: {
				projectId,
				entityType: {
					in: entityTypeMap[filterType],
				},
				...(dateRange && {
					timestamp: {
						gte: dateRange.from,
						lte: dateRange.to,
					},
				}),
			},
			include: {
				user: {
					select: {
						name: true,
					},
				},
				component: {
					select: {
						componentId: true,
						displayId: true,
					},
				},
			},
			orderBy: {
				timestamp: "desc",
			},
			take: limit,
		});

		return auditLogs.map(formatActivity);
	} catch (error) {
		console.error("Error fetching filtered QC activity:", error);
		return [];
	}
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