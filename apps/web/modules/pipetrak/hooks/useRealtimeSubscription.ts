"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useSession } from "@saas/auth/hooks/use-session";
import { createClientWithAuth } from "../../../lib/supabase/client";

// Types for realtime events
export interface ComponentUpdate {
	type: "component";
	action: "INSERT" | "UPDATE" | "DELETE";
	component_id: string;
	drawing_id: string;
	status: string;
	completion_percent: number;
}

// Supabase realtime payload types
interface ComponentPayloadData {
	id: string;
	drawingId: string;
	status: string;
	completionPercent: number;
	componentId?: string;
}

interface MilestonePayloadData {
	id: string;
	componentId: string;
	milestoneName: string;
	isCompleted: boolean;
	completedBy?: string;
	completedAt?: string;
}

interface ImportJobPayloadData {
	id: string;
	status: string;
	filename: string;
	processedRows?: number;
	totalRows?: number;
	errorRows?: number;
}

export interface MilestoneUpdate {
	type: "milestone";
	action: "INSERT" | "UPDATE" | "DELETE";
	component_id: string;
	milestone_name: string;
	is_completed: boolean;
	completed_by?: string;
	completed_at?: string;
}

export interface ImportJobUpdate {
	type: "import_job";
	action: "INSERT" | "UPDATE" | "DELETE";
	job_id: string;
	status: string;
	filename: string;
	processed_rows?: number;
	total_rows?: number;
	error_rows?: number;
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
		| "custom";
	payload: any;
	userId: string;
	timestamp: Date;
}

export interface RealtimeState {
	isConnected: boolean;
	isSubscribed: boolean;
	connectionState: "connecting" | "connected" | "disconnected" | "error";
	activeUsers: UserPresence[];
	lastError?: Error;
}

// Hook for subscribing to component updates
export function useComponentUpdates(
	projectId: string,
	options: {
		onComponentUpdate?: (update: ComponentUpdate) => void;
		enabled?: boolean;
	} = {},
) {
	const { enabled = true } = options;
	const [updates, setUpdates] = useState<ComponentUpdate[]>([]);
	const [isConnected, setIsConnected] = useState(false);
	const { session } = useSession();

	useEffect(() => {
		if (!enabled || !session || !projectId) return;

		const supabase = createClientWithAuth(session.token);

		const channel = supabase
			.channel(`project:${projectId}:components`)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "Component",
					filter: `projectId=eq.${projectId}`,
				},
				(payload) => {
					const newData = payload.new as ComponentPayloadData | null;
					const oldData = payload.old as ComponentPayloadData | null;
					
					const update: ComponentUpdate = {
						type: "component",
						action: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
						component_id: newData?.id || oldData?.id || "",
						drawing_id: newData?.drawingId || oldData?.drawingId || "",
						status: newData?.status || oldData?.status || "",
						completion_percent: newData?.completionPercent || oldData?.completionPercent || 0,
					};

					setUpdates((prev) => [...prev.slice(-19), update]); // Keep last 20 updates
					options.onComponentUpdate?.(update);
				},
			)
			.subscribe((status) => {
				setIsConnected(status === "SUBSCRIBED");
			});

		return () => {
			channel.unsubscribe();
		};
	}, [projectId, enabled, session, options.onComponentUpdate]);

	return {
		updates,
		isConnected,
		clearUpdates: () => setUpdates([]),
	};
}

// Hook for subscribing to milestone updates
export function useMilestoneUpdates(
	projectId: string,
	options: {
		onMilestoneUpdate?: (update: MilestoneUpdate) => void;
		onMilestoneCelebration?: (celebration: {
			componentId: string;
			milestoneName: string;
			completedBy: string;
		}) => void;
		enabled?: boolean;
	} = {},
) {
	const { enabled = true } = options;
	const [updates, setUpdates] = useState<MilestoneUpdate[]>([]);
	const [isConnected, setIsConnected] = useState(false);
	const { session } = useSession();

	useEffect(() => {
		if (!enabled || !session || !projectId) return;

		const supabase = createClientWithAuth(session.token);

		const channel = supabase
			.channel(`project:${projectId}:milestones`)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "ComponentMilestone",
				},
				(payload) => {
					const newData = payload.new as MilestonePayloadData | null;
					const oldData = payload.old as MilestonePayloadData | null;
					
					const update: MilestoneUpdate = {
						type: "milestone",
						action: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
						component_id: newData?.componentId || oldData?.componentId || "",
						milestone_name: newData?.milestoneName || oldData?.milestoneName || "",
						is_completed: newData?.isCompleted || false,
						completed_by: newData?.completedBy,
						completed_at: newData?.completedAt,
					};

					setUpdates((prev) => [...prev.slice(-19), update]);
					options.onMilestoneUpdate?.(update);

					// Trigger celebration for completed milestones
					if (
						update.action === "UPDATE" &&
						update.is_completed &&
						update.completed_by
					) {
						options.onMilestoneCelebration?.({
							componentId: update.component_id,
							milestoneName: update.milestone_name,
							completedBy: update.completed_by,
						});
					}
				},
			)
			.on("broadcast", { event: "milestone_celebration" }, (payload) => {
				options.onMilestoneCelebration?.(payload.payload);
			})
			.subscribe((status) => {
				setIsConnected(status === "SUBSCRIBED");
			});

		return () => {
			channel.unsubscribe();
		};
	}, [
		projectId,
		enabled,
		session,
		options.onMilestoneUpdate,
		options.onMilestoneCelebration,
	]);

	return {
		updates,
		isConnected,
		clearUpdates: () => setUpdates([]),
	};
}

// Hook for user presence tracking
export function usePresence(
	projectId: string,
	options: {
		viewingDrawingId?: string;
		editingComponentId?: string;
		onPresenceUpdate?: (presences: Record<string, UserPresence[]>) => void;
		enabled?: boolean;
	} = {},
) {
	const { enabled = true } = options;
	const [presences, setPresences] = useState<Record<string, UserPresence[]>>(
		{},
	);
	const [myPresence, setMyPresence] = useState<UserPresence | null>(null);
	const [isConnected, setIsConnected] = useState(false);
	const channelRef = useRef<RealtimeChannel | null>(null);
	const { session } = useSession();

	// Update presence when options change
	const updatePresence = useCallback(
		async (
			updates: Partial<
				Pick<
					UserPresence,
					"viewingDrawingId" | "editingComponentId" | "isTyping"
				>
			>,
		) => {
			if (!channelRef.current || !session) return;

			const newPresence: Omit<UserPresence, "lastSeen"> = {
				userId: session.userId,
				userName: "", // TODO: Get from user table
				userEmail: "", // TODO: Get from user table
				projectId,
				viewingDrawingId: options.viewingDrawingId,
				editingComponentId: options.editingComponentId,
				...updates,
			};

			await channelRef.current.track(newPresence);
			setMyPresence({ ...newPresence, lastSeen: new Date() });
		},
		[
			session,
			projectId,
			options.viewingDrawingId,
			options.editingComponentId,
		],
	);

	useEffect(() => {
		if (!enabled || !session || !projectId) return;

		const supabase = createClientWithAuth(session.token);

		const channel = supabase
			.channel(`project:${projectId}:presence`, {
				config: {
					presence: {
						key: session.userId,
					},
				},
			})
			.on("presence", { event: "sync" }, () => {
				const state = channel.presenceState<UserPresence>();
				setPresences(state);
				options.onPresenceUpdate?.(state);
			})
			.on("presence", { event: "join" }, ({ key, newPresences }) => {
				console.log(`User ${key} joined:`, newPresences);
			})
			.on("presence", { event: "leave" }, ({ key, leftPresences }) => {
				console.log(`User ${key} left:`, leftPresences);
			})
			.subscribe(async (status) => {
				setIsConnected(status === "SUBSCRIBED");
				if (status === "SUBSCRIBED") {
					// Track initial presence
					await updatePresence({});
				}
			});

		channelRef.current = channel;

		return () => {
			channel.untrack();
			channel.unsubscribe();
			channelRef.current = null;
		};
	}, [projectId, enabled, session, updatePresence, options.onPresenceUpdate]);

	// Update presence when viewing/editing changes
	useEffect(() => {
		if (isConnected) {
			updatePresence({
				viewingDrawingId: options.viewingDrawingId,
				editingComponentId: options.editingComponentId,
			});
		}
	}, [
		options.viewingDrawingId,
		options.editingComponentId,
		isConnected,
		updatePresence,
	]);

	return {
		presences,
		myPresence,
		isConnected,
		updatePresence,
		activeUserCount: Object.keys(presences).length,
		activeUsers: Object.values(presences).flat(),
	};
}

// Hook for optimistic updates
export function useOptimisticUpdates<T>(
	initialData: T,
	onRollback?: (data: T) => void,
) {
	const [data, setData] = useState<T>(initialData);
	const [optimisticUpdates, setOptimisticUpdates] = useState<
		Array<{
			id: string;
			originalValue: T;
			optimisticValue: T;
		}>
	>([]);

	const applyOptimisticUpdate = useCallback(
		(id: string, optimisticValue: T) => {
			setOptimisticUpdates((prev) => [
				...prev.filter((u) => u.id !== id),
				{ id, originalValue: data, optimisticValue },
			]);
			setData(optimisticValue);
		},
		[data],
	);

	const commitUpdate = useCallback((id: string, confirmedValue: T) => {
		setOptimisticUpdates((prev) => prev.filter((u) => u.id !== id));
		setData(confirmedValue);
	}, []);

	const rollbackUpdate = useCallback(
		(id: string) => {
			const update = optimisticUpdates.find((u) => u.id === id);
			if (update) {
				setData(update.originalValue);
				setOptimisticUpdates((prev) => prev.filter((u) => u.id !== id));
				onRollback?.(update.originalValue);
			}
		},
		[optimisticUpdates, onRollback],
	);

	const rollbackAllUpdates = useCallback(() => {
		const lastOriginal = optimisticUpdates[0]?.originalValue;
		if (lastOriginal) {
			setData(lastOriginal);
			onRollback?.(lastOriginal);
		}
		setOptimisticUpdates([]);
	}, [optimisticUpdates, onRollback]);

	return {
		data,
		setData,
		applyOptimisticUpdate,
		commitUpdate,
		rollbackUpdate,
		rollbackAllUpdates,
		hasOptimisticUpdates: optimisticUpdates.length > 0,
		optimisticUpdateCount: optimisticUpdates.length,
	};
}

// Main realtime subscription hook
export function useRealtimeSubscription(
	projectId: string,
	options: {
		enableComponents?: boolean;
		enableMilestones?: boolean;
		enablePresence?: boolean;
		enableImportJobs?: boolean;
		viewingDrawingId?: string;
		editingComponentId?: string;
		onComponentUpdate?: (update: ComponentUpdate) => void;
		onMilestoneUpdate?: (update: MilestoneUpdate) => void;
		onMilestoneCelebration?: (celebration: any) => void;
		onImportJobUpdate?: (update: ImportJobUpdate) => void;
		onPresenceUpdate?: (presences: Record<string, UserPresence[]>) => void;
		onBroadcast?: (event: BroadcastEvent) => void;
	} = {},
) {
	const [state, setState] = useState<RealtimeState>({
		isConnected: false,
		isSubscribed: false,
		connectionState: "disconnected",
		activeUsers: [],
	});

	const componentUpdates = useComponentUpdates(projectId, {
		enabled: options.enableComponents !== false,
		onComponentUpdate: options.onComponentUpdate,
	});

	const milestoneUpdates = useMilestoneUpdates(projectId, {
		enabled: options.enableMilestones !== false,
		onMilestoneUpdate: options.onMilestoneUpdate,
		onMilestoneCelebration: options.onMilestoneCelebration,
	});

	const presence = usePresence(projectId, {
		enabled: options.enablePresence !== false,
		viewingDrawingId: options.viewingDrawingId,
		editingComponentId: options.editingComponentId,
		onPresenceUpdate: options.onPresenceUpdate,
	});

	const importJobUpdates = useImportJobUpdates(projectId, {
		enabled: options.enableImportJobs !== false,
		onImportJobUpdate: options.onImportJobUpdate,
	});

	// Update overall state based on individual hook states
	useEffect(() => {
		const connected =
			componentUpdates.isConnected ||
			milestoneUpdates.isConnected ||
			presence.isConnected ||
			importJobUpdates.isConnected;

		setState((prev) => ({
			...prev,
			isConnected: connected,
			isSubscribed: connected,
			connectionState: connected ? "connected" : "disconnected",
			activeUsers: presence.activeUsers,
		}));
	}, [
		componentUpdates.isConnected,
		milestoneUpdates.isConnected,
		presence.isConnected,
		importJobUpdates.isConnected,
		presence.activeUsers,
	]);

	return {
		...state,
		componentUpdates: componentUpdates.updates,
		milestoneUpdates: milestoneUpdates.updates,
		presence: presence.presences,
		activeUserCount: presence.activeUserCount,
		clearUpdates: () => {
			componentUpdates.clearUpdates();
			milestoneUpdates.clearUpdates();
			importJobUpdates.clearUpdates();
		},
	};
}

// Hook for import job updates
export function useImportJobUpdates(
	projectId: string,
	options: {
		onImportJobUpdate?: (update: ImportJobUpdate) => void;
		enabled?: boolean;
	} = {},
) {
	const { enabled = true } = options;
	const [updates, setUpdates] = useState<ImportJobUpdate[]>([]);
	const [isConnected, setIsConnected] = useState(false);
	const { session } = useSession();

	useEffect(() => {
		if (!enabled || !session || !projectId) return;

		const supabase = createClientWithAuth(session.token);

		const channel = supabase
			.channel(`project:${projectId}:imports`)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "ImportJob",
					filter: `projectId=eq.${projectId}`,
				},
				(payload) => {
					const newData = payload.new as ImportJobPayloadData | null;
					const oldData = payload.old as ImportJobPayloadData | null;
					
					const update: ImportJobUpdate = {
						type: "import_job",
						action: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
						job_id: newData?.id || oldData?.id || "",
						status: newData?.status || oldData?.status || "",
						filename: newData?.filename || oldData?.filename || "",
						processed_rows: newData?.processedRows,
						total_rows: newData?.totalRows,
						error_rows: newData?.errorRows,
					};

					setUpdates((prev) => [...prev.slice(-19), update]);
					options.onImportJobUpdate?.(update);
				},
			)
			.on("broadcast", { event: "import_progress" }, (payload) => {
				// Handle broadcast import progress updates
				options.onImportJobUpdate?.(payload.payload);
			})
			.subscribe((status) => {
				setIsConnected(status === "SUBSCRIBED");
			});

		return () => {
			channel.unsubscribe();
		};
	}, [projectId, enabled, session, options.onImportJobUpdate]);

	return {
		updates,
		isConnected,
		clearUpdates: () => setUpdates([]),
	};
}

// Hook for broadcasting events
export function useBroadcast(projectId: string) {
	const { session } = useSession();

	const broadcast = useCallback(
		async (
			type: BroadcastEvent["type"],
			payload: any,
		): Promise<boolean> => {
			if (!session || !projectId) return false;

			try {
				const response = await fetch(
					"/api/pipetrak/realtime/broadcast",
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${session.token}`,
						},
						body: JSON.stringify({
							projectId,
							type,
							payload,
						}),
					},
				);

				return response.ok;
			} catch (error) {
				console.error("Broadcast failed:", error);
				return false;
			}
		},
		[session, projectId],
	);

	return broadcast;
}
