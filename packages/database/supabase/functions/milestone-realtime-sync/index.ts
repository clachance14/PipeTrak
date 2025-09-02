import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { corsHeaders } from "../_shared/cors.ts";
import { validateRequest } from "../_shared/validation.ts";
import { RealtimeSyncSchema } from "./schemas.ts";

interface ConflictResolution {
	strategy: "latest_wins" | "server_wins" | "manual";
	serverValue: any;
	clientValue: any;
	resolvedValue: any;
	timestamp: string;
}

serve(async (req) => {
	// Handle CORS preflight
	if (req.method === "OPTIONS") {
		return new Response("ok", { headers: corsHeaders });
	}

	try {
		console.log("Starting real-time milestone sync...");

		// Initialize Supabase client
		const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
		const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
		const supabase = createClient(supabaseUrl, supabaseServiceKey);

		// Validate and parse request
		const {
			data: requestData,
			error: validationError,
			userId,
		} = await validateRequest(req, supabase, RealtimeSyncSchema);

		if (validationError) {
			return new Response(
				JSON.stringify({
					error: "VALIDATION_ERROR",
					message: validationError,
				}),
				{
					status: 400,
					headers: {
						...corsHeaders,
						"Content-Type": "application/json",
					},
				},
			);
		}

		const {
			projectId,
			clientState,
			lastSyncTimestamp,
			conflictResolution = "latest_wins",
		} = requestData;

		// Verify user has access to the project
		const { data: project, error: projectError } = await supabase
			.from("Project")
			.select(`
        id,
        organizationId,
        organization:Organization!inner (
          members:Member!inner (
            userId
          )
        )
      `)
			.eq("id", projectId)
			.eq("organization.members.userId", userId)
			.single();

		if (projectError || !project) {
			return new Response(
				JSON.stringify({
					error: "ACCESS_DENIED",
					message: "Project not found or access denied",
				}),
				{
					status: 403,
					headers: {
						...corsHeaders,
						"Content-Type": "application/json",
					},
				},
			);
		}

		// Get server-side changes since last sync
		const syncTimestamp = lastSyncTimestamp
			? new Date(lastSyncTimestamp)
			: new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago default

		const { data: serverChanges, error: changesError } = await supabase
			.from("ComponentMilestone")
			.select(`
        id,
        componentId,
        milestoneName,
        isCompleted,
        percentageComplete,
        quantityComplete,
        completedAt,
        completedBy,
        updatedAt,
        component:Component!inner (
          projectId
        )
      `)
			.eq("component.projectId", projectId)
			.gte("updatedAt", syncTimestamp.toISOString())
			.order("updatedAt", { ascending: true });

		if (changesError) {
			console.error("Failed to fetch server changes:", changesError);
			return new Response(
				JSON.stringify({
					error: "SYNC_ERROR",
					message: "Failed to fetch server changes",
					details: changesError.message,
				}),
				{
					status: 500,
					headers: {
						...corsHeaders,
						"Content-Type": "application/json",
					},
				},
			);
		}

		// Detect conflicts between client and server state
		const conflicts: Array<{
			milestoneId: string;
			componentId: string;
			milestoneName: string;
			conflict: ConflictResolution;
		}> = [];

		const resolutions: Array<{
			milestoneId: string;
			updateData: any;
		}> = [];

		for (const clientMilestone of clientState) {
			const serverMilestone = serverChanges?.find(
				(s) =>
					s.componentId === clientMilestone.componentId &&
					s.milestoneName === clientMilestone.milestoneName,
			);

			if (!serverMilestone) {
				// No server change, client state is authoritative
				continue;
			}

			// Check for conflicts
			const hasConflict =
				serverMilestone.isCompleted !== clientMilestone.isCompleted ||
				serverMilestone.percentageComplete !==
					clientMilestone.percentageComplete ||
				serverMilestone.quantityComplete !==
					clientMilestone.quantityComplete;

			if (hasConflict) {
				let resolvedValue: any = serverMilestone;

				// Apply conflict resolution strategy
				switch (conflictResolution) {
					case "latest_wins": {
						const serverTime = new Date(
							serverMilestone.updatedAt || 0,
						).getTime();
						const clientTime = new Date(
							clientMilestone.timestamp || 0,
						).getTime();
						resolvedValue =
							clientTime > serverTime
								? clientMilestone
								: serverMilestone;
						break;
					}

					case "server_wins":
						resolvedValue = serverMilestone;
						break;

					case "manual":
						// Return conflict for manual resolution
						conflicts.push({
							milestoneId: serverMilestone.id,
							componentId: clientMilestone.componentId,
							milestoneName: clientMilestone.milestoneName,
							conflict: {
								strategy: "manual",
								serverValue: {
									isCompleted: serverMilestone.isCompleted,
									percentageComplete:
										serverMilestone.percentageComplete,
									quantityComplete:
										serverMilestone.quantityComplete,
									updatedAt: serverMilestone.updatedAt,
								},
								clientValue: {
									isCompleted: clientMilestone.isCompleted,
									percentageComplete:
										clientMilestone.percentageComplete,
									quantityComplete:
										clientMilestone.quantityComplete,
									timestamp: clientMilestone.timestamp,
								},
								resolvedValue: null,
								timestamp: new Date().toISOString(),
							},
						});
						continue;
				}

				// Prepare update if resolution was automatic
				if (conflictResolution !== "manual") {
					const updateData: any = {};

					if ("isCompleted" in resolvedValue) {
						updateData.isCompleted = resolvedValue.isCompleted;
						if (resolvedValue.isCompleted) {
							updateData.completedAt = new Date();
							updateData.completedBy = userId;
						} else {
							updateData.completedAt = null;
							updateData.completedBy = null;
						}
					}

					if ("percentageComplete" in resolvedValue) {
						updateData.percentageComplete =
							resolvedValue.percentageComplete;
						updateData.isCompleted =
							resolvedValue.percentageComplete >= 100;
						if (updateData.isCompleted) {
							updateData.completedAt = new Date();
							updateData.completedBy = userId;
						}
					}

					if ("quantityComplete" in resolvedValue) {
						updateData.quantityComplete =
							resolvedValue.quantityComplete;
						// Would need to fetch quantityTotal to determine completion
					}

					resolutions.push({
						milestoneId: serverMilestone.id,
						updateData,
					});
				}
			}
		}

		// Apply automatic conflict resolutions
		for (const resolution of resolutions) {
			const { error: updateError } = await supabase
				.from("ComponentMilestone")
				.update({
					...resolution.updateData,
					updatedAt: new Date().toISOString(),
				})
				.eq("id", resolution.milestoneId);

			if (updateError) {
				console.error(
					`Failed to resolve conflict for milestone ${resolution.milestoneId}:`,
					updateError,
				);
			}
		}

		// Get final state after conflict resolution
		const { data: finalState, error: finalStateError } = await supabase
			.from("ComponentMilestone")
			.select(`
        id,
        componentId,
        milestoneName,
        isCompleted,
        percentageComplete,
        quantityComplete,
        completedAt,
        completedBy,
        updatedAt
      `)
			.in(
				"componentId",
				clientState.map((c) => c.componentId),
			);

		if (finalStateError) {
			console.error("Failed to fetch final state:", finalStateError);
		}

		// Send real-time notification about sync completion
		await supabase.channel(`project:${projectId}`).send({
			type: "broadcast",
			event: "milestone_sync_completed",
			payload: {
				userId,
				conflictsResolved: resolutions.length,
				conflictsRequiringAttention: conflicts.length,
				timestamp: new Date().toISOString(),
			},
		});

		const response = {
			syncTimestamp: new Date().toISOString(),
			serverChanges: serverChanges || [],
			conflicts,
			automaticResolutions: resolutions.length,
			finalState: finalState || [],
			status:
				conflicts.length > 0 ? "conflicts_detected" : "synchronized",
		};

		console.log(
			`Real-time sync completed: ${resolutions.length} automatic resolutions, ${conflicts.length} manual conflicts`,
		);

		return new Response(JSON.stringify(response), {
			status: 200,
			headers: { ...corsHeaders, "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Real-time sync error:", error);

		return new Response(
			JSON.stringify({
				error: "SYNC_ERROR",
				message: "Real-time synchronization failed",
				details:
					error instanceof Error ? error.message : "Unknown error",
			}),
			{
				status: 500,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			},
		);
	}
});
