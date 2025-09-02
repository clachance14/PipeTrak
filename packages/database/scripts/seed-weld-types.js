const { db } = require("../src/client");

const weldTypes = [
	{ code: "BW", description: "Butt Weld" },
	{ code: "SW", description: "Socket Weld" },
	{ code: "FW", description: "Fillet Weld" },
	{ code: "BR", description: "Branch Weld" },
	{ code: "SO", description: "Slip-On Flange Weld" },
	{ code: "TH", description: "Threaded Joint Seal Weld" },
	{ code: "LW", description: "Lap Weld" },
	{ code: "HW", description: "Hot Tap Weld" },
	{ code: "RW", description: "Repair Weld" },
];

async function seedWeldTypes() {
	try {
		console.log("🔧 Seeding WeldType table...");

		// Use upsert to avoid duplicates
		for (const weldType of weldTypes) {
			await db.weldType.upsert({
				where: { code: weldType.code },
				update: {
					description: weldType.description,
					active: true,
				},
				create: {
					code: weldType.code,
					description: weldType.description,
					active: true,
				},
			});
			console.log(
				`✅ Created/Updated weld type: ${weldType.code} - ${weldType.description}`,
			);
		}

		console.log(`🎉 Successfully seeded ${weldTypes.length} weld types!`);
	} catch (error) {
		console.error("❌ Error seeding weld types:", error);
		process.exit(1);
	} finally {
		await db.$disconnect();
	}
}

seedWeldTypes();
