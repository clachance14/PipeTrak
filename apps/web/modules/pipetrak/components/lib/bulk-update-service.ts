import { apiClient } from "@shared/lib/api-client";
import type { ComponentWithMilestones } from "../../types";
import type {
	ComponentGroup,
	BulkUpdateSelections,
	BulkUpdateResult,
} from "./bulk-update-utils";

export interface BulkUpdateProgress {
	current: number;
	total: number;
	percentage: number;
	message: string;
}

export interface BulkUpdateRequest {
	mode: "quick" | "advanced";
	projectId: string;
	milestoneName?: string;
	componentIds?: string[];
	groups?: Array<{
		templateId: string;
		componentIds: string[];
		milestones: string[];
	}>;
}

/**
 * Service for handling bulk milestone updates with progress tracking
 */
export class BulkUpdateService {
	private onProgress?: (progress: BulkUpdateProgress) => void;

	constructor(onProgress?: (progress: BulkUpdateProgress) => void) {
		this.onProgress = onProgress;
	}

	/**
	 * Update progress and notify callback
	 */
	private updateProgress(current: number, total: number, message: string) {
		if (this.onProgress) {
			this.onProgress({
				current,
				total,
				percentage: total > 0 ? Math.round((current / total) * 100) : 0,
				message,
			});
		}
	}

	/**
	 * Perform bulk milestone update using the API with retry logic
	 */
	async performBulkUpdate(
		request: BulkUpdateRequest,
		maxRetries = 2,
	): Promise<BulkUpdateResult> {
		const startTime = Date.now();
		let lastError: Error | null = null;

		for (let attempt = 0; attempt <= maxRetries; attempt++) {
			try {
				this.updateProgress(
					0,
					100,
					attempt > 0
						? `Retrying update (attempt ${attempt + 1})...`
						: "Preparing bulk update...",
				);

				// Validate request
				if (!request.projectId) {
					throw new Error("Project ID is required");
				}

				if (
					request.mode === "quick" &&
					(!request.milestoneName || !request.componentIds)
				) {
					throw new Error(
						"Quick mode requires milestone name and component IDs",
					);
				}

				if (request.mode === "advanced" && !request.groups) {
					throw new Error("Advanced mode requires groups");
				}

				const totalComponents =
					request.mode === "quick"
						? request.componentIds?.length || 0
						: request.groups?.reduce(
								(sum, g) => sum + g.componentIds.length,
								0,
							) || 0;

				if (totalComponents === 0) {
					throw new Error("No components to update");
				}

				this.updateProgress(
					10,
					100,
					`Updating ${totalComponents} components...`,
				);

				// Call the API with timeout
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

				try {
					const response = await apiClient.pipetrak.milestones[
						"bulk-update-discrete"
					].$post(
						{
							json: request,
						},
						{
							signal: controller.signal,
						} as any,
					);

					clearTimeout(timeoutId);

					if (!response.ok) {
						let errorMessage = "API request failed";
						try {
							const errorData: any = await response.json();
							errorMessage =
								errorData.message ||
								errorData.error ||
								`HTTP ${response.status}: ${response.statusText}`;
						} catch {
							errorMessage = `HTTP ${response.status}: ${response.statusText}`;
						}
						throw new Error(errorMessage);
					}

					this.updateProgress(80, 100, "Processing results...");

					const result = (await response.json()) as BulkUpdateResult;

					// Validate result structure
					if (!result || typeof result !== "object") {
						throw new Error("Invalid response format from server");
					}

					// Ensure arrays exist
					if (!Array.isArray(result.successful)) {
						result.successful = [];
					}
					if (!Array.isArray(result.failed)) {
						result.failed = [];
					}

					// Set total if not provided
					if (typeof result.total !== "number") {
						result.total =
							result.successful.length + result.failed.length;
					}

					this.updateProgress(100, 100, "Update complete!");

					// Add timing info
					const duration = Date.now() - startTime;
					console.log(
						`Bulk update completed in ${duration}ms: ${result.successful.length} successful, ${result.failed.length} failed`,
					);

					// Log any failures for debugging
					if (result.failed.length > 0) {
						console.warn(
							"Bulk update failures:",
							result.failed.slice(0, 5),
						); // Log first 5 failures
					}

					return result;
				} catch (apiError) {
					clearTimeout(timeoutId);
					throw apiError;
				}
			} catch (error) {
				lastError =
					error instanceof Error ? error : new Error(String(error));

				// Don't retry for validation errors or client-side errors
				if (
					attempt === 0 &&
					(lastError.message.includes("required") ||
						lastError.message.includes("Invalid") ||
						lastError.message.includes("No components"))
				) {
					break;
				}

				// Don't retry for 4xx errors (client errors)
				if (lastError.message.includes("HTTP 4")) {
					break;
				}

				if (attempt < maxRetries) {
					const delay = Math.min(1000 * (attempt + 1), 3000); // Exponential backoff, max 3s
					this.updateProgress(
						0,
						100,
						`Update failed, retrying in ${delay / 1000}s...`,
					);
					await new Promise((resolve) => setTimeout(resolve, delay));
				}
			}
		}

		this.updateProgress(0, 100, "Update failed");
		throw lastError || new Error("Bulk update failed after retries");
	}

	/**
	 * Quick update - apply same milestone to all components
	 */
	async quickUpdate(
		projectId: string,
		milestoneName: string,
		components: ComponentWithMilestones[],
	): Promise<BulkUpdateResult> {
		return this.performBulkUpdate({
			mode: "quick",
			projectId,
			milestoneName,
			componentIds: components.map((c) => c.id),
		});
	}

	/**
	 * Advanced update - different milestones per component group
	 */
	async advancedUpdate(
		projectId: string,
		groups: ComponentGroup[],
		selections: BulkUpdateSelections,
	): Promise<BulkUpdateResult> {
		const updateGroups = groups
			.filter((group) => selections[group.templateId]?.size > 0)
			.map((group) => ({
				templateId: group.templateId,
				componentIds: group.components.map((c) => c.id),
				milestones: Array.from(selections[group.templateId] || []),
			}));

		if (updateGroups.length === 0) {
			throw new Error("No milestones selected for update");
		}

		return this.performBulkUpdate({
			mode: "advanced",
			projectId,
			groups: updateGroups,
		});
	}

	/**
	 * Process updates in smaller batches to avoid timeouts
	 */
	async batchedUpdate(
		request: BulkUpdateRequest,
		batchSize = 50,
	): Promise<BulkUpdateResult> {
		if (request.mode === "quick") {
			const componentIds = request.componentIds || [];
			if (componentIds.length <= batchSize) {
				return this.performBulkUpdate(request);
			}

			// Split into batches
			const batches = [];
			for (let i = 0; i < componentIds.length; i += batchSize) {
				batches.push(componentIds.slice(i, i + batchSize));
			}

			const allResults: BulkUpdateResult = {
				successful: [],
				failed: [],
				total: componentIds.length,
			};

			this.updateProgress(
				0,
				batches.length,
				`Processing ${batches.length} batches...`,
			);

			for (let i = 0; i < batches.length; i++) {
				const batch = batches[i];

				this.updateProgress(
					i,
					batches.length,
					`Processing batch ${i + 1} of ${batches.length}...`,
				);

				try {
					const batchResult = await this.performBulkUpdate({
						...request,
						componentIds: batch,
					});

					allResults.successful.push(...batchResult.successful);
					allResults.failed.push(...batchResult.failed);
				} catch (error) {
					// If batch fails, mark all items as failed
					batch.forEach((componentId) => {
						allResults.failed.push({
							componentId,
							milestoneName: request.milestoneName,
							error:
								error instanceof Error
									? error.message
									: "Batch processing failed",
						});
					});
				}
			}

			this.updateProgress(
				batches.length,
				batches.length,
				"All batches processed!",
			);
			return allResults;
		}
		// For advanced mode, we could implement batching by splitting groups
		// For now, just use the regular update
		return this.performBulkUpdate(request);
	}

	/**
	 * Validate update before executing
	 */
	async validateUpdate(request: BulkUpdateRequest): Promise<{
		valid: boolean;
		warnings: string[];
		errors: string[];
		estimatedUpdateCount: number;
	}> {
		const validation = {
			valid: true,
			warnings: [] as string[],
			errors: [] as string[],
			estimatedUpdateCount: 0,
		};

		try {
			if (request.mode === "quick") {
				if (!request.milestoneName) {
					validation.errors.push(
						"Milestone name is required for quick mode",
					);
					validation.valid = false;
				}

				if (
					!request.componentIds ||
					request.componentIds.length === 0
				) {
					validation.errors.push(
						"Component IDs are required for quick mode",
					);
					validation.valid = false;
				} else {
					validation.estimatedUpdateCount =
						request.componentIds.length;

					if (request.componentIds.length > 500) {
						validation.warnings.push(
							"Large update detected - this may take several minutes",
						);
					}
				}
			} else if (request.mode === "advanced") {
				if (!request.groups || request.groups.length === 0) {
					validation.errors.push(
						"Groups are required for advanced mode",
					);
					validation.valid = false;
				} else {
					validation.estimatedUpdateCount = request.groups.reduce(
						(sum, group) =>
							sum +
							group.componentIds.length * group.milestones.length,
						0,
					);

					const totalComponents = request.groups.reduce(
						(sum, group) => sum + group.componentIds.length,
						0,
					);

					if (totalComponents > 500) {
						validation.warnings.push(
							"Large update detected - this may take several minutes",
						);
					}

					// Check for groups with no milestone selections
					const emptyGroups = request.groups.filter(
						(g) => g.milestones.length === 0,
					);
					if (emptyGroups.length > 0) {
						validation.warnings.push(
							`${emptyGroups.length} component groups have no milestones selected`,
						);
					}
				}
			} else {
				validation.errors.push("Invalid update mode");
				validation.valid = false;
			}
		} catch (error) {
			validation.errors.push(
				error instanceof Error ? error.message : "Validation failed",
			);
			validation.valid = false;
		}

		return validation;
	}
}

/**
 * Create a bulk update service instance
 */
export function createBulkUpdateService(
	onProgress?: (progress: BulkUpdateProgress) => void,
): BulkUpdateService {
	return new BulkUpdateService(onProgress);
}

/**
 * Simple helper for quick updates
 */
export async function quickBulkUpdate(
	projectId: string,
	milestoneName: string,
	components: ComponentWithMilestones[],
	onProgress?: (progress: BulkUpdateProgress) => void,
): Promise<BulkUpdateResult> {
	const service = new BulkUpdateService(onProgress);
	return service.quickUpdate(projectId, milestoneName, components);
}

/**
 * Simple helper for advanced updates
 */
export async function advancedBulkUpdate(
	projectId: string,
	groups: ComponentGroup[],
	selections: BulkUpdateSelections,
	onProgress?: (progress: BulkUpdateProgress) => void,
): Promise<BulkUpdateResult> {
	const service = new BulkUpdateService(onProgress);
	return service.advancedUpdate(projectId, groups, selections);
}
