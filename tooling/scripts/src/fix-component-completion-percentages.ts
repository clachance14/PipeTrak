#!/usr/bin/env tsx

/**
 * Fix Component Completion Percentages - PIP-22
 *
 * This script fixes the off-by-one error in component completion calculations
 * by recalculating all affected components.
 *
 * The bug: milestoneData[milestone.milestoneOrder] should be milestoneData[milestone.milestoneOrder - 1]
 * This caused wrong weight assignments and impossible completion percentages.
 */

import { db as prisma } from "@repo/database";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../../.env.local") });


interface RecalculationResult {
	componentId: string;
	oldCompletion: number;
	newCompletion: number;
	changed: boolean;
	error?: string;
}

async function main() {
	const isDryRun = process.argv.includes("--dry-run");
	const verbose = process.argv.includes("--verbose");

	console.log("🔧 Starting component completion percentage fix (PIP-22)");
	console.log(`📊 Mode: ${isDryRun ? "DRY RUN" : "LIVE UPDATE"}`);
	console.log(
		"─────────────────────────────────────────────────────────────",
	);

	try {
		// Find all components that need recalculation
		console.log("📋 Finding components that need recalculation...");

		const components = await prisma.component.findMany({
			where: {
				workflowType: {
					in: [
						"MILESTONE_DISCRETE",
						"MILESTONE_PERCENTAGE",
						"MILESTONE_QUANTITY",
					],
				},
			},
			include: {
				milestones: true,
				milestoneTemplate: true,
				drawing: {
					select: { number: true },
				},
			},
		});

		console.log(`✅ Found ${components.length} components to check`);

		const results: RecalculationResult[] = [];
		const problematicComponents: any[] = [];

		// Process each component
		for (const component of components) {
			try {
				const oldCompletion = component.completionPercent || 0;

				// Calculate what the completion should be with the fix
				const correctedCompletion =
					calculateCorrectedCompletion(component);

				const changed =
					Math.abs(correctedCompletion - oldCompletion) > 0.01;

				if (changed) {
					problematicComponents.push({
						id: component.id,
						componentId: component.componentId,
						drawingNumber: component.drawing?.number || "Unknown",
						oldCompletion,
						correctedCompletion,
						difference: correctedCompletion - oldCompletion,
					});
				}

				results.push({
					componentId: component.componentId,
					oldCompletion,
					newCompletion: correctedCompletion,
					changed,
				});

				if (verbose && changed) {
					console.log(
						`  📌 ${component.componentId}: ${oldCompletion}% → ${correctedCompletion}% (Δ${(correctedCompletion - oldCompletion).toFixed(1)}%)`,
					);
				}
			} catch (error) {
				console.error(
					`❌ Error processing ${component.componentId}:`,
					error,
				);
				results.push({
					componentId: component.componentId,
					oldCompletion: component.completionPercent || 0,
					newCompletion: 0,
					changed: false,
					error:
						error instanceof Error
							? error.message
							: "Unknown error",
				});
			}
		}

		// Summary of changes
		const changedComponents = results.filter((r) => r.changed);
		console.log("\n📊 Summary:");
		console.log(`   Total components checked: ${results.length}`);
		console.log(`   Components with changes: ${changedComponents.length}`);
		console.log(
			`   Components with errors: ${results.filter((r) => r.error).length}`,
		);

		if (problematicComponents.length > 0) {
			console.log("\n🚨 Components with completion percentage issues:");
			console.log(
				"─────────────────────────────────────────────────────────────",
			);

			for (const comp of problematicComponents.slice(0, 10)) {
				console.log(
					`   ${comp.componentId} (${comp.drawingNumber}): ${comp.oldCompletion}% → ${comp.correctedCompletion}% (${comp.difference > 0 ? "+" : ""}${comp.difference.toFixed(1)}%)`,
				);
			}

			if (problematicComponents.length > 10) {
				console.log(
					`   ... and ${problematicComponents.length - 10} more`,
				);
			}
		}

		// Find the impossible cases (completion > 100% or drawing > max component)
		const impossibleCases = problematicComponents.filter(
			(c) => c.oldCompletion > 100 || c.oldCompletion > 60,
		);
		if (impossibleCases.length > 0) {
			console.log(
				`\n⚠️  Found ${impossibleCases.length} components with mathematically impossible percentages:`,
			);
			impossibleCases.forEach((comp) => {
				console.log(
					`     ${comp.componentId}: ${comp.oldCompletion}% (should be ${comp.correctedCompletion}%)`,
				);
			});
		}

		if (!isDryRun && changedComponents.length > 0) {
			console.log("\n🔄 Applying fixes...");

			let successful = 0;
			let failed = 0;

			// Process in batches to avoid overwhelming the API
			const batchSize = 50;
			for (let i = 0; i < changedComponents.length; i += batchSize) {
				const batch = changedComponents.slice(i, i + batchSize);

				console.log(
					`   Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(changedComponents.length / batchSize)} (${batch.length} components)...`,
				);

				await Promise.all(
					batch.map(async (result) => {
						try {
							// Find the actual component ID (not componentId string)
							const comp = components.find(
								(c) => c.componentId === result.componentId,
							);
							if (!comp) {
								throw new Error("Component not found");
							}

							// Trigger recalculation directly using the fixed logic
							await recalculateComponentCompletionFixed(comp.id);

							successful++;
						} catch (error) {
							console.error(
								`   ❌ Failed to fix ${result.componentId}:`,
								error,
							);
							failed++;
						}
					}),
				);
			}

			console.log("\n✅ Recalculation complete:");
			console.log(`   Successfully updated: ${successful}`);
			console.log(`   Failed: ${failed}`);
		} else if (isDryRun && changedComponents.length > 0) {
			console.log(
				`\n🔍 DRY RUN: Would update ${changedComponents.length} components`,
			);
			console.log("   Run without --dry-run to apply fixes");
		} else {
			console.log("\n✅ No components need fixing!");
		}

		// Verify the specific drawing mentioned in PIP-22
		const drawing94011 = problematicComponents.find(
			(c) =>
				c.drawingNumber && c.drawingNumber.includes("P-94011_2 02of03"),
		);

		if (drawing94011) {
			console.log("\n🎯 PIP-22 Specific Case Found:");
			console.log(
				`   Drawing P-94011_2 02of03 component was showing ${drawing94011.oldCompletion}%`,
			);
			console.log(
				`   After fix, it should show ${drawing94011.correctedCompletion}%`,
			);
		}
	} catch (error) {
		console.error("❌ Script failed:", error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

/**
 * Calculate what the completion percentage should be with the corrected logic
 */
function calculateCorrectedCompletion(component: any): number {
	let completionPercent = 0;
	const milestoneData = component.milestoneTemplate.milestones as any[];

	if (component.workflowType === "MILESTONE_DISCRETE") {
		let totalWeight = 0;
		let completedWeight = 0;

		component.milestones.forEach((milestone: any) => {
			// FIXED: Use milestoneOrder - 1 for array indexing
			const weight =
				milestoneData[milestone.milestoneOrder - 1]?.weight || 1;
			totalWeight += weight;
			if (milestone.isCompleted) {
				completedWeight += weight;
			}
		});

		completionPercent =
			totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;
	} else if (component.workflowType === "MILESTONE_PERCENTAGE") {
		let totalWeight = 0;
		let weightedSum = 0;

		component.milestones.forEach((milestone: any) => {
			// FIXED: Use milestoneOrder - 1 for array indexing
			const weight =
				milestoneData[milestone.milestoneOrder - 1]?.weight || 1;
			totalWeight += weight;
			weightedSum += (milestone.percentageComplete || 0) * weight;
		});

		completionPercent = totalWeight > 0 ? weightedSum / totalWeight : 0;
	} else if (component.workflowType === "MILESTONE_QUANTITY") {
		let totalWeight = 0;
		let weightedSum = 0;

		component.milestones.forEach((milestone: any) => {
			// FIXED: Use milestoneOrder - 1 for array indexing
			const weight =
				milestoneData[milestone.milestoneOrder - 1]?.weight || 1;
			totalWeight += weight;
			if (milestone.quantityTotal && milestone.quantityTotal > 0) {
				const percentage =
					((milestone.quantityComplete || 0) /
						milestone.quantityTotal) *
					100;
				weightedSum += percentage * weight;
			}
		});

		completionPercent = totalWeight > 0 ? weightedSum / totalWeight : 0;
	}

	// Ensure completion is between 0 and 100
	return Math.min(Math.max(completionPercent, 0), 100);
}

/**
 * Recalculate component completion using the fixed logic and update the database
 */
async function recalculateComponentCompletionFixed(componentId: string) {
	const component = await prisma.component.findUnique({
		where: { id: componentId },
		include: {
			milestones: true,
			milestoneTemplate: true,
		},
	});

	if (!component) {
		throw new Error("Component not found");
	}

	const correctedCompletion = calculateCorrectedCompletion(component);

	// Update component status based on completion
	const status =
		correctedCompletion === 0
			? "NOT_STARTED"
			: correctedCompletion < 100
				? "IN_PROGRESS"
				: "COMPLETED";

	await prisma.component.update({
		where: { id: componentId },
		data: {
			completionPercent: correctedCompletion,
			status,
		},
	});
}

// Handle unhandled errors
process.on("unhandledRejection", (error) => {
	console.error("Unhandled promise rejection:", error);
	process.exit(1);
});

// Run the script
main().catch(console.error);
