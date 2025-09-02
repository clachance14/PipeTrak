import { Hono } from "hono";
import { validator } from "hono/validator";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth";
import { db } from "@repo/database";
import {
	createRealtimeClient,
	createProjectChannel,
	updatePresence,
	broadcastEvent,
	checkBroadcastRateLimit,
	type UserPresence,
	type BroadcastEvent,
} from "../../lib/realtime";

// Validation schemas
const SubscribeSchema = z.object({
	projectId: z.string().cuid(),
	presence: z
		.object({
			viewingDrawingId: z.string().optional(),
			editingComponentId: z.string().optional(),
		})
		.optional(),
});

const PresenceUpdateSchema = z.object({
	projectId: z.string().cuid(),
	viewingDrawingId: z.string().optional(),
	editingComponentId: z.string().optional(),
	isTyping: z.boolean().optional(),
});

const BroadcastSchema = z.object({
	projectId: z.string().cuid(),
	type: z.enum([
		"user_presence",
		"component_edit",
		"milestone_celebration",
		"import_progress",
		"custom",
	]),
	payload: z.any(),
});

// Create realtime router
export const realtimeRouter = new Hono()
	.use("*", authMiddleware)

	// Subscribe to project realtime updates
	.post("/subscribe", validator("json", SubscribeSchema), async (c) => {
		try {
			const { projectId, presence } = c.req.valid("json");
			const user = c.get("user");

			// Verify user has access to project
			const project = await db.project.findFirst({
				where: { id: projectId },
				include: { organization: true },
			});

			if (!project) {
				return c.json({ error: "Project not found" }, 404);
			}

			// Check organization membership
			const membership = await db.member.findFirst({
				where: {
					userId: user.id,
					organizationId: project.organizationId,
				},
			});

			if (!membership) {
				return c.json({ error: "Access denied to project" }, 403);
			}

			// Return subscription configuration for client
			return c.json({
				success: true,
				channelName: `project:${projectId}`,
				userPresence: {
					userId: user.id,
					userName: user.name,
					userEmail: user.email,
					projectId,
					...presence,
				},
				realtimeConfig: {
					url: process.env.SUPABASE_URL,
					anonKey: process.env.SUPABASE_ANON_KEY,
				},
			});
		} catch (error) {
			console.error("Realtime subscribe error:", error);
			return c.json(
				{ error: "Failed to setup realtime subscription" },
				500,
			);
		}
	})

	// Update user presence
	.post("/presence", validator("json", PresenceUpdateSchema), async (c) => {
		try {
			const data = c.req.valid("json");
			const user = c.get("user");

			// Verify access to project (same as subscribe)
			const project = await db.project.findFirst({
				where: { id: data.projectId },
				include: { organization: true },
			});

			if (!project) {
				return c.json({ error: "Project not found" }, 404);
			}

			const membership = await db.member.findFirst({
				where: {
					userId: user.id,
					organizationId: project.organizationId,
				},
			});

			if (!membership) {
				return c.json({ error: "Access denied to project" }, 403);
			}

			// Create realtime client and update presence
			// Note: In a real implementation, you'd want to manage persistent connections
			// rather than creating a new client for each request
			const supabase = createRealtimeClient();
			const channel = createProjectChannel(
				supabase,
				data.projectId,
				user.id,
			);

			const presenceUpdate: Omit<UserPresence, "lastSeen"> = {
				userId: user.id,
				userName: user.name,
				userEmail: user.email,
				projectId: data.projectId,
				viewingDrawingId: data.viewingDrawingId,
				editingComponentId: data.editingComponentId,
				isTyping: data.isTyping,
			};

			// Subscribe and update presence
			channel.subscribe(async (status) => {
				if (status === "SUBSCRIBED") {
					await updatePresence(channel, presenceUpdate);
				}
			});

			return c.json({ success: true });
		} catch (error) {
			console.error("Presence update error:", error);
			return c.json({ error: "Failed to update presence" }, 500);
		}
	})

	// Broadcast custom event
	.post("/broadcast", validator("json", BroadcastSchema), async (c) => {
		try {
			const data = c.req.valid("json");
			const user = c.get("user");

			// Rate limiting
			if (!checkBroadcastRateLimit(user.id, 60)) {
				return c.json({ error: "Rate limit exceeded" }, 429);
			}

			// Verify access to project
			const project = await db.project.findFirst({
				where: { id: data.projectId },
				include: { organization: true },
			});

			if (!project) {
				return c.json({ error: "Project not found" }, 404);
			}

			const membership = await db.member.findFirst({
				where: {
					userId: user.id,
					organizationId: project.organizationId,
				},
			});

			if (!membership) {
				return c.json({ error: "Access denied to project" }, 403);
			}

			// Sanitize payload to prevent XSS
			const sanitizedPayload = {
				...data.payload,
				// Remove any potentially dangerous HTML/scripts
				message:
					typeof data.payload.message === "string"
						? data.payload.message.replace(
								/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
								"",
							)
						: data.payload.message,
			};

			// Create broadcast event
			const broadcastData: Omit<BroadcastEvent, "timestamp"> = {
				type: data.type,
				payload: sanitizedPayload,
				userId: user.id,
			};

			// Create realtime client and broadcast
			const supabase = createRealtimeClient();
			const channel = createProjectChannel(
				supabase,
				data.projectId,
				user.id,
			);

			channel.subscribe(async (status) => {
				if (status === "SUBSCRIBED") {
					const result = await broadcastEvent(channel, broadcastData);

					// Log broadcast for debugging
					console.log(
						`Broadcast ${data.type} to project ${data.projectId}:`,
						result,
					);

					// Cleanup
					setTimeout(() => channel.unsubscribe(), 1000);
				}
			});

			return c.json({ success: true });
		} catch (error) {
			console.error("Broadcast error:", error);
			return c.json({ error: "Failed to broadcast event" }, 500);
		}
	})

	// Get active users for a project
	.get("/active-users/:projectId", async (c) => {
		try {
			const projectId = c.req.param("projectId");
			const user = c.get("user");

			// Verify access to project
			const project = await db.project.findFirst({
				where: { id: projectId },
				include: { organization: true },
			});

			if (!project) {
				return c.json({ error: "Project not found" }, 404);
			}

			const membership = await db.member.findFirst({
				where: {
					userId: user.id,
					organizationId: project.organizationId,
				},
			});

			if (!membership) {
				return c.json({ error: "Access denied to project" }, 403);
			}

			// Get active users using the database function
			const activeUsers = (await db.$queryRaw`
          SELECT * FROM get_active_project_users(${projectId})
        `) as Array<{
				user_id: string;
				user_name: string;
				user_email: string;
				last_seen: Date;
			}>;

			return c.json({
				activeUsers: activeUsers.map((user) => ({
					userId: user.user_id,
					userName: user.user_name,
					userEmail: user.user_email,
					lastSeen: user.last_seen,
				})),
			});
		} catch (error) {
			console.error("Active users error:", error);
			return c.json({ error: "Failed to get active users" }, 500);
		}
	})

	// Get realtime connection status
	.get("/status/:projectId", async (c) => {
		try {
			const projectId = c.req.param("projectId");
			const user = c.get("user");

			// Verify access
			const project = await db.project.findFirst({
				where: { id: projectId },
				include: { organization: true },
			});

			if (!project) {
				return c.json({ error: "Project not found" }, 404);
			}

			const membership = await db.member.findFirst({
				where: {
					userId: user.id,
					organizationId: project.organizationId,
				},
			});

			if (!membership) {
				return c.json({ error: "Access denied to project" }, 403);
			}

			// Return connection status info
			return c.json({
				projectId,
				realtimeEnabled: true,
				channelName: `project:${projectId}`,
				features: {
					componentUpdates: true,
					milestoneUpdates: true,
					drawingUpdates: true,
					importJobProgress: true,
					userPresence: true,
					customBroadcasts: true,
					auditLogs: true,
				},
				limits: {
					broadcastsPerMinute: 60,
					presenceUpdatesPerMinute: 120,
				},
			});
		} catch (error) {
			console.error("Status check error:", error);
			return c.json({ error: "Failed to check realtime status" }, 500);
		}
	})

	// Health check for realtime system
	.get("/health", async (c) => {
		try {
			// Test Supabase connection
			const supabase = createRealtimeClient();

			// Simple test to verify realtime is working
			const testChannel = supabase.channel("health-check");

			let isHealthy = false;
			const timeoutPromise = new Promise((_, reject) => {
				setTimeout(
					() => reject(new Error("Health check timeout")),
					5000,
				);
			});

			const healthPromise = new Promise<void>((resolve) => {
				testChannel.subscribe((status) => {
					if (status === "SUBSCRIBED") {
						isHealthy = true;
						testChannel.unsubscribe();
						resolve();
					}
				});
			});

			await Promise.race([healthPromise, timeoutPromise]);

			return c.json({
				status: isHealthy ? "healthy" : "unhealthy",
				timestamp: new Date().toISOString(),
				services: {
					supabaseRealtime: isHealthy,
					database: true, // We know this works if we got here
				},
			});
		} catch (error) {
			console.error("Realtime health check failed:", error);
			return c.json(
				{
					status: "unhealthy",
					error: error.message,
					timestamp: new Date().toISOString(),
					services: {
						supabaseRealtime: false,
						database: true,
					},
				},
				503,
			);
		}
	});

// Helper function to verify project access (used by other API routes)
export async function verifyProjectAccess(
	userId: string,
	projectId: string,
): Promise<boolean> {
	try {
		const project = await db.project.findFirst({
			where: { id: projectId },
			include: { organization: true },
		});

		if (!project) {
			return false;
		}

		const membership = await db.member.findFirst({
			where: {
				userId,
				organizationId: project.organizationId,
			},
		});

		return !!membership;
	} catch (error) {
		console.error("Project access verification error:", error);
		return false;
	}
}

// Helper to broadcast component update to project channel
export async function broadcastComponentUpdate(
	projectId: string,
	componentId: string,
	updateData: any,
	userId: string,
) {
	try {
		const supabase = createRealtimeClient();
		const channel = createProjectChannel(supabase, projectId, userId);

		const broadcastData: Omit<BroadcastEvent, "timestamp"> = {
			type: "component_edit",
			payload: {
				componentId,
				action: "update",
				data: updateData,
			},
			userId,
		};

		channel.subscribe(async (status) => {
			if (status === "SUBSCRIBED") {
				await broadcastEvent(channel, broadcastData);
				setTimeout(() => channel.unsubscribe(), 1000);
			}
		});
	} catch (error) {
		console.error("Failed to broadcast component update:", error);
		// Don't throw - realtime is not critical for core functionality
	}
}

// Helper to broadcast milestone completion celebration
export async function broadcastMilestoneCelebration(
	projectId: string,
	componentId: string,
	milestoneName: string,
	completedBy: string,
) {
	try {
		const supabase = createRealtimeClient();
		const channel = createProjectChannel(supabase, projectId, completedBy);

		const broadcastData: Omit<BroadcastEvent, "timestamp"> = {
			type: "milestone_celebration",
			payload: {
				componentId,
				milestoneName,
				completedBy,
				message: `🎉 Milestone "${milestoneName}" completed!`,
			},
			userId: completedBy,
		};

		channel.subscribe(async (status) => {
			if (status === "SUBSCRIBED") {
				await broadcastEvent(channel, broadcastData);
				setTimeout(() => channel.unsubscribe(), 1000);
			}
		});
	} catch (error) {
		console.error("Failed to broadcast milestone celebration:", error);
	}
}

// Helper to broadcast import progress
export async function broadcastImportProgress(
	projectId: string,
	importJobId: string,
	progress: {
		status: string;
		processedRows?: number;
		totalRows?: number;
		errorRows?: number;
		filename: string;
	},
	userId: string,
) {
	try {
		const supabase = createRealtimeClient();
		if (!supabase) {
			console.log(
				"Realtime disabled - skipping import progress broadcast",
			);
			return;
		}
		const channel = createProjectChannel(supabase, projectId, userId);

		const broadcastData: Omit<BroadcastEvent, "timestamp"> = {
			type: "import_progress",
			payload: {
				importJobId,
				...progress,
				progressPercent:
					progress.totalRows && progress.processedRows
						? Math.round(
								(progress.processedRows / progress.totalRows) *
									100,
							)
						: 0,
			},
			userId,
		};

		channel.subscribe(async (status) => {
			if (status === "SUBSCRIBED") {
				await broadcastEvent(channel, broadcastData);
				setTimeout(() => channel.unsubscribe(), 1000);
			}
		});
	} catch (error) {
		console.error("Failed to broadcast import progress:", error);
	}
}

// Helper to broadcast report generation status
export async function broadcastReportGeneration(
	projectId: string,
	reportId: string,
	status: "started" | "processing" | "completed" | "failed",
	userId: string,
	progress?: {
		current?: number;
		total?: number;
		message?: string;
	},
) {
	try {
		const supabase = createRealtimeClient();
		const channel = createProjectChannel(supabase, projectId, userId);

		const broadcastData: Omit<BroadcastEvent, "timestamp"> = {
			type: "report_generation",
			payload: {
				reportId,
				status,
				progress: {
					...progress,
					progressPercent:
						progress?.current && progress?.total
							? Math.round(
									(progress.current / progress.total) * 100,
								)
							: 0,
				},
			},
			userId,
		};

		channel.subscribe(async (status) => {
			if (status === "SUBSCRIBED") {
				await broadcastEvent(channel, broadcastData);
				setTimeout(() => channel.unsubscribe(), 1000);
			}
		});
	} catch (error) {
		console.error("Failed to broadcast report generation status:", error);
	}
}
