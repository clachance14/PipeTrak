import type {
	RealtimeChannel,
	RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

// Types for realtime events
export interface ComponentChangePayload {
	type: "component";
	action: "INSERT" | "UPDATE" | "DELETE";
	component_id: string;
	drawing_id: string;
	status: string;
	completion_percent: number;
}

export interface MilestoneChangePayload {
	type: "milestone";
	action: "INSERT" | "UPDATE" | "DELETE";
	component_id: string;
	milestone_name: string;
	is_completed: boolean;
	completed_by?: string;
	completed_at?: string;
}

export interface ImportJobPayload {
	type: "import_job";
	action: "INSERT" | "UPDATE" | "DELETE";
	job_id: string;
	status: string;
	filename: string;
	processed_rows?: number;
	total_rows?: number;
	error_rows?: number;
}

export interface AuditLogPayload {
	type: "audit_log";
	action: "INSERT" | "UPDATE" | "DELETE";
	data: any;
}

export interface UserPresence {
	userId: string;
	userName: string;
	userEmail: string;
	projectId: string;
	viewingDrawingId?: string;
	editingComponentId?: string;
	lastSeen: Date;
	isTyping?: boolean;
}

export interface BroadcastEvent {
	type:
		| "user_presence"
		| "component_edit"
		| "milestone_celebration"
		| "import_progress"
		| "report_generation"
		| "custom";
	payload: any;
	userId: string;
	timestamp: Date;
}

// Initialize Supabase client for realtime
export function createRealtimeClient() {
	if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
		console.warn(
			"Missing Supabase environment variables - realtime features disabled",
		);
		return null;
	}

	return createClient(
		process.env.SUPABASE_URL,
		process.env.SUPABASE_SERVICE_ROLE_KEY,
		{
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
			realtime: {
				params: {
					eventsPerSecond: 100, // Rate limit for events
				},
			},
		},
	);
}

// Create project-scoped realtime channel
export function createProjectChannel(
	supabase: ReturnType<typeof createRealtimeClient>,
	projectId: string,
	userId: string,
): RealtimeChannel | null {
	if (!supabase) {
		console.warn(
			"Supabase client is null - cannot create realtime channel",
		);
		return null;
	}

	const channel = supabase.channel(`project:${projectId}`, {
		config: {
			presence: {
				key: userId,
			},
			broadcast: {
				ack: true,
				self: false, // Don't echo back to sender
			},
		},
	});

	return channel;
}

// Subscribe to database changes for a project
export function subscribeToProjectChanges(
	channel: RealtimeChannel,
	projectId: string,
	callbacks: {
		onComponentChange?: (payload: ComponentChangePayload) => void;
		onMilestoneChange?: (payload: MilestoneChangePayload) => void;
		onDrawingChange?: (payload: any) => void;
		onImportJobChange?: (payload: ImportJobPayload) => void;
		onAuditLogChange?: (payload: AuditLogPayload) => void;
	},
) {
	// Subscribe to component changes
	if (callbacks.onComponentChange) {
		channel.on(
			"postgres_changes",
			{
				event: "*",
				schema: "public",
				table: "Component",
				filter: `projectId=eq.${projectId}`,
			},
			(payload: RealtimePostgresChangesPayload<any>) => {
				const changePayload: ComponentChangePayload = {
					type: "component",
					action: payload.eventType as any,
					component_id:
						(payload.new as any)?.id ||
						(payload.old as any)?.id ||
						"",
					drawing_id:
						(payload.new as any)?.drawingId ||
						(payload.old as any)?.drawingId ||
						"",
					status:
						(payload.new as any)?.status ||
						(payload.old as any)?.status ||
						"",
					completion_percent:
						(payload.new as any)?.completionPercent ||
						(payload.old as any)?.completionPercent ||
						0,
				};
				callbacks.onComponentChange?.(changePayload);
			},
		);
	}

	// Subscribe to milestone changes
	if (callbacks.onMilestoneChange) {
		channel.on(
			"postgres_changes",
			{
				event: "*",
				schema: "public",
				table: "ComponentMilestone",
			},
			async (payload: RealtimePostgresChangesPayload<any>) => {
				// We need to verify this milestone belongs to our project
				// This would be done through the component relationship
				const changePayload: MilestoneChangePayload = {
					type: "milestone",
					action: payload.eventType as any,
					component_id:
						(payload.new as any)?.componentId ||
						(payload.old as any)?.componentId ||
						"",
					milestone_name:
						(payload.new as any)?.milestoneName ||
						(payload.old as any)?.milestoneName ||
						"",
					is_completed: (payload.new as any)?.isCompleted || false,
					completed_by: (payload.new as any)?.completedBy,
					completed_at: (payload.new as any)?.completedAt,
				};
				callbacks.onMilestoneChange?.(changePayload);
			},
		);
	}

	// Subscribe to drawing changes
	if (callbacks.onDrawingChange) {
		channel.on(
			"postgres_changes",
			{
				event: "*",
				schema: "public",
				table: "Drawing",
				filter: `projectId=eq.${projectId}`,
			},
			(payload: RealtimePostgresChangesPayload<any>) => {
				callbacks.onDrawingChange?.(payload);
			},
		);
	}

	// Subscribe to import job changes
	if (callbacks.onImportJobChange) {
		channel.on(
			"postgres_changes",
			{
				event: "*",
				schema: "public",
				table: "ImportJob",
				filter: `projectId=eq.${projectId}`,
			},
			(payload: RealtimePostgresChangesPayload<any>) => {
				const changePayload: ImportJobPayload = {
					type: "import_job",
					action: payload.eventType as any,
					job_id:
						(payload.new as any)?.id ||
						(payload.old as any)?.id ||
						"",
					status:
						(payload.new as any)?.status ||
						(payload.old as any)?.status ||
						"",
					filename:
						(payload.new as any)?.filename ||
						(payload.old as any)?.filename ||
						"",
					processed_rows: (payload.new as any)?.processedRows,
					total_rows: (payload.new as any)?.totalRows,
					error_rows: (payload.new as any)?.errorRows,
				};
				callbacks.onImportJobChange?.(changePayload);
			},
		);
	}

	// Subscribe to audit log changes
	if (callbacks.onAuditLogChange) {
		channel.on(
			"postgres_changes",
			{
				event: "*",
				schema: "public",
				table: "AuditLog",
				filter: `projectId=eq.${projectId}`,
			},
			(payload: RealtimePostgresChangesPayload<any>) => {
				const changePayload: AuditLogPayload = {
					type: "audit_log",
					action: payload.eventType as any,
					data: (payload.new as any) || (payload.old as any) || {},
				};
				callbacks.onAuditLogChange?.(changePayload);
			},
		);
	}

	return channel;
}

// Subscribe to presence events
export function subscribeToPresence(
	channel: RealtimeChannel,
	callbacks: {
		onPresenceSync?: (presences: Record<string, UserPresence[]>) => void;
		onPresenceJoin?: (
			key: string,
			currentPresences: UserPresence[],
			newPresences: UserPresence[],
		) => void;
		onPresenceLeave?: (
			key: string,
			currentPresences: UserPresence[],
			leftPresences: UserPresence[],
		) => void;
	},
) {
	if (callbacks.onPresenceSync) {
		channel.on("presence", { event: "sync" }, () => {
			const state = channel.presenceState<UserPresence>();
			callbacks.onPresenceSync?.(state);
		});
	}

	if (callbacks.onPresenceJoin) {
		channel.on(
			"presence",
			{ event: "join" },
			({ key, currentPresences, newPresences }) => {
				callbacks.onPresenceJoin?.(
					key,
					currentPresences as unknown as UserPresence[],
					newPresences as unknown as UserPresence[],
				);
			},
		);
	}

	if (callbacks.onPresenceLeave) {
		channel.on(
			"presence",
			{ event: "leave" },
			({ key, currentPresences, leftPresences }) => {
				callbacks.onPresenceLeave?.(
					key,
					currentPresences as unknown as UserPresence[],
					leftPresences as unknown as UserPresence[],
				);
			},
		);
	}
}

// Subscribe to broadcast events
export function subscribeToBroadcasts(
	channel: RealtimeChannel,
	callbacks: {
		onBroadcast?: (event: BroadcastEvent) => void;
	},
) {
	if (callbacks.onBroadcast) {
		channel.on("broadcast", { event: "*" }, (payload) => {
			callbacks.onBroadcast?.(payload as unknown as BroadcastEvent);
		});
	}
}

// Send broadcast event
export async function broadcastEvent(
	channel: RealtimeChannel,
	event: Omit<BroadcastEvent, "timestamp">,
): Promise<"ok" | "timed out" | "rate limited" | "error"> {
	const result = await channel.send({
		type: "broadcast",
		event: event.type,
		payload: {
			...event,
			timestamp: new Date().toISOString(),
		},
	});

	return result;
}

// Track user presence
export async function trackPresence(
	channel: RealtimeChannel,
	presence: Omit<UserPresence, "lastSeen">,
): Promise<"ok" | "timed out" | "rate limited" | "error"> {
	const result = await channel.track({
		...presence,
		lastSeen: new Date().toISOString(),
	});

	return result;
}

// Update user presence
export async function updatePresence(
	channel: RealtimeChannel,
	updates: Partial<Omit<UserPresence, "lastSeen">>,
): Promise<"ok" | "timed out" | "rate limited" | "error"> {
	const currentState = channel.presenceState<UserPresence>();
	const currentPresence = Object.values(currentState)[0]?.[0];

	if (!currentPresence) {
		throw new Error("No current presence to update");
	}

	const result = await channel.track({
		...currentPresence,
		...updates,
		lastSeen: new Date().toISOString(),
	});

	return result;
}

// Untrack user presence
export async function untrackPresence(
	channel: RealtimeChannel,
): Promise<"ok" | "timed out" | "rate limited" | "error"> {
	const result = await channel.untrack();
	return result;
}

// Conflict resolution for simultaneous edits
export interface ConflictData {
	componentId: string;
	field: string;
	userValue: any;
	serverValue: any;
	lastModified: Date;
	lastModifiedBy: string;
}

export function detectConflict(
	localData: { value: any; lastModified: Date },
	serverData: { value: any; lastModified: Date; lastModifiedBy: string },
	currentUserId: string,
): ConflictData | null {
	// If server was modified after local modification by someone else, we have a conflict
	if (
		serverData.lastModified > localData.lastModified &&
		serverData.lastModifiedBy !== currentUserId &&
		serverData.value !== localData.value
	) {
		return {
			componentId: "", // Will be filled by caller
			field: "", // Will be filled by caller
			userValue: localData.value,
			serverValue: serverData.value,
			lastModified: serverData.lastModified,
			lastModifiedBy: serverData.lastModifiedBy,
		};
	}

	return null;
}

// Merge conflict resolution strategies
export const conflictResolutionStrategies = {
	// Always use server version
	serverWins: (conflict: ConflictData) => conflict.serverValue,

	// Always use user version
	userWins: (conflict: ConflictData) => conflict.userValue,

	// Use most recent
	lastWriteWins: (conflict: ConflictData, userModifiedAt: Date) =>
		userModifiedAt > conflict.lastModified
			? conflict.userValue
			: conflict.serverValue,

	// For numeric fields, use higher value
	maxValue: (conflict: ConflictData) => {
		const userNum = Number(conflict.userValue);
		const serverNum = Number(conflict.serverValue);
		return Number.isNaN(userNum) || Number.isNaN(serverNum)
			? conflict.serverValue
			: Math.max(userNum, serverNum);
	},

	// For arrays, merge unique values
	mergeArrays: (conflict: ConflictData) => {
		if (
			Array.isArray(conflict.userValue) &&
			Array.isArray(conflict.serverValue)
		) {
			return [
				...new Set([...conflict.userValue, ...conflict.serverValue]),
			];
		}
		return conflict.serverValue;
	},
};

// Helper to create optimistic update with rollback
export function createOptimisticUpdate<T>(
	originalValue: T,
	_optimisticValue: T,
	rollbackCallback: (original: T) => void,
) {
	return {
		commit: () => {
			// Optimistic value is already applied, nothing to do
		},
		rollback: () => {
			rollbackCallback(originalValue);
		},
	};
}

// Rate limiting for broadcasts to prevent spam
const broadcastLimits = new Map<string, { count: number; resetTime: number }>();

export function checkBroadcastRateLimit(
	userId: string,
	maxPerMinute = 60,
): boolean {
	const now = Date.now();
	const key = userId;
	const limit = broadcastLimits.get(key);

	if (!limit || now > limit.resetTime) {
		broadcastLimits.set(key, { count: 1, resetTime: now + 60000 });
		return true;
	}

	if (limit.count >= maxPerMinute) {
		return false;
	}

	limit.count += 1;
	return true;
}

// Cleanup function for realtime resources
export function cleanupRealtimeResources(channel: RealtimeChannel) {
	// Unsubscribe from all events
	channel.unsubscribe();

	// Clear any local state/caches related to this channel
	// This would be called when user navigates away or connection is lost
}

// Connection health monitoring
export function monitorRealtimeHealth(
	channel: RealtimeChannel,
	callbacks: {
		onConnected?: () => void;
		onDisconnected?: () => void;
		onError?: (error: Error) => void;
		onReconnecting?: () => void;
	},
) {
	channel.on("system", {}, (payload) => {
		switch (payload.status) {
			case "ok":
				callbacks.onConnected?.();
				break;
			case "error":
				callbacks.onError?.(
					new Error(payload.message || "Realtime error"),
				);
				break;
			case "timed_out":
				callbacks.onDisconnected?.();
				break;
			case "closed":
				callbacks.onDisconnected?.();
				break;
		}
	});

	// Monitor connection state
	const supabase = channel.socket;
	if (supabase) {
		// Note: These methods may not exist on all versions of the Supabase client
		try {
			if ("onOpen" in supabase && typeof supabase.onOpen === "function") {
				supabase.onOpen(() => callbacks.onConnected?.());
			}
			if (
				"onClose" in supabase &&
				typeof supabase.onClose === "function"
			) {
				supabase.onClose(() => callbacks.onDisconnected?.());
			}
			if (
				"onError" in supabase &&
				typeof supabase.onError === "function"
			) {
				supabase.onError((error: any) => callbacks.onError?.(error));
			}
		} catch (error) {
			console.warn(
				"Some realtime connection monitoring methods are not available:",
				error,
			);
		}
	}
}
