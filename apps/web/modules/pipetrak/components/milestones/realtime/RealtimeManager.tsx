"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "../../../../../lib/supabase/client";
import type { ComponentMilestone } from "../../../types";

interface RealtimeUpdate {
	type:
		| "milestone_update"
		| "bulk_milestone_update"
		| "user_presence"
		| "conflict_resolved"
		| "bulk_operation_undone";
	payload: any;
	timestamp: string;
	userId: string;
}

interface UserPresence {
	userId: string;
	componentId?: string;
	action: "editing_start" | "editing_end" | "viewing";
	timestamp: string;
}

interface RealtimeManagerProps {
	projectId: string;
	userId: string;
	onMilestoneUpdate?: (milestone: ComponentMilestone) => void;
	onBulkUpdate?: (result: any) => void;
	onPresenceUpdate?: (presence: UserPresence) => void;
	onConflictResolved?: (resolution: any) => void;
	children: React.ReactNode;
}

export function RealtimeManager({
	projectId,
	userId,
	onMilestoneUpdate,
	onBulkUpdate,
	onPresenceUpdate,
	onConflictResolved,
	children,
}: RealtimeManagerProps) {
	const queryClient = useQueryClient();
	const supabase = useRef(createClient());
	const channelRef = useRef<any>(null);
	const presenceRef = useRef<UserPresence | null>(null);
	const [connectionStatus, setConnectionStatus] = useState<
		"connecting" | "connected" | "disconnected"
	>("connecting");

	// Handle incoming realtime updates
	const handleRealtimeUpdate = useCallback(
		(update: RealtimeUpdate) => {
			console.log("Received realtime update:", update);

			switch (update.type) {
				case "milestone_update": {
					const milestone = update.payload.milestone;
					if (milestone) {
						// Update React Query cache
						queryClient.setQueryData(
							["milestone", milestone.id],
							milestone,
						);

						// Invalidate related queries to trigger refetch
						queryClient.invalidateQueries({
							queryKey: [
								"component-milestones",
								milestone.componentId,
							],
						});

						// Show notification if update is from another user
						if (update.userId !== userId) {
							toast.info(
								`Milestone "${milestone.milestoneName}" updated by another user`,
							);
						}

						onMilestoneUpdate?.(milestone);
					}
					break;
				}

				case "bulk_milestone_update":
					// Invalidate all milestone-related queries for this project
					queryClient.invalidateQueries({
						queryKey: ["project-milestones", projectId],
					});
					queryClient.invalidateQueries({
						queryKey: ["component-milestones"],
					});

					// Show notification
					if (update.userId !== userId) {
						const { updated } = update.payload;
						toast.info(
							`${updated} milestones updated by another user`,
						);
					}

					onBulkUpdate?.(update.payload);
					break;

				case "user_presence": {
					const presence = update.payload as UserPresence;

					// Don't show our own presence updates
					if (presence.userId !== userId) {
						onPresenceUpdate?.(presence);

						// Show editing indicator
						if (
							presence.action === "editing_start" &&
							presence.componentId
						) {
							toast.info(
								`Another user is editing component ${presence.componentId}`,
								{
									id: `editing_${presence.userId}_${presence.componentId}`,
									duration: 30000, // Show for 30 seconds
								},
							);
						} else if (presence.action === "editing_end") {
							// Note: dismiss with ID not available in current sonner version
							// toast.dismiss(`editing_${presence.userId}_${presence.componentId}`);
						}
					}
					break;
				}

				case "conflict_resolved": {
					const { milestoneId, componentId, resolution } =
						update.payload;

					// Refresh the affected milestone
					queryClient.invalidateQueries({
						queryKey: ["milestone", milestoneId],
					});
					queryClient.invalidateQueries({
						queryKey: ["component-milestones", componentId],
					});

					if (update.userId !== userId) {
						toast.info(
							`Conflict resolved for milestone using ${resolution} strategy`,
						);
					}

					onConflictResolved?.(update.payload);
					break;
				}

				case "bulk_operation_undone":
					// Refresh all milestone data
					queryClient.invalidateQueries({
						queryKey: ["project-milestones", projectId],
					});
					queryClient.invalidateQueries({
						queryKey: ["component-milestones"],
					});

					if (update.userId !== userId) {
						const { undone } = update.payload;
						toast.info(
							`Bulk operation with ${undone} changes was undone by another user`,
						);
					}
					break;
			}
		},
		[
			queryClient,
			projectId,
			userId,
			onMilestoneUpdate,
			onBulkUpdate,
			onPresenceUpdate,
			onConflictResolved,
		],
	);

	// Broadcast presence update
	const broadcastPresence = useCallback(
		async (componentId: string, action: UserPresence["action"]) => {
			if (!channelRef.current) return;

			const presence: UserPresence = {
				userId,
				componentId,
				action,
				timestamp: new Date().toISOString(),
			};

			presenceRef.current = presence;

			try {
				await channelRef.current.send({
					type: "broadcast",
					event: "user_presence",
					payload: presence,
				});
			} catch (error) {
				console.error("Failed to broadcast presence:", error);
			}
		},
		[userId],
	);

	// Set up realtime subscription
	useEffect(() => {
		if (!projectId || !userId) return;

		console.log("Setting up realtime subscription for project:", projectId);
		setConnectionStatus("connecting");

		// Create channel for this project
		const channel = supabase.current
			.channel(`project:${projectId}`)
			.on("broadcast", { event: "milestone_update" }, ({ payload }) => {
				handleRealtimeUpdate({
					type: "milestone_update",
					payload,
					timestamp: new Date().toISOString(),
					userId: payload.userId || "unknown",
				});
			})
			.on(
				"broadcast",
				{ event: "bulk_milestone_update" },
				({ payload }) => {
					handleRealtimeUpdate({
						type: "bulk_milestone_update",
						payload,
						timestamp: new Date().toISOString(),
						userId: payload.userId || "unknown",
					});
				},
			)
			.on("broadcast", { event: "user_presence" }, ({ payload }) => {
				handleRealtimeUpdate({
					type: "user_presence",
					payload,
					timestamp: new Date().toISOString(),
					userId: payload.userId || "unknown",
				});
			})
			.on("broadcast", { event: "conflict_resolved" }, ({ payload }) => {
				handleRealtimeUpdate({
					type: "conflict_resolved",
					payload,
					timestamp: new Date().toISOString(),
					userId: payload.userId || "unknown",
				});
			})
			.on(
				"broadcast",
				{ event: "bulk_operation_undone" },
				({ payload }) => {
					handleRealtimeUpdate({
						type: "bulk_operation_undone",
						payload,
						timestamp: new Date().toISOString(),
						userId: payload.userId || "unknown",
					});
				},
			)
			.subscribe((status) => {
				console.log("Realtime subscription status:", status);
				setConnectionStatus(
					status === "SUBSCRIBED"
						? "connected"
						: status === "CLOSED"
							? "disconnected"
							: "connecting",
				);
			});

		channelRef.current = channel;

		// Cleanup function
		return () => {
			if (channelRef.current) {
				supabase.current.removeChannel(channelRef.current);
				channelRef.current = null;
			}
			setConnectionStatus("disconnected");
		};
	}, [projectId, userId, handleRealtimeUpdate]);

	// Listen for database changes (alternative to broadcast for certain events)
	useEffect(() => {
		if (!projectId) return;

		// Subscribe to direct database changes for milestone updates
		const subscription = supabase.current
			.channel("db-changes")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "ComponentMilestone",
					filter: `component.projectId=eq.${projectId}`,
				},
				(payload) => {
					console.log("Database change detected:", payload);

					// Invalidate relevant queries when database changes occur
					if (payload.new) {
						const milestone = payload.new as ComponentMilestone;
						queryClient.invalidateQueries({
							queryKey: ["milestone", milestone.id],
						});
						queryClient.invalidateQueries({
							queryKey: [
								"component-milestones",
								milestone.componentId,
							],
						});
					}
				},
			)
			.subscribe();

		return () => {
			subscription.unsubscribe();
		};
	}, [projectId, queryClient]);

	// Auto-cleanup presence on unmount
	useEffect(() => {
		return () => {
			if (
				presenceRef.current &&
				presenceRef.current.action === "editing_start"
			) {
				// Broadcast editing end when component unmounts
				broadcastPresence(
					presenceRef.current.componentId!,
					"editing_end",
				);
			}
		};
	}, [broadcastPresence]);

	return (
		<RealtimeContext.Provider
			value={{
				connectionStatus,
				broadcastPresence,
				isConnected: connectionStatus === "connected",
			}}
		>
			{children}
		</RealtimeContext.Provider>
	);
}

// Context for accessing realtime functionality
import { createContext, useContext } from "react";

interface RealtimeContextValue {
	connectionStatus: "connecting" | "connected" | "disconnected";
	broadcastPresence: (
		componentId: string,
		action: "editing_start" | "editing_end" | "viewing",
	) => Promise<void>;
	isConnected: boolean;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function useRealtime() {
	const context = useContext(RealtimeContext);
	if (!context) {
		throw new Error("useRealtime must be used within a RealtimeManager");
	}
	return context;
}

// Hook for component-specific presence tracking
export function usePresenceTracking(componentId: string) {
	const { broadcastPresence } = useRealtime();

	const startEditing = useCallback(() => {
		broadcastPresence(componentId, "editing_start");
	}, [broadcastPresence, componentId]);

	const stopEditing = useCallback(() => {
		broadcastPresence(componentId, "editing_end");
	}, [broadcastPresence, componentId]);

	const markViewing = useCallback(() => {
		broadcastPresence(componentId, "viewing");
	}, [broadcastPresence, componentId]);

	return {
		startEditing,
		stopEditing,
		markViewing,
	};
}
