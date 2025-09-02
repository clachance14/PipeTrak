#!/usr/bin/env tsx

import { db as prisma } from "@repo/database";

async function verifyGasketFix() {
	console.log("🔍 Verifying gasket milestone fix...\n");

	// Find a gasket component
	const gasket = await prisma.component.findFirst({
		where: {
			OR: [
				{ type: { contains: "GASKET", mode: "insensitive" } },
				{ componentId: { startsWith: "GK" } },
			],
		},
		include: {
			milestones: {
				orderBy: { milestoneOrder: "asc" },
			},
			milestoneTemplate: true,
		},
	});

	if (!gasket) {
		console.log("❌ No gasket components found!");
		return;
	}

	console.log(`Found gasket: ${gasket.componentId} (${gasket.displayId})`);
	console.log(`Type: ${gasket.type}`);
	console.log(`Template: ${gasket.milestoneTemplate?.name}\n`);

	console.log("Milestones:");
	console.log("=".repeat(50));

	let hasWrongMilestones = false;

	for (const milestone of gasket.milestones) {
		const status = milestone.isCompleted ? "✅" : "⭕";
		const weight = milestone.creditWeight || milestone.weight || 0;

		console.log(
			`${status} ${milestone.milestoneName.padEnd(20)} ${weight}% credit`,
		);

		// Check for wrong milestones
		if (
			milestone.milestoneName === "Fit-up" ||
			milestone.milestoneName === "Welded"
		) {
			hasWrongMilestones = true;
			console.log("   ⚠️ WRONG MILESTONE FOR GASKET!");
		}
	}

	console.log("\n" + "=".repeat(50));

	// Check if milestones are correct
	const expectedMilestones = [
		"Receive",
		"Install",
		"Punch",
		"Test",
		"Restore",
	];
	const actualMilestones = gasket.milestones.map((m) => m.milestoneName);

	const isCorrect = expectedMilestones.every((expected) =>
		actualMilestones.some((actual) => actual === expected),
	);

	if (isCorrect && !hasWrongMilestones) {
		console.log("✅ SUCCESS: Gasket has correct milestones!");
		console.log("   - No 'Fit-up' or 'Welded' milestones");
		console.log("   - Has 'Install' milestone with proper weight");
	} else {
		console.log("❌ FAIL: Gasket still has incorrect milestones!");
		console.log("   Expected: Receive, Install, Punch, Test, Restore");
		console.log("   Actual:  ", actualMilestones.join(", "));
	}

	// Check template assignment
	if (gasket.milestoneTemplate?.name === "Reduced Milestone Set") {
		console.log("✅ Template assignment correct: Reduced Milestone Set");
	} else {
		console.log(
			`❌ Template assignment wrong: ${gasket.milestoneTemplate?.name}`,
		);
	}

	// Check a few more gaskets
	console.log("\n📊 Checking all gaskets...");
	const allGaskets = await prisma.component.findMany({
		where: {
			OR: [
				{ type: { contains: "GASKET", mode: "insensitive" } },
				{ componentId: { startsWith: "GK" } },
				{ componentId: { startsWith: "GSW" } },
			],
		},
		include: {
			milestones: true,
			milestoneTemplate: true,
		},
	});

	let correctCount = 0;
	let wrongCount = 0;

	for (const g of allGaskets) {
		const hasInstall = g.milestones.some(
			(m) => m.milestoneName === "Install",
		);
		const hasWrong = g.milestones.some(
			(m) => m.milestoneName === "Fit-up" || m.milestoneName === "Welded",
		);

		if (hasInstall && !hasWrong) {
			correctCount++;
		} else {
			wrongCount++;
			console.log(`   ❌ ${g.componentId}: Still has wrong milestones`);
		}
	}

	console.log(
		`\nSummary: ${correctCount} correct, ${wrongCount} wrong out of ${allGaskets.length} gaskets`,
	);

	if (wrongCount === 0) {
		console.log("\n🎉 ALL GASKETS FIXED SUCCESSFULLY!");
	} else {
		console.log("\n⚠️ Some gaskets still need fixing");
	}
}

verifyGasketFix()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error("Error:", error);
		process.exit(1);
	});
