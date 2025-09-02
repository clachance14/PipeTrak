import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Get color classes for completion percentage
 * Red (0-30%) → Yellow (31-70%) → Green (71-100%)
 */
export function getCompletionColorClasses(percentage: number): {
	bg: string;
	text: string;
	border: string;
} {
	if (percentage >= 71) {
		return {
			bg: "bg-green-500/20",
			text: "text-green-700",
			border: "border-green-300",
		};
	}
	if (percentage >= 31) {
		return {
			bg: "bg-yellow-500/20",
			text: "text-yellow-700",
			border: "border-yellow-300",
		};
	}
	return {
		bg: "bg-red-500/20",
		text: "text-red-700",
		border: "border-red-300",
	};
}

/**
 * Get SVG fill color for completion percentage heatmap
 */
export function getHeatmapFillColor(percentage: number): string {
	if (percentage >= 71) {
		return "#10b981"; // green-500
	}
	if (percentage >= 31) {
		return "#f59e0b"; // yellow-500
	}
	return "#ef4444"; // red-500
}

/**
 * Get opacity for heatmap based on completion percentage
 */
export function getHeatmapOpacity(percentage: number): number {
	// Map 0-100% to 0.2-1.0 opacity for better visibility
	return Math.max(0.2, percentage / 100);
}

/**
 * Format completion text for display
 */
export function formatCompletionText(completed: number, total: number): string {
	const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
	return `${percentage}% (${completed}/${total})`;
}

/**
 * Format timestamp to relative time
 */
export function formatRelativeTime(timestamp: number): string {
	const now = Date.now();
	const diff = now - timestamp; // Already in milliseconds

	const minutes = Math.floor(diff / (1000 * 60));
	const hours = Math.floor(diff / (1000 * 60 * 60));
	const days = Math.floor(diff / (1000 * 60 * 60 * 24));

	if (days > 0) {
		return `${days} day${days === 1 ? "" : "s"} ago`;
	}
	if (hours > 0) {
		return `${hours} hour${hours === 1 ? "" : "s"} ago`;
	}
	if (minutes > 0) {
		return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
	}
	return "Just now";
}

/**
 * Format activity item for display
 */
export function formatActivityDescription(
	userName: string,
	activityType: string,
	componentId: string,
	milestoneName?: string | null,
): string {
	const action =
		activityType === "milestone_completed" ? "completed" : "updated";
	const milestone = milestoneName ? ` milestone (${milestoneName})` : "";
	return `${userName} ${action} ${componentId}${milestone}`;
}

/**
 * Calculate total stalled components from stalled counts object
 */
export function getTotalStalledCount(stalledCounts: {
	stalled7Days: number;
	stalled14Days: number;
	stalled21Days: number;
}): number {
	return (
		stalledCounts.stalled7Days +
		stalledCounts.stalled14Days +
		stalledCounts.stalled21Days
	);
}

/**
 * Build hierarchical tree from flat drawing array
 */
export function buildDrawingTree(
	drawings: Array<{
		drawingId: string;
		drawingNumber: string;
		drawingName: string | null;
		parentDrawingId: string | null;
		componentCount: number;
		completedCount: number;
		completionPercent: number;
		stalledCount: number;
	}>,
): Array<any> {
	const drawingMap = new Map();
	const rootDrawings: any[] = [];

	// First pass: create drawing objects
	drawings.forEach((drawing) => {
		drawingMap.set(drawing.drawingId, {
			...drawing,
			children: [],
		});
	});

	// Second pass: build hierarchy
	drawings.forEach((drawing) => {
		const drawingNode = drawingMap.get(drawing.drawingId);

		if (drawing.parentDrawingId) {
			const parent = drawingMap.get(drawing.parentDrawingId);
			if (parent) {
				parent.children.push(drawingNode);
			} else {
				// Parent not found, treat as root
				rootDrawings.push(drawingNode);
			}
		} else {
			rootDrawings.push(drawingNode);
		}
	});

	return rootDrawings;
}

/**
 * Generate SVG path for sparkline
 */
export function generateSparklinePath(
	data: number[],
	width: number,
	height: number,
	padding = 2,
): string {
	if (data.length === 0) return "";

	const maxValue = Math.max(...data);
	const minValue = Math.min(...data);
	const range = maxValue - minValue || 1;

	const stepX = (width - 2 * padding) / Math.max(data.length - 1, 1);

	const points = data.map((value, index) => {
		const x = padding + index * stepX;
		const y =
			height -
			padding -
			((value - minValue) / range) * (height - 2 * padding);
		return `${x},${y}`;
	});

	return `M ${points.join(" L ")}`;
}

/**
 * Debounce function for filter inputs
 */
export function debounce<T extends (...args: any[]) => void>(
	func: T,
	delay: number,
): (...args: Parameters<T>) => void {
	let timeoutId: NodeJS.Timeout;

	return (...args: Parameters<T>) => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => func(...args), delay);
	};
}

/**
 * Get unique areas from matrix data
 */
export function getUniqueAreas(matrixData: Array<{ area: string }>): string[] {
	return [...new Set(matrixData.map((item) => item.area))].sort();
}

/**
 * Get unique systems from matrix data
 */
export function getUniqueSystems(
	matrixData: Array<{ system: string }>,
): string[] {
	return [...new Set(matrixData.map((item) => item.system))].sort();
}
