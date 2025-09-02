import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { Progress } from "@ui/components/progress";
import {
	TrendingUp,
	TrendingDown,
	Minus,
	Target,
	Award,
	AlertCircle,
	Info,
} from "lucide-react";
import { cn } from "@ui/lib";
import type { ROCWeightedProgress } from "../types";

interface ROCDisplayProps {
	rocData?: ROCWeightedProgress;
	isLoading?: boolean;
	showBreakdowns?: boolean;
	className?: string;
}

/**
 * ROC (Rate of Completion) percentage display with visual indicators
 * Shows weighted progress calculations and breakdowns
 */
export function ROCDisplay({
	rocData,
	isLoading = false,
	showBreakdowns = true,
	className,
}: ROCDisplayProps) {
	if (isLoading) {
		return (
			<Card className={cn("animate-pulse", className)}>
				<CardHeader className="pb-4">
					<div className="flex items-center justify-between">
						<div className="h-6 bg-gray-300 rounded w-32" />
						<div className="h-6 bg-gray-200 rounded w-20" />
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="h-12 bg-gray-300 rounded w-24" />
					<div className="h-2 bg-gray-200 rounded w-full" />
					<div className="grid grid-cols-2 gap-4">
						<div className="h-16 bg-gray-200 rounded" />
						<div className="h-16 bg-gray-200 rounded" />
					</div>
				</CardContent>
			</Card>
		);
	}

	if (!rocData) {
		return (
			<Card className={cn("border-dashed", className)}>
				<CardContent className="flex items-center justify-center py-8">
					<div className="text-center text-muted-foreground">
						<AlertCircle className="h-8 w-8 mx-auto mb-2" />
						<p>ROC data not available</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	const rocPercentage = Math.round(rocData.overallROCProgress * 100) / 100;

	// Determine ROC status and color
	const getROCStatus = (percentage: number) => {
		if (percentage >= 90)
			return {
				status: "excellent",
				color: "text-green-600",
				bg: "bg-green-50",
				border: "border-green-200",
			};
		if (percentage >= 75)
			return {
				status: "good",
				color: "text-blue-600",
				bg: "bg-blue-50",
				border: "border-blue-200",
			};
		if (percentage >= 50)
			return {
				status: "fair",
				color: "text-yellow-600",
				bg: "bg-yellow-50",
				border: "border-yellow-200",
			};
		return {
			status: "needs attention",
			color: "text-red-600",
			bg: "bg-red-50",
			border: "border-red-200",
		};
	};

	const rocStatus = getROCStatus(rocPercentage);

	// Get trend icon (would need historical data in real implementation)
	const getTrendIcon = () => {
		// Placeholder logic - in real implementation, compare with previous period
		if (rocPercentage >= 75)
			return <TrendingUp className="h-4 w-4 text-green-600" />;
		if (rocPercentage >= 50)
			return <Minus className="h-4 w-4 text-yellow-600" />;
		return <TrendingDown className="h-4 w-4 text-red-600" />;
	};

	return (
		<Card className={cn(`border-l-4 ${rocStatus.border}`, className)}>
			<CardHeader className="pb-4">
				<div className="flex items-center justify-between">
					<CardTitle className="text-lg font-bold flex items-center gap-2">
						<Target className="h-5 w-5 text-blue-600" />
						ROC Weighted Progress
						{getTrendIcon()}
					</CardTitle>
					<Badge
						status="success"
						className={cn(
							"text-xs font-medium",
							rocStatus.color,
							rocStatus.bg,
						)}
					>
						{rocStatus.status}
					</Badge>
				</div>
			</CardHeader>

			<CardContent className="space-y-6">
				{/* Main ROC Percentage */}
				<div className="text-center">
					<div
						className={cn(
							"text-4xl font-bold mb-2",
							rocStatus.color,
						)}
					>
						{rocPercentage.toFixed(1)}%
					</div>
					<Progress value={rocPercentage} className="h-3 mb-2" />
					<div className="text-sm text-muted-foreground">
						{rocData.completedROCWeight.toLocaleString()} of{" "}
						{rocData.totalROCWeight.toLocaleString()} ROC weight
						completed
					</div>
				</div>

				{/* ROC Metrics */}
				<div className="grid grid-cols-2 gap-4">
					<div className="text-center p-3 bg-gray-50 rounded-lg">
						<div className="text-lg font-semibold text-gray-900">
							{rocData.totalROCWeight.toLocaleString()}
						</div>
						<div className="text-xs text-muted-foreground">
							Total ROC Weight
						</div>
					</div>
					<div className="text-center p-3 bg-green-50 rounded-lg">
						<div className="text-lg font-semibold text-green-700">
							{rocData.completedROCWeight.toLocaleString()}
						</div>
						<div className="text-xs text-muted-foreground">
							Completed Weight
						</div>
					</div>
				</div>

				{/* ROC Explanation */}
				<div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
					<div className="flex items-start gap-2">
						<Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
						<div className="text-xs text-blue-800">
							<p className="font-medium mb-1">
								About ROC Weighted Progress
							</p>
							<p>
								ROC (Rate of Completion) weighting considers
								component complexity, criticality, and
								installation difficulty to provide a more
								accurate representation of actual project
								completion than simple component counts.
							</p>
						</div>
					</div>
				</div>

				{/* Area and System Breakdowns */}
				{showBreakdowns && (
					<div className="space-y-4">
						{/* Top Areas by ROC Progress */}
						{rocData.areaBreakdowns.length > 0 && (
							<div>
								<h4 className="text-sm font-medium mb-2 flex items-center gap-1">
									<Award className="h-4 w-4" />
									Top Areas by ROC Progress
								</h4>
								<div className="space-y-2">
									{rocData.areaBreakdowns
										.sort(
											(a, b) =>
												b.rocProgress - a.rocProgress,
										)
										.slice(0, 3)
										.map((area, index) => (
											<div
												key={area.area}
												className="flex items-center justify-between p-2 bg-gray-50 rounded"
											>
												<div className="flex items-center gap-2">
													<Badge
														status="info"
														className="text-xs w-6 h-6 p-0 justify-center"
													>
														{index + 1}
													</Badge>
													<span className="text-sm font-medium">
														{area.area}
													</span>
													<span className="text-xs text-muted-foreground">
														({area.componentCount}{" "}
														components)
													</span>
												</div>
												<div className="text-right">
													<div className="text-sm font-semibold">
														{area.rocProgress.toFixed(
															1,
														)}
														%
													</div>
													<div className="text-xs text-muted-foreground">
														{area.completedWeight} /{" "}
														{area.totalWeight}
													</div>
												</div>
											</div>
										))}
								</div>
							</div>
						)}

						{/* Top Systems by ROC Progress */}
						{rocData.systemBreakdowns.length > 0 && (
							<div>
								<h4 className="text-sm font-medium mb-2 flex items-center gap-1">
									<Award className="h-4 w-4" />
									Top Systems by ROC Progress
								</h4>
								<div className="space-y-2">
									{rocData.systemBreakdowns
										.sort(
											(a, b) =>
												b.rocProgress - a.rocProgress,
										)
										.slice(0, 3)
										.map((system, index) => (
											<div
												key={system.system}
												className="flex items-center justify-between p-2 bg-gray-50 rounded"
											>
												<div className="flex items-center gap-2">
													<Badge
														status="info"
														className="text-xs w-6 h-6 p-0 justify-center"
													>
														{index + 1}
													</Badge>
													<span className="text-sm font-medium">
														{system.system}
													</span>
													<span className="text-xs text-muted-foreground">
														({system.componentCount}{" "}
														components)
													</span>
												</div>
												<div className="text-right">
													<div className="text-sm font-semibold">
														{system.rocProgress.toFixed(
															1,
														)}
														%
													</div>
													<div className="text-xs text-muted-foreground">
														{system.completedWeight}{" "}
														/ {system.totalWeight}
													</div>
												</div>
											</div>
										))}
								</div>
							</div>
						)}
					</div>
				)}

				{/* Generation Timestamp */}
				<div className="text-xs text-muted-foreground text-center pt-2 border-t">
					Generated on{" "}
					{new Date(rocData.generatedAt).toLocaleString()}
				</div>
			</CardContent>
		</Card>
	);
}
