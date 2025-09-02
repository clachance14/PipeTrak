import type { ChartDataPoint, TrendDataPoint } from "../types";

/**
 * Chart color palette matching PipeTrak design system
 */
export const CHART_COLORS = {
	primary: "#3b82f6", // Blue
	secondary: "#10b981", // Emerald
	accent: "#f59e0b", // Amber
	danger: "#ef4444", // Red
	warning: "#f97316", // Orange
	success: "#22c55e", // Green
	info: "#06b6d4", // Cyan
	purple: "#8b5cf6", // Violet
	gray: "#6b7280", // Gray
	dark: "#1f2937", // Dark Gray
} as const;

export const CHART_COLOR_ARRAY = Object.values(CHART_COLORS);

/**
 * Default chart dimensions and responsive breakpoints
 */
export const CHART_DIMENSIONS = {
	mobile: {
		width: "100%",
		height: 250,
	},
	tablet: {
		width: "100%",
		height: 350,
	},
	desktop: {
		width: "100%",
		height: 400,
	},
	print: {
		width: "100%",
		height: 300,
	},
} as const;

/**
 * Common chart style configurations
 */
export const CHART_STYLES = {
	grid: {
		strokeDasharray: "3 3",
		className: "stroke-muted opacity-30",
	},
	axis: {
		tick: {
			fontSize: 12,
			fill: "hsl(var(--muted-foreground))",
		},
		tickLine: {
			stroke: "hsl(var(--muted-foreground))",
			strokeWidth: 1,
		},
		axisLine: {
			stroke: "hsl(var(--border))",
			strokeWidth: 1,
		},
	},
	tooltip: {
		contentStyle: {
			backgroundColor: "hsl(var(--background))",
			border: "1px solid hsl(var(--border))",
			borderRadius: "6px",
			fontSize: "12px",
			boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
		},
		cursor: {
			stroke: "hsl(var(--muted-foreground))",
			strokeWidth: 1,
			strokeDasharray: "5 5",
		},
	},
	legend: {
		wrapperStyle: {
			fontSize: "12px",
			color: "hsl(var(--muted-foreground))",
		},
	},
} as const;

/**
 * Progress chart specific configurations
 */
export const PROGRESS_CHART_CONFIG = {
	line: {
		strokeWidth: 2,
		dot: { r: 4, strokeWidth: 2 },
		activeDot: { r: 6, strokeWidth: 0 },
	},
	area: {
		strokeWidth: 2,
		fillOpacity: 0.3,
		dot: false,
	},
	bar: {
		radius: [2, 2, 0, 0] as [number, number, number, number],
		fillOpacity: 0.8,
	},
	pie: {
		cx: "50%",
		cy: "50%",
		outerRadius: 80,
		paddingAngle: 2,
		dataKey: "value",
	},
} as const;

/**
 * ROC chart specific configurations
 */
export const ROC_CHART_CONFIG = {
	colors: {
		rocProgress: CHART_COLORS.success,
		standardProgress: CHART_COLORS.gray,
		target: CHART_COLORS.danger,
		actual: CHART_COLORS.primary,
	},
	thresholds: {
		excellent: 90,
		good: 75,
		fair: 50,
		poor: 0,
	},
} as const;

/**
 * Trend analysis chart configurations
 */
export const TREND_CHART_CONFIG = {
	velocity: {
		stroke: CHART_COLORS.accent,
		strokeDasharray: "5 5",
		yAxisId: "velocity",
	},
	completion: {
		stroke: CHART_COLORS.primary,
		strokeWidth: 3,
		yAxisId: "completion",
	},
	forecast: {
		stroke: CHART_COLORS.info,
		strokeDasharray: "3 3",
		strokeOpacity: 0.7,
	},
} as const;

/**
 * Status distribution color mapping
 */
export const STATUS_COLORS = {
	Completed: CHART_COLORS.success,
	"In Progress": CHART_COLORS.primary,
	"Not Started": CHART_COLORS.gray,
	Stalled: CHART_COLORS.danger,
	"On Hold": CHART_COLORS.warning,
	Ready: CHART_COLORS.success,
	"Nearly Ready": CHART_COLORS.accent,
	Blocked: CHART_COLORS.danger,
} as const;

/**
 * Chart formatter utilities
 */
export const CHART_FORMATTERS = {
	percentage: (value: number) => `${value.toFixed(1)}%`,
	currency: (value: number) => `$${value.toLocaleString()}`,
	number: (value: number) => value.toLocaleString(),
	date: (value: string) => new Date(value).toLocaleDateString(),
	dateTime: (value: string) => new Date(value).toLocaleString(),
	shortDate: (value: string) =>
		new Date(value).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
		}),
	duration: (days: number) => {
		if (days < 1) return "< 1 day";
		if (days === 1) return "1 day";
		if (days < 30) return `${Math.round(days)} days`;
		const months = Math.round(days / 30);
		return months === 1 ? "1 month" : `${months} months`;
	},
} as const;

/**
 * Responsive chart configuration based on screen size
 */
export function getResponsiveChartConfig(
	screenSize: "mobile" | "tablet" | "desktop" = "desktop",
) {
	const dimensions = CHART_DIMENSIONS[screenSize];

	return {
		...dimensions,
		...CHART_STYLES,
		margin: {
			top: screenSize === "mobile" ? 10 : 20,
			right: screenSize === "mobile" ? 20 : 30,
			left: screenSize === "mobile" ? 10 : 20,
			bottom: screenSize === "mobile" ? 30 : 40,
		},
	};
}

/**
 * Generate chart data transformers
 */
export const CHART_TRANSFORMERS = {
	/**
	 * Transform progress data for area breakdown chart
	 */
	areaBreakdown: (
		data: Array<{
			area: string;
			completionPercent: number;
			totalComponents: number;
		}>,
	): ChartDataPoint[] => {
		return data.map((item) => ({
			name: item.area,
			value: item.completionPercent,
			totalComponents: item.totalComponents,
		}));
	},

	/**
	 * Transform system data for system breakdown chart
	 */
	systemBreakdown: (
		data: Array<{
			system: string;
			completionPercent: number;
			totalComponents: number;
		}>,
	): ChartDataPoint[] => {
		return data.map((item) => ({
			name: item.system,
			value: item.completionPercent,
			totalComponents: item.totalComponents,
		}));
	},

	/**
	 * Transform trend data for time series chart
	 */
	trendSeries: (data: TrendDataPoint[]): ChartDataPoint[] => {
		return data.map((point) => ({
			name: CHART_FORMATTERS.shortDate(point.date),
			date: point.date,
			value: point.completionPercent,
			completionPercent: point.completionPercent,
			totalComponents: point.componentsCompleted,
		}));
	},

	/**
	 * Transform status data for pie chart
	 */
	statusDistribution: (data: Record<string, number>): ChartDataPoint[] => {
		return Object.entries(data).map(([status, count]) => ({
			name: status,
			value: count,
		}));
	},
};

/**
 * Chart animation configurations
 */
export const CHART_ANIMATIONS = {
	duration: 750,
	easing: "ease-in-out",
	delay: (index: number) => index * 50,
} as const;

/**
 * Print-specific chart configurations
 */
export const PRINT_CHART_CONFIG = {
	colors: {
		// Use high contrast colors for printing
		primary: "#000000",
		secondary: "#333333",
		accent: "#666666",
		muted: "#999999",
	},
	styles: {
		backgroundColor: "#ffffff",
		fontSize: 10,
		strokeWidth: 1,
	},
	dimensions: CHART_DIMENSIONS.print,
} as const;

/**
 * Accessibility configurations for charts
 */
export const CHART_A11Y_CONFIG = {
	ariaLabel: "Data visualization chart",
	role: "img",
	tabIndex: 0,
	keyboardNavigation: true,
	screenReaderText: {
		loading: "Chart is loading",
		noData: "No data available for chart",
		error: "Error loading chart data",
	},
} as const;

/**
 * Export configuration for charts
 */
export const CHART_EXPORT_CONFIG = {
	formats: ["png", "svg", "pdf"] as const,
	dimensions: {
		small: { width: 400, height: 300 },
		medium: { width: 800, height: 600 },
		large: { width: 1200, height: 900 },
	},
	quality: {
		low: 0.5,
		medium: 0.8,
		high: 1.0,
	},
} as const;
