/**
 * ROC (Rate of Completion) calculation utilities
 * Implements weighted progress calculations for PipeTrak components
 */

import type { ROCWeightedProgress, ComponentDetail } from "../types";

// ============================================================================
// ROC Weight Calculations
// ============================================================================

/**
 * Calculate ROC weight based on component type and system criticality
 * Higher weights indicate more critical components to project completion
 */
export function calculateROCWeight(
	componentType: string,
	system: string | null,
	area: string | null,
): number {
	// Base weights by component type (industrial construction priorities)
	const typeWeights: Record<string, number> = {
		// Critical path components
		"Major Equipment": 10.0,
		"Control Valve": 8.0,
		"Safety Valve": 8.0,
		Pump: 7.0,
		Compressor: 7.0,
		"Heat Exchanger": 6.0,

		// High importance components
		Piping: 5.0,
		Instrument: 4.0,
		Electrical: 4.0,

		// Standard components
		Fitting: 3.0,
		Flange: 2.0,
		Gasket: 1.5,
		Bolt: 1.0,
		Support: 1.0,

		// Default weight
		Other: 2.0,
	};

	// System criticality multipliers
	const systemMultipliers: Record<string, number> = {
		// Safety-critical systems
		"Fire Safety": 1.5,
		"Emergency Shutdown": 1.5,
		"Safety Relief": 1.4,

		// Production-critical systems
		"Main Process": 1.3,
		Utilities: 1.2,
		"Cooling Water": 1.2,
		Steam: 1.2,

		// Support systems
		Drain: 1.0,
		Vent: 1.0,
		"Instrument Air": 1.1,

		// Default multiplier
		Other: 1.0,
	};

	// Area complexity multipliers
	const areaMultipliers: Record<string, number> = {
		// High-complexity areas
		Reactor: 1.4,
		Distillation: 1.3,
		"Compressor House": 1.3,

		// Moderate-complexity areas
		"Tank Farm": 1.1,
		Utilities: 1.1,

		// Standard areas
		"Pipe Rack": 1.0,
		"Off-sites": 1.0,

		// Default multiplier
		Other: 1.0,
	};

	// Get base weight
	const baseWeight = typeWeights[componentType] || typeWeights["Other"];

	// Apply system multiplier
	const systemMultiplier = system
		? systemMultipliers[system] || systemMultipliers["Other"]
		: 1.0;

	// Apply area multiplier
	const areaMultiplier = area
		? areaMultipliers[area] || areaMultipliers["Other"]
		: 1.0;

	// Calculate final ROC weight
	return baseWeight * systemMultiplier * areaMultiplier;
}

/**
 * Calculate weighted completion percentage for a single component
 */
export function calculateComponentROCProgress(
	completionPercent: number,
	rocWeight: number,
): number {
	return (completionPercent / 100) * rocWeight;
}

/**
 * Calculate overall ROC-weighted progress for a collection of components
 */
export function calculateOverallROCProgress(
	components: ComponentDetail[],
): ROCWeightedProgress {
	let totalWeight = 0;
	let completedWeight = 0;

	// Area and system breakdowns
	const areaBreakdowns: Record<
		string,
		{ weight: number; completed: number; count: number }
	> = {};
	const systemBreakdowns: Record<
		string,
		{ weight: number; completed: number; count: number }
	> = {};

	// Process each component
	for (const component of components) {
		const rocWeight = calculateROCWeight(
			component.type,
			component.system,
			component.area,
		);

		const completedWeight_component = calculateComponentROCProgress(
			component.completionPercent,
			rocWeight,
		);

		// Add to totals
		totalWeight += rocWeight;
		completedWeight += completedWeight_component;

		// Area breakdown
		const area = component.area || "Unknown";
		if (!areaBreakdowns[area]) {
			areaBreakdowns[area] = { weight: 0, completed: 0, count: 0 };
		}
		areaBreakdowns[area].weight += rocWeight;
		areaBreakdowns[area].completed += completedWeight_component;
		areaBreakdowns[area].count += 1;

		// System breakdown
		const system = component.system || "Unknown";
		if (!systemBreakdowns[system]) {
			systemBreakdowns[system] = { weight: 0, completed: 0, count: 0 };
		}
		systemBreakdowns[system].weight += rocWeight;
		systemBreakdowns[system].completed += completedWeight_component;
		systemBreakdowns[system].count += 1;
	}

	// Calculate overall ROC progress
	const overallROCProgress =
		totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;

	// Transform breakdowns to response format
	const areaBreakdownsArray = Object.entries(areaBreakdowns).map(
		([area, data]) => ({
			area,
			rocProgress:
				data.weight > 0 ? (data.completed / data.weight) * 100 : 0,
			totalWeight: data.weight,
			completedWeight: data.completed,
			componentCount: data.count,
		}),
	);

	const systemBreakdownsArray = Object.entries(systemBreakdowns).map(
		([system, data]) => ({
			system,
			rocProgress:
				data.weight > 0 ? (data.completed / data.weight) * 100 : 0,
			totalWeight: data.weight,
			completedWeight: data.completed,
			componentCount: data.count,
		}),
	);

	return {
		overallROCProgress,
		totalROCWeight: totalWeight,
		completedROCWeight: completedWeight,
		areaBreakdowns: areaBreakdownsArray.sort(
			(a, b) => b.totalWeight - a.totalWeight,
		),
		systemBreakdowns: systemBreakdownsArray.sort(
			(a, b) => b.totalWeight - a.totalWeight,
		),
		generatedAt: new Date().toISOString(),
	};
}

/**
 * Compare ROC progress vs standard completion percentage
 */
export function compareROCvsStandardProgress(
	components: ComponentDetail[],
): Array<{
	name: string;
	rocProgress: number;
	standardProgress: number;
}> {
	// Group components by area for comparison
	const areaGroups: Record<string, ComponentDetail[]> = {};

	for (const component of components) {
		const area = component.area || "Unknown";
		if (!areaGroups[area]) {
			areaGroups[area] = [];
		}
		areaGroups[area].push(component);
	}

	// Calculate both ROC and standard progress for each area
	return Object.entries(areaGroups)
		.map(([area, areaComponents]) => {
			const rocData = calculateOverallROCProgress(areaComponents);
			const standardProgress =
				areaComponents.reduce(
					(sum, comp) => sum + comp.completionPercent,
					0,
				) / areaComponents.length;

			return {
				name: area,
				rocProgress: rocData.overallROCProgress,
				standardProgress,
			};
		})
		.sort((a, b) => b.rocProgress - a.rocProgress);
}

/**
 * Calculate ROC-based project velocity (components completed per day, weighted)
 */
export function calculateROCVelocity(
	historicalData: Array<{
		date: string;
		components: ComponentDetail[];
	}>,
): {
	averageDailyROCCompletion: number;
	currentVelocity: number;
	velocityTrend: "increasing" | "decreasing" | "stable";
	projectedROCCompletionDate: string | null;
} {
	if (historicalData.length < 2) {
		return {
			averageDailyROCCompletion: 0,
			currentVelocity: 0,
			velocityTrend: "stable",
			projectedROCCompletionDate: null,
		};
	}

	// Calculate daily ROC progress
	const dailyROCProgress: number[] = [];

	for (let i = 1; i < historicalData.length; i++) {
		const previousROC = calculateOverallROCProgress(
			historicalData[i - 1].components,
		);
		const currentROC = calculateOverallROCProgress(
			historicalData[i].components,
		);

		const dailyProgress =
			currentROC.overallROCProgress - previousROC.overallROCProgress;
		dailyROCProgress.push(Math.max(0, dailyProgress)); // Only count positive progress
	}

	// Calculate metrics
	const averageDailyROCCompletion =
		dailyROCProgress.reduce((sum, progress) => sum + progress, 0) /
		dailyROCProgress.length;

	const recentDays = Math.min(7, dailyROCProgress.length);
	const currentVelocity =
		dailyROCProgress
			.slice(-recentDays)
			.reduce((sum, progress) => sum + progress, 0) / recentDays;

	// Determine velocity trend
	const midPoint = Math.floor(dailyROCProgress.length / 2);
	const firstHalf = dailyROCProgress.slice(0, midPoint);
	const secondHalf = dailyROCProgress.slice(midPoint);

	const firstHalfAvg =
		firstHalf.reduce((sum, progress) => sum + progress, 0) /
		firstHalf.length;
	const secondHalfAvg =
		secondHalf.reduce((sum, progress) => sum + progress, 0) /
		secondHalf.length;

	let velocityTrend: "increasing" | "decreasing" | "stable";
	const trendThreshold = 0.1; // 0.1% progress difference threshold

	if (secondHalfAvg - firstHalfAvg > trendThreshold) {
		velocityTrend = "increasing";
	} else if (firstHalfAvg - secondHalfAvg > trendThreshold) {
		velocityTrend = "decreasing";
	} else {
		velocityTrend = "stable";
	}

	// Project completion date based on current velocity
	let projectedROCCompletionDate: string | null = null;

	if (currentVelocity > 0) {
		const latestROC = calculateOverallROCProgress(
			historicalData[historicalData.length - 1].components,
		);
		const remainingProgress = 100 - latestROC.overallROCProgress;
		const daysToCompletion = remainingProgress / currentVelocity;

		const today = new Date();
		const projectedDate = new Date(
			today.getTime() + daysToCompletion * 24 * 60 * 60 * 1000,
		);
		projectedROCCompletionDate = projectedDate.toISOString().split("T")[0];
	}

	return {
		averageDailyROCCompletion,
		currentVelocity,
		velocityTrend,
		projectedROCCompletionDate,
	};
}

/**
 * Identify critical path components based on ROC weight
 */
export function identifyCriticalPathComponents(
	components: ComponentDetail[],
	topPercentile = 0.1,
): ComponentDetail[] {
	// Calculate ROC weights and sort by criticality
	const componentsWithROC = components.map((component) => ({
		component,
		rocWeight: calculateROCWeight(
			component.type,
			component.system,
			component.area,
		),
	}));

	componentsWithROC.sort((a, b) => b.rocWeight - a.rocWeight);

	// Return top percentile of components
	const topCount = Math.max(1, Math.floor(components.length * topPercentile));
	return componentsWithROC.slice(0, topCount).map((item) => item.component);
}

/**
 * Calculate ROC efficiency score - how well the team is focusing on critical components
 */
export function calculateROCEfficiency(components: ComponentDetail[]): {
	efficiencyScore: number;
	criticalComponentsCompleted: number;
	totalCriticalComponents: number;
	recommendations: string[];
} {
	const criticalComponents = identifyCriticalPathComponents(components, 0.2); // Top 20%
	const completedCritical = criticalComponents.filter(
		(comp) => comp.completionPercent >= 100,
	);

	const efficiencyScore =
		criticalComponents.length > 0
			? (completedCritical.length / criticalComponents.length) * 100
			: 100;

	// Generate recommendations
	const recommendations: string[] = [];

	if (efficiencyScore < 50) {
		recommendations.push(
			"Focus on high-ROC components in critical systems",
		);
		recommendations.push("Prioritize major equipment and control valves");
	}

	if (efficiencyScore < 75) {
		const incompleteCritical = criticalComponents.filter(
			(comp) => comp.completionPercent < 100,
		);
		const areaFocus = Array.from(
			new Set(incompleteCritical.map((c) => c.area)),
		).slice(0, 2);
		recommendations.push(
			`Focus completion efforts in: ${areaFocus.join(", ")}`,
		);
	}

	if (efficiencyScore >= 75) {
		recommendations.push("Good progress on critical path components");
	}

	return {
		efficiencyScore,
		criticalComponentsCompleted: completedCritical.length,
		totalCriticalComponents: criticalComponents.length,
		recommendations,
	};
}
