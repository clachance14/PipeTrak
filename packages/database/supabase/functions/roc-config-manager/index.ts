// ROC Configuration Manager Edge Function
// Handles organization-specific ROC weight configurations and validations

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

interface Database {
	public: {
		Tables: {
			ROCConfigurations: {
				Row: {
					id: string;
					organizationId: string;
					projectId: string | null;
					componentType: string | null;
					milestoneWeights: any;
					description: string | null;
					isDefault: boolean;
					effectiveDate: string;
					createdAt: string;
					updatedAt: string;
					createdBy: string;
				};
				Insert: {
					id?: string;
					organizationId: string;
					projectId?: string | null;
					componentType?: string | null;
					milestoneWeights: any;
					description?: string | null;
					isDefault?: boolean;
					effectiveDate?: string;
					createdBy: string;
				};
				Update: {
					milestoneWeights?: any;
					description?: string | null;
					isDefault?: boolean;
					effectiveDate?: string;
					updatedAt?: string;
				};
			};
			Project: {
				Row: {
					id: string;
					organizationId: string;
					jobNumber: string;
					jobName: string;
				};
			};
			organization: {
				Row: {
					id: string;
					name: string;
				};
			};
			member: {
				Row: {
					userId: string;
					organizationId: string;
					role: string;
				};
			};
		};
	};
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Validation schemas for ROC configurations
const ROCConfigurationSchema = {
	type: "object",
	required: ["organizationId", "milestoneWeights", "createdBy"],
	properties: {
		organizationId: { type: "string", minLength: 1 },
		projectId: { type: ["string", "null"] },
		componentType: { type: ["string", "null"] },
		milestoneWeights: {
			type: "object",
			additionalProperties: {
				type: "number",
				minimum: 0,
				maximum: 100,
			},
		},
		description: { type: ["string", "null"] },
		isDefault: { type: "boolean" },
		effectiveDate: { type: "string", format: "date-time" },
		createdBy: { type: "string", minLength: 1 },
	},
};

const UpdateROCConfigurationSchema = {
	type: "object",
	properties: {
		milestoneWeights: {
			type: "object",
			additionalProperties: {
				type: "number",
				minimum: 0,
				maximum: 100,
			},
		},
		description: { type: ["string", "null"] },
		isDefault: { type: "boolean" },
		effectiveDate: { type: "string", format: "date-time" },
	},
};

serve(async (req: Request) => {
	if (req.method === "OPTIONS") {
		return new Response(null, { headers: corsHeaders });
	}

	try {
		const supabase = createClient<Database>(
			supabaseUrl,
			supabaseServiceKey,
		);
		const url = new URL(req.url);
		const path = url.pathname.split("/").pop();

		// Route handling
		switch (req.method) {
			case "GET":
				return await handleGetConfigurations(supabase, url);

			case "POST":
				return await handleCreateConfiguration(supabase, req);

			case "PUT":
				if (path && path !== "roc-config-manager") {
					return await handleUpdateConfiguration(supabase, req, path);
				}
				break;

			case "DELETE":
				if (path && path !== "roc-config-manager") {
					return await handleDeleteConfiguration(supabase, req, path);
				}
				break;
		}

		return new Response(JSON.stringify({ error: "Method not allowed" }), {
			status: 405,
			headers: { ...corsHeaders, "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("ROC Config Manager error:", error);
		return new Response(
			JSON.stringify({
				error: "Internal server error",
				details: error.message,
			}),
			{
				status: 500,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			},
		);
	}
});

async function handleGetConfigurations(supabase: any, url: URL) {
	const organizationId = url.searchParams.get("organizationId");
	const projectId = url.searchParams.get("projectId");
	const includeDefaults = url.searchParams.get("includeDefaults") === "true";

	if (!organizationId) {
		return new Response(
			JSON.stringify({ error: "organizationId parameter is required" }),
			{
				status: 400,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			},
		);
	}

	try {
		let query = supabase
			.from("ROCConfigurations")
			.select("*")
			.eq("organizationId", organizationId)
			.order("effectiveDate", { ascending: false });

		// Filter by project if specified
		if (projectId) {
			query = query.or(`projectId.eq.${projectId},projectId.is.null`);
		}

		// Include only defaults if requested
		if (includeDefaults) {
			query = query.eq("isDefault", true);
		}

		const { data: configs, error } = await query;

		if (error) {
			throw error;
		}

		// Validate milestone weights and add computed properties
		const enrichedConfigs = configs.map((config) => ({
			...config,
			milestoneWeights: validateAndNormalizeMilestoneWeights(
				config.milestoneWeights,
			),
			totalWeight: Object.values(config.milestoneWeights || {}).reduce(
				(sum: number, weight: any) => sum + (Number(weight) || 0),
				0,
			),
			isValid: validateMilestoneWeights(config.milestoneWeights),
		}));

		// Get effective configuration for project if specified
		let effectiveConfig = null;
		if (projectId) {
			effectiveConfig = getEffectiveConfiguration(
				enrichedConfigs,
				projectId,
			);
		}

		return new Response(
			JSON.stringify({
				success: true,
				data: {
					configurations: enrichedConfigs,
					effectiveConfiguration: effectiveConfig,
					organizationId,
					projectId,
				},
			}),
			{ headers: { ...corsHeaders, "Content-Type": "application/json" } },
		);
	} catch (error) {
		console.error("Get configurations error:", error);
		return new Response(
			JSON.stringify({
				error: "Failed to fetch configurations",
				details: error.message,
			}),
			{
				status: 500,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			},
		);
	}
}

async function handleCreateConfiguration(supabase: any, req: Request) {
	try {
		const body = await req.json();

		// Validate request body
		if (!validateSchema(body, ROCConfigurationSchema)) {
			return new Response(
				JSON.stringify({ error: "Invalid configuration data" }),
				{
					status: 400,
					headers: {
						...corsHeaders,
						"Content-Type": "application/json",
					},
				},
			);
		}

		// Validate milestone weights
		if (!validateMilestoneWeights(body.milestoneWeights)) {
			return new Response(
				JSON.stringify({
					error: "Invalid milestone weights",
					details:
						"Weights must sum to 100 or less and contain valid milestone names",
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

		// Check organization access
		const { data: member, error: memberError } = await supabase
			.from("member")
			.select("role")
			.eq("organizationId", body.organizationId)
			.eq("userId", body.createdBy)
			.single();

		if (
			memberError ||
			!member ||
			!["owner", "admin"].includes(member.role)
		) {
			return new Response(
				JSON.stringify({ error: "Insufficient permissions" }),
				{
					status: 403,
					headers: {
						...corsHeaders,
						"Content-Type": "application/json",
					},
				},
			);
		}

		// Handle default configuration logic
		if (body.isDefault) {
			// Unset other defaults for the same organization/project/componentType
			await supabase
				.from("ROCConfigurations")
				.update({ isDefault: false })
				.eq("organizationId", body.organizationId)
				.eq("projectId", body.projectId || null)
				.eq("componentType", body.componentType || null);
		}

		// Normalize milestone weights
		const normalizedWeights = validateAndNormalizeMilestoneWeights(
			body.milestoneWeights,
		);

		// Create new configuration
		const { data: newConfig, error } = await supabase
			.from("ROCConfigurations")
			.insert({
				...body,
				milestoneWeights: normalizedWeights,
				effectiveDate: body.effectiveDate || new Date().toISOString(),
			})
			.select()
			.single();

		if (error) {
			throw error;
		}

		// Log configuration creation
		console.log(
			`ROC configuration created: ${newConfig.id} for org ${body.organizationId}`,
		);

		// Send real-time update to organization members
		await supabase.channel(`org:${body.organizationId}:config`).send({
			type: "broadcast",
			event: "roc_config_created",
			payload: {
				configId: newConfig.id,
				organizationId: body.organizationId,
				projectId: body.projectId,
				isDefault: body.isDefault,
			},
		});

		return new Response(
			JSON.stringify({
				success: true,
				data: {
					...newConfig,
					totalWeight: Object.values(normalizedWeights).reduce(
						(sum: number, weight: any) =>
							sum + (Number(weight) || 0),
						0,
					),
					isValid: true,
				},
			}),
			{ headers: { ...corsHeaders, "Content-Type": "application/json" } },
		);
	} catch (error) {
		console.error("Create configuration error:", error);
		return new Response(
			JSON.stringify({
				error: "Failed to create configuration",
				details: error.message,
			}),
			{
				status: 500,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			},
		);
	}
}

async function handleUpdateConfiguration(
	supabase: any,
	req: Request,
	configId: string,
) {
	try {
		const body = await req.json();

		// Validate request body
		if (!validateSchema(body, UpdateROCConfigurationSchema)) {
			return new Response(
				JSON.stringify({ error: "Invalid configuration data" }),
				{
					status: 400,
					headers: {
						...corsHeaders,
						"Content-Type": "application/json",
					},
				},
			);
		}

		// Get existing configuration
		const { data: existingConfig, error: fetchError } = await supabase
			.from("ROCConfigurations")
			.select("*")
			.eq("id", configId)
			.single();

		if (fetchError || !existingConfig) {
			return new Response(
				JSON.stringify({ error: "Configuration not found" }),
				{
					status: 404,
					headers: {
						...corsHeaders,
						"Content-Type": "application/json",
					},
				},
			);
		}

		// Validate milestone weights if provided
		if (
			body.milestoneWeights &&
			!validateMilestoneWeights(body.milestoneWeights)
		) {
			return new Response(
				JSON.stringify({
					error: "Invalid milestone weights",
					details:
						"Weights must sum to 100 or less and contain valid milestone names",
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

		// Handle default configuration logic
		if (body.isDefault && !existingConfig.isDefault) {
			await supabase
				.from("ROCConfigurations")
				.update({ isDefault: false })
				.eq("organizationId", existingConfig.organizationId)
				.eq("projectId", existingConfig.projectId || null)
				.eq("componentType", existingConfig.componentType || null)
				.neq("id", configId);
		}

		// Prepare update data
		const updateData: any = {
			...body,
			updatedAt: new Date().toISOString(),
		};

		if (body.milestoneWeights) {
			updateData.milestoneWeights = validateAndNormalizeMilestoneWeights(
				body.milestoneWeights,
			);
		}

		// Update configuration
		const { data: updatedConfig, error } = await supabase
			.from("ROCConfigurations")
			.update(updateData)
			.eq("id", configId)
			.select()
			.single();

		if (error) {
			throw error;
		}

		// Send real-time update
		await supabase
			.channel(`org:${existingConfig.organizationId}:config`)
			.send({
				type: "broadcast",
				event: "roc_config_updated",
				payload: {
					configId,
					organizationId: existingConfig.organizationId,
					projectId: existingConfig.projectId,
					changes: Object.keys(body),
				},
			});

		return new Response(
			JSON.stringify({
				success: true,
				data: {
					...updatedConfig,
					totalWeight: Object.values(
						updatedConfig.milestoneWeights || {},
					).reduce(
						(sum: number, weight: any) =>
							sum + (Number(weight) || 0),
						0,
					),
					isValid: validateMilestoneWeights(
						updatedConfig.milestoneWeights,
					),
				},
			}),
			{ headers: { ...corsHeaders, "Content-Type": "application/json" } },
		);
	} catch (error) {
		console.error("Update configuration error:", error);
		return new Response(
			JSON.stringify({
				error: "Failed to update configuration",
				details: error.message,
			}),
			{
				status: 500,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			},
		);
	}
}

async function handleDeleteConfiguration(
	supabase: any,
	req: Request,
	configId: string,
) {
	try {
		// Get configuration details before deletion
		const { data: config, error: fetchError } = await supabase
			.from("ROCConfigurations")
			.select("*")
			.eq("id", configId)
			.single();

		if (fetchError || !config) {
			return new Response(
				JSON.stringify({ error: "Configuration not found" }),
				{
					status: 404,
					headers: {
						...corsHeaders,
						"Content-Type": "application/json",
					},
				},
			);
		}

		// Don't allow deletion of default configurations unless there's another default
		if (config.isDefault) {
			const { data: otherDefaults, error: defaultsError } = await supabase
				.from("ROCConfigurations")
				.select("id")
				.eq("organizationId", config.organizationId)
				.eq("projectId", config.projectId || null)
				.eq("componentType", config.componentType || null)
				.eq("isDefault", true)
				.neq("id", configId);

			if (defaultsError || otherDefaults.length === 0) {
				return new Response(
					JSON.stringify({
						error: "Cannot delete the only default configuration",
						details: "Create another default configuration first",
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
		}

		// Delete configuration
		const { error } = await supabase
			.from("ROCConfigurations")
			.delete()
			.eq("id", configId);

		if (error) {
			throw error;
		}

		// Send real-time update
		await supabase.channel(`org:${config.organizationId}:config`).send({
			type: "broadcast",
			event: "roc_config_deleted",
			payload: {
				configId,
				organizationId: config.organizationId,
				projectId: config.projectId,
				wasDefault: config.isDefault,
			},
		});

		return new Response(
			JSON.stringify({
				success: true,
				data: { deletedId: configId },
			}),
			{ headers: { ...corsHeaders, "Content-Type": "application/json" } },
		);
	} catch (error) {
		console.error("Delete configuration error:", error);
		return new Response(
			JSON.stringify({
				error: "Failed to delete configuration",
				details: error.message,
			}),
			{
				status: 500,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			},
		);
	}
}

function validateMilestoneWeights(weights: any): boolean {
	if (!weights || typeof weights !== "object") {
		return false;
	}

	const validMilestones = [
		"Receive",
		"Erect",
		"Connect",
		"Test",
		"Complete",
		"Pressure_Test",
	];
	const entries = Object.entries(weights);

	// Check if all keys are valid milestone names
	const hasValidKeys = entries.every(([key]) =>
		validMilestones.includes(key),
	);
	if (!hasValidKeys) {
		return false;
	}

	// Check if all values are valid numbers
	const hasValidValues = entries.every(([, value]) => {
		const num = Number(value);
		return !isNaN(num) && num >= 0 && num <= 100;
	});
	if (!hasValidValues) {
		return false;
	}

	// Check if weights sum to 100 or less
	const totalWeight = entries.reduce(
		(sum, [, value]) => sum + Number(value),
		0,
	);
	return totalWeight <= 100;
}

function validateAndNormalizeMilestoneWeights(
	weights: any,
): Record<string, number> {
	if (!weights || typeof weights !== "object") {
		// Return default weights
		return {
			Receive: 10,
			Erect: 30,
			Connect: 40,
			Test: 15,
			Complete: 5,
		};
	}

	const normalized: Record<string, number> = {};

	for (const [key, value] of Object.entries(weights)) {
		const numValue = Number(value);
		if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
			normalized[key] = Math.round(numValue * 100) / 100; // Round to 2 decimal places
		}
	}

	return normalized;
}

function getEffectiveConfiguration(configs: any[], projectId: string) {
	// Priority: Project-specific > Component-specific > Organization default

	// Look for project-specific configuration first
	const projectSpecific = configs.find((c) => c.projectId === projectId);
	if (projectSpecific) {
		return projectSpecific;
	}

	// Look for organization default
	const orgDefault = configs.find((c) => c.isDefault && c.projectId === null);
	if (orgDefault) {
		return orgDefault;
	}

	// Return most recent configuration as fallback
	return configs[0] || null;
}

function validateSchema(data: any, schema: any): boolean {
	// Simple schema validation - in production, use a proper JSON Schema validator
	if (!data || typeof data !== "object") {
		return false;
	}

	// Check required fields
	if (schema.required) {
		for (const field of schema.required) {
			if (!(field in data)) {
				return false;
			}
		}
	}

	return true;
}
