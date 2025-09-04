#!/usr/bin/env bun

/**
 * UX Evaluation for Welder Management System
 * Systematic field usability testing for construction foremen
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

interface EvaluationResult {
	component: string;
	route: string;
	breakpoint: string;
	issues: Array<{
		category:
			| "touch-targets"
			| "spacing"
			| "contrast"
			| "typography"
			| "accessibility"
			| "performance"
			| "business-logic";
		severity: "critical" | "major" | "minor";
		description: string;
		element?: string;
		recommendation: string;
	}>;
	score: number;
	grade: string;
}

interface UXGradingCriteria {
	maxScore: number;
	categories: {
		mobileTouchability: number;
		informationHierarchy: number;
		accessibility: number;
		performance: number;
		businessLogic: number;
	};
}

const GRADING_CRITERIA: UXGradingCriteria = {
	maxScore: 100,
	categories: {
		mobileTouchability: 30, // Touch targets, spacing, contrast, typography, feedback, thumb reach
		informationHierarchy: 20, // Component visibility, disclosure, grouping, state distinction, scannability, priority
		accessibility: 20, // WCAG AA, color-blind safe, error messages, offline indicators, high contrast, ARIA
		performance: 15, // Loading states, skeleton screens, animations, responsiveness, gestures, optimistic UI
		businessLogic: 15, // Role-appropriate UI, 3-tap rule, bulk operations, Excel-like patterns, milestone prominence, drawing navigation
	},
};

const GRADE_THRESHOLDS = {
	"A+": 95,
	A: 90,
	"A-": 85,
	"B+": 80,
	F: 0,
} as const;

function calculateGrade(score: number): string {
	for (const [grade, threshold] of Object.entries(GRADE_THRESHOLDS)) {
		if (score >= threshold) return grade;
	}
	return "F";
}

// Route Testing Configuration
const ROUTES_TO_TEST = [
	"/app/[org]/pipetrak/[projectId]/qc/welders",
	"/app/[org]/pipetrak/[projectId]/qc/field-welds",
];

const BREAKPOINTS_TO_TEST = [
	{ name: "mobile-se", width: 375 },
	{ name: "mobile-standard", width: 390 },
	{ name: "tablet-ipad", width: 768 },
	{ name: "tablet-air", width: 820 },
	{ name: "desktop-standard", width: 1440 },
	{ name: "desktop-full", width: 1920 },
];

// Component Analysis Functions
function analyzeAddWelderModal(): EvaluationResult {
	const issues: EvaluationResult["issues"] = [];

	// Read the component file to analyze
	const filePath = join(
		process.cwd(),
		"apps/web/modules/pipetrak/qc/components/AddWelderModal.tsx",
	);
	const content = readFileSync(filePath, "utf-8");

	// Touch Target Analysis
	const hasSmallTouchTargets =
		content.includes("h-4 w-4") || content.includes("size-sm");
	if (hasSmallTouchTargets) {
		issues.push({
			category: "touch-targets",
			severity: "critical",
			description:
				"Icons and buttons may be too small for construction gloves",
			element: "AlertCircle icon, small buttons",
			recommendation:
				"Increase minimum touch target size to 44px (h-11 w-11 minimum)",
		});
	}

	// Input Sizing Analysis
	const hasSmallInputs =
		!content.includes("sm:h-12") && !content.includes("h-12");
	if (hasSmallInputs) {
		issues.push({
			category: "touch-targets",
			severity: "major",
			description:
				"Input fields may be difficult to tap accurately on mobile",
			element: "Form inputs",
			recommendation:
				"Ensure inputs use h-12 on mobile for better touch accessibility",
		});
	}

	// Typography Analysis
	const hasSmallText =
		content.includes("text-xs") || content.includes("text-sm");
	if (hasSmallText) {
		issues.push({
			category: "typography",
			severity: "major",
			description: "Small text may not be readable in bright sunlight",
			element: "Helper text, validation messages",
			recommendation:
				"Use minimum text-base (16px) for critical information",
		});
	}

	// Spacing Analysis
	const hasInsufficientSpacing =
		content.includes("space-x-2") || content.includes("gap-2");
	if (hasInsufficientSpacing) {
		issues.push({
			category: "spacing",
			severity: "major",
			description: "Insufficient spacing between interactive elements",
			element: "Form controls, buttons",
			recommendation: "Use minimum 8px (space-x-2) between touch targets",
		});
	}

	// Accessibility Analysis
	const hasAriaLabels =
		content.includes("aria-label") || content.includes("htmlFor");
	if (!hasAriaLabels) {
		issues.push({
			category: "accessibility",
			severity: "major",
			description: "Missing proper ARIA labels for screen readers",
			element: "Form inputs",
			recommendation: "Add proper htmlFor attributes and ARIA labels",
		});
	}

	// Error Handling Analysis
	const hasInlineErrors =
		content.includes("text-destructive") &&
		content.includes("validationErrors");
	const errorHandlingScore = hasInlineErrors ? 5 : 2;

	if (!hasInlineErrors) {
		issues.push({
			category: "accessibility",
			severity: "major",
			description: "Error messages may not be clearly visible",
			element: "Validation messages",
			recommendation:
				"Ensure error messages are prominently displayed with high contrast",
		});
	}

	// Business Logic Analysis
	const hasAutoFocus = content.includes("autoFocus");
	if (!hasAutoFocus) {
		issues.push({
			category: "business-logic",
			severity: "minor",
			description: "No auto-focus for quick data entry",
			element: "First input field",
			recommendation:
				"Add autoFocus to stencil field for faster workflow",
		});
	}

	// Calculate score
	let score = 100;
	for (const issue of issues) {
		switch (issue.severity) {
			case "critical":
				score -= 15;
				break;
			case "major":
				score -= 10;
				break;
			case "minor":
				score -= 5;
				break;
		}
	}

	return {
		component: "AddWelderModal",
		route: "/qc/welders",
		breakpoint: "component-analysis",
		issues,
		score: Math.max(score, 0),
		grade: calculateGrade(score),
	};
}

function analyzeWelderTable(): EvaluationResult {
	const issues: EvaluationResult["issues"] = [];

	// Read the component file
	const filePath = join(
		process.cwd(),
		"apps/web/modules/pipetrak/qc/components/WelderTable.tsx",
	);
	const content = readFileSync(filePath, "utf-8");

	// Mobile Responsiveness Analysis
	const hasMobileView =
		content.includes("md:hidden") && content.includes("md:block");
	if (!hasMobileView) {
		issues.push({
			category: "touch-targets",
			severity: "critical",
			description: "No proper mobile-responsive layout",
			element: "Data table",
			recommendation: "Implement card-based mobile layout for table data",
		});
	}

	// Touch Target Analysis for Action Buttons
	const hasSmallActionButtons = content.includes('size="sm"');
	if (hasSmallActionButtons) {
		issues.push({
			category: "touch-targets",
			severity: "major",
			description: "Action buttons too small for construction gloves",
			element: "Edit, delete, toggle buttons",
			recommendation:
				'Use minimum size="icon" or larger for action buttons',
		});
	}

	// Search Functionality Analysis
	const hasSearchIcon = content.includes("<Search");
	const searchScore = hasSearchIcon ? 5 : 2;
	if (!hasSearchIcon) {
		issues.push({
			category: "business-logic",
			severity: "minor",
			description: "Search field lacks visual search icon",
			element: "Search input",
			recommendation: "Add search icon for better discoverability",
		});
	}

	// Information Hierarchy Analysis
	const hasStatusBadges =
		content.includes("Badge") && content.includes("status=");
	const hasProgressiveDisclosure =
		content.includes("Dialog") || content.includes("Sheet");

	if (!hasStatusBadges) {
		issues.push({
			category: "accessibility",
			severity: "major",
			description: "Welder status not clearly indicated",
			element: "Status column",
			recommendation:
				"Use color-coded badges with icons for status indication",
		});
	}

	// Loading States Analysis
	const hasLoadingState =
		content.includes("isLoading") && content.includes("Loader");
	if (!hasLoadingState) {
		issues.push({
			category: "performance",
			severity: "major",
			description: "No loading state feedback",
			element: "Data table",
			recommendation: "Add skeleton loading states for better UX",
		});
	}

	// Empty State Analysis
	const hasEmptyState = content.includes("No welders found");
	const emptyStateScore = hasEmptyState ? 5 : 1;

	// Calculate score
	let score = 95; // Start high for this component as it has good mobile responsiveness
	for (const issue of issues) {
		switch (issue.severity) {
			case "critical":
				score -= 15;
				break;
			case "major":
				score -= 10;
				break;
			case "minor":
				score -= 5;
				break;
		}
	}

	return {
		component: "WelderTable",
		route: "/qc/welders",
		breakpoint: "component-analysis",
		issues,
		score: Math.max(score, 0),
		grade: calculateGrade(score),
	};
}

function analyzeAddWeldModal(): EvaluationResult {
	const issues: EvaluationResult["issues"] = [];

	// Read the component file
	const filePath = join(
		process.cwd(),
		"apps/web/modules/pipetrak/qc/components/AddWeldModal.tsx",
	);
	const content = readFileSync(filePath, "utf-8");

	// Welder Selection Analysis
	const hasWelderValidation =
		content.includes("!formData.welderId") && content.includes("alert");
	const welderValidationScore = hasWelderValidation ? 8 : 3;

	if (!hasWelderValidation) {
		issues.push({
			category: "business-logic",
			severity: "critical",
			description:
				"Welder selection validation may not be clear to users",
			element: "Welder dropdown",
			recommendation:
				"Add clear validation messages and prevent form submission",
		});
	}

	// Form Layout Analysis - Grid Layout on Mobile
	const hasGridLayout = content.includes("grid-cols-2");
	if (hasGridLayout) {
		issues.push({
			category: "touch-targets",
			severity: "major",
			description: "2-column grid may be too cramped on mobile devices",
			element: "Form grid layout",
			recommendation:
				"Use single column layout on mobile with responsive grid",
		});
	}

	// Complex Input Analysis (Calendar, Dropdowns)
	const hasCalendarPopover =
		content.includes("Popover") && content.includes("Calendar");
	const calendarScore = hasCalendarPopover ? 5 : 8; // Deduct points for complex interaction

	if (hasCalendarPopover) {
		issues.push({
			category: "touch-targets",
			severity: "minor",
			description:
				"Calendar popover may be difficult to use with construction gloves",
			element: "Date picker",
			recommendation:
				"Consider native date input for mobile or larger touch targets",
		});
	}

	// Typography Analysis for Field Labels
	const hasProperLabeling =
		content.includes("*") && content.includes("required");
	if (!hasProperLabeling) {
		issues.push({
			category: "accessibility",
			severity: "major",
			description: "Required field indicators not clearly marked",
			element: "Form labels",
			recommendation:
				"Add clear required field indicators (*) to all mandatory fields",
		});
	}

	// Welder Dropdown UX Analysis
	const hasWelderPlaceholder =
		content.includes("Select welder") ||
		content.includes("Loading welders");
	const welderDropdownScore = hasWelderPlaceholder ? 8 : 5;

	// Error Message Analysis
	const hasUserFriendlyErrors =
		content.includes("alert(") || content.includes("Alert");
	if (hasUserFriendlyErrors && content.includes("alert(")) {
		issues.push({
			category: "accessibility",
			severity: "major",
			description: "Using browser alerts instead of in-UI error messages",
			element: "Error handling",
			recommendation: "Replace alert() with proper UI error components",
		});
	}

	// Business Logic - Welder Integration
	const hasWelderIntegration =
		content.includes("useWelders") && content.includes("active: true");
	const businessLogicScore = hasWelderIntegration ? 10 : 5;

	// Calculate score
	let score = 85; // Start with moderate score
	for (const issue of issues) {
		switch (issue.severity) {
			case "critical":
				score -= 15;
				break;
			case "major":
				score -= 10;
				break;
			case "minor":
				score -= 5;
				break;
		}
	}

	return {
		component: "AddWeldModal",
		route: "/qc/field-welds",
		breakpoint: "component-analysis",
		issues,
		score: Math.max(score, 0),
		grade: calculateGrade(score),
	};
}

// Main Evaluation Function
function runUXEvaluation(): void {
	console.log("🔍 Starting PipeTrak Welder Management UX Evaluation...\n");

	const results: EvaluationResult[] = [
		analyzeAddWelderModal(),
		analyzeWelderTable(),
		analyzeAddWeldModal(),
	];

	// Generate Report
	let report = "# PipeTrak Welder Management UX Evaluation Report\n\n";
	report += `Generated: ${new Date().toISOString()}\n\n`;

	// Executive Summary
	const overallScore = Math.round(
		results.reduce((sum, r) => sum + r.score, 0) / results.length,
	);
	const overallGrade = calculateGrade(overallScore);

	report += "## Executive Summary\n\n";
	report += `**Overall Grade: ${overallGrade} (${overallScore}/100)**\n\n`;

	if (overallScore < 85) {
		report +=
			"❌ **Critical Issues Found**: The welder management system requires improvements before field deployment.\n\n";
	} else if (overallScore < 90) {
		report +=
			"⚠️ **Minor Issues Found**: The system meets minimum field usability standards but has room for improvement.\n\n";
	} else {
		report +=
			"✅ **Field Ready**: The welder management system meets high field usability standards.\n\n";
	}

	// Component Analysis
	report += "## Component Analysis\n\n";

	for (const result of results) {
		report += `### ${result.component} - Grade: ${result.grade} (${result.score}/100)\n\n`;

		if (result.issues.length > 0) {
			report += "**Issues Found:**\n\n";
			for (const issue of result.issues) {
				const severity = issue.severity.toUpperCase();
				const icon =
					issue.severity === "critical"
						? "🚨"
						: issue.severity === "major"
							? "⚠️"
							: "ℹ️";
				report += `${icon} **${severity}**: ${issue.description}\n`;
				if (issue.element) report += `   - Element: ${issue.element}\n`;
				report += `   - Recommendation: ${issue.recommendation}\n\n`;
			}
		} else {
			report += "✅ No issues found.\n\n";
		}
	}

	// Field Usability Recommendations
	report += "## Field Usability Recommendations\n\n";

	const criticalIssues = results
		.flatMap((r) => r.issues)
		.filter((i) => i.severity === "critical");
	const majorIssues = results
		.flatMap((r) => r.issues)
		.filter((i) => i.severity === "major");

	if (criticalIssues.length > 0) {
		report += "### Critical Fixes Required\n\n";
		for (const issue of criticalIssues) {
			report += `- ${issue.recommendation}\n`;
		}
		report += "\n";
	}

	if (majorIssues.length > 0) {
		report += "### High Priority Improvements\n\n";
		for (const issue of majorIssues) {
			report += `- ${issue.recommendation}\n`;
		}
		report += "\n";
	}

	// Construction Site Optimization
	report += "### Construction Site Optimization Checklist\n\n";
	report += "- [ ] All touch targets minimum 44px for glove compatibility\n";
	report += "- [ ] Text size minimum 16px for sunlight readability\n";
	report += "- [ ] High contrast ratios (7:1) for outdoor visibility\n";
	report += "- [ ] Single-handed operation for common tasks\n";
	report += "- [ ] Maximum 3 taps for frequent actions\n";
	report += "- [ ] Clear error messages with recovery steps\n";
	report += "- [ ] Loading states for all async operations\n";
	report += "- [ ] Offline-capable functionality indicators\n\n";

	// Next Steps
	report += "## Next Steps\n\n";
	if (overallScore < 85) {
		report +=
			"1. **Immediate Action Required**: Fix critical issues before field testing\n";
		report += "2. Schedule comprehensive mobile device testing\n";
		report += "3. Conduct user testing with construction foremen\n";
		report += "4. Re-evaluate after fixes are implemented\n\n";
	} else {
		report += "1. Address remaining minor issues\n";
		report += "2. Schedule field testing with construction foremen\n";
		report += "3. Gather feedback and iterate\n\n";
	}

	// Save Report
	const timestamp = new Date()
		.toISOString()
		.replace(/[:.]/g, "-")
		.slice(0, 19);
	const reportPath = join(
		process.cwd(),
		`ux-welder-evaluation-${timestamp}.md`,
	);
	writeFileSync(reportPath, report);

	// Console Output
	console.log("📊 Evaluation Results:");
	console.log("=".repeat(50));
	for (const result of results) {
		const status =
			result.score >= 85 ? "✅" : result.score >= 80 ? "⚠️" : "❌";
		console.log(
			`${status} ${result.component}: ${result.grade} (${result.score}/100) - ${result.issues.length} issues`,
		);
	}
	console.log("=".repeat(50));
	console.log(`Overall Grade: ${overallGrade} (${overallScore}/100)`);
	console.log(`Report saved: ${reportPath}`);
}

// Run evaluation if script is executed directly
if (require.main === module) {
	runUXEvaluation();
}

export {
	runUXEvaluation,
	analyzeAddWelderModal,
	analyzeWelderTable,
	analyzeAddWeldModal,
};
