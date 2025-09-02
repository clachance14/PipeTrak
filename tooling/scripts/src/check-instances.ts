import { db as prisma } from "@repo/database";
import * as path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../../.env") });

async function checkInstances() {
	console.log("🔍 Checking component instances...\n");

	try {
		// Find components with multiple instances
		const multipleInstances = await prisma.component.groupBy({
			by: ["drawingId", "componentId"],
			_count: true,
			having: {
				componentId: {
					_count: {
						gt: 1,
					},
				},
			},
		});

		console.log(
			`Found ${multipleInstances.length} components with multiple instances on the same drawing\n`,
		);

		// Get examples of multi-instance components
		const examples = await prisma.component.findMany({
			where: {
				componentId: {
					in: [
						"GSWAZ1DZZASG5331",
						"MCPLALTLEAA1H1795",
						"VGATU-SECBFLR02F-017",
					],
				},
			},
			include: {
				drawing: true,
			},
			orderBy: [
				{ componentId: "asc" },
				{ drawingId: "asc" },
				{ instanceNumber: "asc" },
			],
			take: 20,
		});

		let currentComponentId = "";
		let currentDrawing = "";

		for (const comp of examples) {
			if (comp.componentId !== currentComponentId) {
				currentComponentId = comp.componentId;
				console.log(`\n📦 Component: ${comp.componentId}`);
				console.log("─".repeat(60));
			}

			if (comp.drawing.number !== currentDrawing) {
				currentDrawing = comp.drawing.number;
				console.log(`  Drawing ${currentDrawing}:`);
			}

			console.log(
				`    ✓ Instance ${comp.instanceNumber}/${comp.totalInstancesOnDrawing} - ${comp.displayId}`,
			);
			console.log(
				`      Status: ${comp.status}, Progress: ${comp.completionPercent}%`,
			);
		}

		// Summary statistics
		const stats = await prisma.component.aggregate({
			_count: true,
			_avg: {
				totalInstancesOnDrawing: true,
			},
			_max: {
				totalInstancesOnDrawing: true,
			},
		});

		console.log("\n📊 Statistics:");
		console.log("─".repeat(60));
		console.log(`Total components: ${stats._count}`);
		console.log(
			`Average instances per component: ${stats._avg.totalInstancesOnDrawing?.toFixed(1)}`,
		);
		console.log(
			`Maximum instances of one component: ${stats._max.totalInstancesOnDrawing}`,
		);
	} catch (error) {
		console.error("❌ Error:", error);
		throw error;
	}
}

checkInstances()
	.then(() => {
		console.log("\n✅ Check complete!");
		process.exit(0);
	})
	.catch(() => process.exit(1));
