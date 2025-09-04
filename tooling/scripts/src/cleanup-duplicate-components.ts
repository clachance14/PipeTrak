#!/usr/bin/env tsx

/**
 * Cleanup Duplicate Components - PIP-22 Follow-up
 *
 * This script removes duplicate component records that are causing
 * incorrect drawing completion percentages.
 */

import { db as prisma } from "@repo/database";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../../.env.local") });


async function main() {
	const isDryRun = process.argv.includes("--dry-run");

	console.log("🧹 Starting duplicate component cleanup");
	console.log(`📊 Mode: ${isDryRun ? "DRY RUN" : "LIVE CLEANUP"}`);
	console.log(
		"─────────────────────────────────────────────────────────────",
	);

	try {
		// Find drawing P-94011_2 02of03
		const drawing = await prisma.drawing.findFirst({
			where: { number: "P-94011_2 02of03" },
		});

		if (!drawing) {
			console.log("❌ Drawing P-94011_2 02of03 not found");
			return;
		}

		console.log(`📍 Found drawing: ${drawing.number} (ID: ${drawing.id})`);

		// Find duplicate components
		const duplicates = (await prisma.$queryRaw`
      SELECT 
        "componentId", 
        "instanceNumber", 
        COUNT(*) as count,
        STRING_AGG(id::text, ', ') as component_ids,
        STRING_AGG("milestoneTemplateId", ', ') as template_ids,
        STRING_AGG("completionPercent"::text, ', ') as completion_percents
      FROM "Component" 
      WHERE "drawingId" = ${drawing.id}
      GROUP BY "componentId", "instanceNumber" 
      HAVING COUNT(*) > 1
      ORDER BY "componentId", "instanceNumber"
    `) as any[];

		console.log(
			`🔍 Found ${duplicates.length} sets of duplicate components:`,
		);

		for (const dup of duplicates) {
			console.log(
				`   ${dup.componentId} instance ${dup.instanceNumber}: ${dup.count} records`,
			);
			console.log(`     IDs: ${dup.component_ids}`);
			console.log(`     Templates: ${dup.template_ids}`);
			console.log(`     Completion: ${dup.completion_percents}%`);
		}

		if (duplicates.length === 0) {
			console.log("✅ No duplicate components found");
			return;
		}

		if (!isDryRun) {
			console.log("\n🔄 Removing duplicates...");

			let removedCount = 0;

			for (const dup of duplicates) {
				const componentIds = dup.component_ids.split(", ");
				const templateIds = dup.template_ids.split(", ");
				const completions = dup.completion_percents
					.split(", ")
					.map(Number);

				// Keep the component with higher completion percentage or newer template
				let keepIndex = 0;
				let maxCompletion = completions[0];

				for (let i = 1; i < completions.length; i++) {
					if (completions[i] > maxCompletion) {
						maxCompletion = completions[i];
						keepIndex = i;
					}
				}

				const keepId = componentIds[keepIndex];
				const removeIds = componentIds.filter(
					(_id: string, i: number) => i !== keepIndex,
				);

				console.log(
					`   Keeping ${dup.componentId} instance ${dup.instanceNumber}: ${keepId} (${completions[keepIndex]}%)`,
				);

				for (const removeId of removeIds) {
					try {
						// First remove associated milestones
						await prisma.componentMilestone.deleteMany({
							where: { componentId: removeId },
						});

						// Then remove the component
						await prisma.component.delete({
							where: { id: removeId },
						});

						removedCount++;
						console.log(`     ✅ Removed duplicate: ${removeId}`);
					} catch (error) {
						console.error(
							`     ❌ Failed to remove ${removeId}:`,
							error,
						);
					}
				}
			}

			console.log(
				`\n✅ Cleanup complete: Removed ${removedCount} duplicate components`,
			);

			// Verify the cleanup
			const remainingDuplicates = (await prisma.$queryRaw`
        SELECT "componentId", "instanceNumber", COUNT(*) as count
        FROM "Component" 
        WHERE "drawingId" = ${drawing.id}
        GROUP BY "componentId", "instanceNumber" 
        HAVING COUNT(*) > 1
      `) as any[];

			if (remainingDuplicates.length === 0) {
				console.log("🎉 All duplicates removed successfully!");
			} else {
				console.log(
					`⚠️  Still ${remainingDuplicates.length} duplicate sets remaining`,
				);
			}
		} else {
			console.log("\n🔍 DRY RUN: Would remove duplicate components");
			console.log("   Run without --dry-run to apply cleanup");
		}
	} catch (error) {
		console.error("❌ Script failed:", error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

// Handle unhandled errors
process.on("unhandledRejection", (error) => {
	console.error("Unhandled promise rejection:", error);
	process.exit(1);
});

// Run the script
main().catch(console.error);
