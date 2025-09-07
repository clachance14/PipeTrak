import { format, differenceInDays, parseISO } from "date-fns";
import type {
	ProgressReportData,
	ComponentDetail,
	TestPackageDetail,
	TrendDataPoint,
	ChartDataPoint,
	ProgressChartData,
} from "../types";

/**
 * Format numbers for display in reports
 */
export const formatters = {
	/**
	 * Format percentage with specified decimal places
	 */
	percentage: (value: number, decimals = 1): string => {
		return `${value.toFixed(decimals)}%`;
	},

	/**
	 * Format large numbers with thousands separators
	 */
	number: (value: number): string => {
		return value.toLocaleString();
	},

	/**
	 * Format currency values
	 */
	currency: (value: number, currency = "USD"): string => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency,
		}).format(value);
	},

	/**
	 * Format dates consistently across reports
	 */
	date: (dateString: string, formatString = "MMM dd, yyyy"): string => {
		try {
			return format(parseISO(dateString), formatString);
		} catch {
			return dateString;
		}
	},

	/**
	 * Format duration in human-readable format
	 */
	duration: (days: number): string => {
		if (days === 0) return "Today";
		if (days === 1) return "1 day";
		if (days < 7) return `${days} days`;
		if (days < 30) return `${Math.round(days / 7)} weeks`;
		if (days < 365) return `${Math.round(days / 30)} months`;
		return `${Math.round(days / 365)} years`;
	},

	/**
	 * Format file sizes
	 */
	fileSize: (bytes: number): string => {
		const sizes = ["Bytes", "KB", "MB", "GB"];
		if (bytes === 0) return "0 Bytes";
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return `${Math.round((bytes / 1024 ** i) * 100) / 100} ${sizes[i]}`;
	},

	/**
	 * Format completion status with color indicators
	 */
	completionStatus: (
		percentage: number,
	): {
		label: string;
		color: "success" | "warning" | "danger" | "muted";
		icon: string;
	} => {
		if (percentage === 100) {
			return { label: "Completed", color: "success", icon: "✓" };
		}
		if (percentage >= 75) {
			return { label: "Nearly Complete", color: "success", icon: "⚡" };
		}
		if (percentage >= 50) {
			return { label: "In Progress", color: "warning", icon: "⏳" };
		}
		if (percentage > 0) {
			return { label: "Started", color: "warning", icon: "▶" };
		}
		return { label: "Not Started", color: "muted", icon: "○" };
	},
};

/**
 * Calculate various metrics from report data
 */
export const calculations = {
	/**
	 * Calculate completion velocity (components per day)
	 */
	completionVelocity: (trendData: TrendDataPoint[]): number => {
		if (trendData.length < 2) return 0;

		const recent = trendData.slice(-7); // Last 7 days
		const totalIncrease =
			recent[recent.length - 1].componentsCompleted -
			recent[0].componentsCompleted;
		const days = differenceInDays(
			parseISO(recent[recent.length - 1].date),
			parseISO(recent[0].date),
		);

		return days > 0 ? totalIncrease / days : 0;
	},

	/**
	 * Project completion date based on current velocity
	 */
	projectedCompletion: (
		currentProgress: number,
		totalComponents: number,
		velocity: number,
	): Date | null => {
		if (velocity <= 0 || currentProgress >= totalComponents) return null;

		const remainingComponents = totalComponents - currentProgress;
		const daysToComplete = remainingComponents / velocity;

		const projectedDate = new Date();
		projectedDate.setDate(
			projectedDate.getDate() + Math.ceil(daysToComplete),
		);

		return projectedDate;
	},

	/**
	 * Calculate ROC efficiency (actual ROC vs standard progress)
	 */
	rocEfficiency: (rocProgress: number, standardProgress: number): number => {
		if (standardProgress === 0) return 0;
		return (rocProgress / standardProgress) * 100;
	},

	/**
	 * Calculate stall risk score
	 */
	stallRisk: (
		component: ComponentDetail,
	): {
		score: number;
		level: "low" | "medium" | "high" | "critical";
		reasons: string[];
	} => {
		let score = 0;
		const reasons: string[] = [];

		// Factor in stalled days
		if (component.stalledDays) {
			if (component.stalledDays >= 21) {
				score += 40;
				reasons.push(`Stalled for ${component.stalledDays} days`);
			} else if (component.stalledDays >= 14) {
				score += 25;
				reasons.push(`Stalled for ${component.stalledDays} days`);
			} else if (component.stalledDays >= 7) {
				score += 15;
				reasons.push(`Stalled for ${component.stalledDays} days`);
			}
		}

		// Factor in completion percentage vs time
		if (
			component.completionPercent > 0 &&
			component.completionPercent < 25
		) {
			score += 20;
			reasons.push("Low completion despite activity");
		}

		// Factor in critical path (would need additional data)
		// if (component.isCriticalPath) {
		//   score += 15;
		//   reasons.push("On critical path");
		// }

		const level: "low" | "medium" | "high" | "critical" =
			score >= 50
				? "critical"
				: score >= 35
					? "high"
					: score >= 20
						? "medium"
						: "low";

		return { score, level, reasons };
	},
};

/**
 * Data transformation utilities
 */
export const transformers = {
	/**
	 * Transform progress data into chart-ready format
	 */
	toChartData: (progressData: ProgressReportData): ProgressChartData => {
		return {
			timeSeriesData:
				progressData.trends?.dailyProgress?.map((point) => ({
					name: formatters.date(point.date, "MMM dd"),
					date: point.date,
					value: point.completionPercent,
					completionPercent: point.completionPercent,
					totalComponents: point.componentsCompleted,
				})) || [],

			areaDistribution: progressData.areaBreakdowns.map((area) => ({
				name: area.area,
				value: area.completionPercent,
				totalComponents: area.totalComponents,
				completedComponents: area.completedComponents,
			})),

			systemDistribution: progressData.systemBreakdowns.map((system) => ({
				name: system.system,
				value: system.completionPercent,
				totalComponents: system.totalComponents,
				completedComponents: system.completedComponents,
			})),

			statusDistribution: [
				{
					name: "Completed",
					value: progressData.overview.completedComponents,
				},
				{
					name: "In Progress",
					value:
						progressData.overview.totalComponents -
						progressData.overview.completedComponents,
				},
			],
		};
	},

	/**
	 * Transform component data for table display
	 */
	toTableData: (components: ComponentDetail[]) => {
		return components.map((component) => {
			const risk = calculations.stallRisk(component);
			const status = formatters.completionStatus(
				component.completionPercent,
			);

			return {
				...component,
				formattedCompletion: formatters.percentage(
					component.completionPercent,
				),
				formattedUpdated: component.updatedAt
					? formatters.date(component.updatedAt)
					: "Never",
				stallDuration: component.stalledDays
					? formatters.duration(component.stalledDays)
					: "N/A",
				riskLevel: risk.level,
				riskScore: risk.score,
				statusIcon: status.icon,
				statusColor: status.color,
			};
		});
	},

	/**
	 * Transform test package data for readiness display
	 */
	toReadinessData: (testPackages: TestPackageDetail[]) => {
		return testPackages.map((pkg) => ({
			...pkg,
			formattedCompletion: formatters.percentage(pkg.completionPercent),
			readinessLabel: pkg.readinessStatus
				.replace("_", " ")
				.replace(/\b\w/g, (l) => l.toUpperCase()),
			estimatedReady: pkg.estimatedReadyDate
				? formatters.date(pkg.estimatedReadyDate)
				: "TBD",
			velocityText: pkg.velocityMetrics
				? `${pkg.velocityMetrics.averageDailyCompletion.toFixed(1)}/day`
				: "N/A",
		}));
	},
};

/**
 * Report validation utilities
 */
export const validators = {
	/**
	 * Validate date range
	 */
	dateRange: (startDate: string, endDate: string): string[] => {
		const errors: string[] = [];

		try {
			const start = parseISO(startDate);
			const end = parseISO(endDate);

			if (start > end) {
				errors.push("Start date must be before end date");
			}

			const daysDiff = differenceInDays(end, start);
			if (daysDiff > 365) {
				errors.push("Date range cannot exceed 365 days");
			}
		} catch {
			errors.push("Invalid date format");
		}

		return errors;
	},

	/**
	 * Validate completion percentage
	 */
	completionRange: (min: number, max: number): string[] => {
		const errors: string[] = [];

		if (min < 0 || min > 100) {
			errors.push("Minimum completion must be between 0-100%");
		}

		if (max < 0 || max > 100) {
			errors.push("Maximum completion must be between 0-100%");
		}

		if (min > max) {
			errors.push("Minimum completion cannot exceed maximum");
		}

		return errors;
	},

	/**
	 * Validate report data completeness
	 */
	reportData: (
		data: any,
	): { isValid: boolean; warnings: string[]; errors: string[] } => {
		const warnings: string[] = [];
		const errors: string[] = [];

		if (!data) {
			errors.push("No data provided");
			return { isValid: false, warnings, errors };
		}

		// Check for empty datasets
		if (Array.isArray(data) && data.length === 0) {
			warnings.push("Dataset is empty");
		}

		// Check for missing critical fields
		if (data.overview && data.overview.totalComponents === 0) {
			warnings.push("No components found in project");
		}

		return {
			isValid: errors.length === 0,
			warnings,
			errors,
		};
	},
};

/**
 * Export utilities for reports
 */
export const exportHelpers = {
	/**
	 * Generate filename with timestamp
	 */
	generateFilename: (reportType: string, fileFormat: string): string => {
		const timestamp = format(new Date(), "yyyy-MM-dd-HHmm");
		return `${reportType}-report-${timestamp}.${fileFormat}`;
	},

	/**
	 * Prepare data for CSV export
	 */
	toCsvData: (data: any[]): string => {
		if (!Array.isArray(data) || data.length === 0) {
			return "";
		}

		const headers = Object.keys(data[0]);
		const csvRows = [
			headers.join(","),
			...data.map((row) =>
				headers
					.map((header) => {
						const value = row[header];
						// Escape quotes and wrap in quotes if contains comma
						if (
							typeof value === "string" &&
							(value.includes(",") || value.includes('"'))
						) {
							return `"${value.replace(/"/g, '""')}"`;
						}
						return value;
					})
					.join(","),
			),
		];

		return csvRows.join("\n");
	},

	/**
	 * Extract summary statistics from data
	 */
	extractSummary: (data: ProgressReportData) => ({
		totalComponents: data.overview.totalComponents,
		completedComponents: data.overview.completedComponents,
		completionPercentage: formatters.percentage(
			data.overview.overallCompletionPercent,
		),
		activeDrawings: data.overview.activeDrawings,
		testPackagesReady: data.overview.testPackagesReady,
		topAreas: data.areaBreakdowns
			.sort((a, b) => b.completionPercent - a.completionPercent)
			.slice(0, 5)
			.map((area) => ({
				name: area.area,
				completion: formatters.percentage(area.completionPercent),
			})),
		topSystems: data.systemBreakdowns
			.sort((a, b) => b.completionPercent - a.completionPercent)
			.slice(0, 5)
			.map((system) => ({
				name: system.system,
				completion: formatters.percentage(system.completionPercent),
			})),
	}),
};

/**
 * Accessibility helpers for reports
 */
export const accessibilityHelpers = {
	/**
	 * Generate screen reader friendly chart description
	 */
	chartDescription: (
		chartData: ChartDataPoint[],
		chartType: string,
	): string => {
		if (chartData.length === 0) {
			return `Empty ${chartType} chart with no data available`;
		}

		const total = chartData.reduce((sum, item) => sum + item.value, 0);
		const highest = chartData.reduce((max, item) =>
			item.value > max.value ? item : max,
		);
		const lowest = chartData.reduce((min, item) =>
			item.value < min.value ? item : min,
		);

		return (
			`${chartType} chart showing ${chartData.length} data points. ` +
			`Total value: ${formatters.number(total)}. ` +
			`Highest: ${highest.name} at ${formatters.number(highest.value)}. ` +
			`Lowest: ${lowest.name} at ${formatters.number(lowest.value)}.`
		);
	},

	/**
	 * Generate table summary for screen readers
	 */
	tableSummary: (
		rowCount: number,
		columnCount: number,
		tableName: string,
	): string => {
		return `${tableName} table with ${rowCount} rows and ${columnCount} columns`;
	},
};
