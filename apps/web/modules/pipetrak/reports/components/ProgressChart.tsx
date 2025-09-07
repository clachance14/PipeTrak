"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import {
	LineChart,
	Line,
	AreaChart,
	Area,
	BarChart,
	Bar,
	PieChart,
	Pie,
	Cell,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";
import {
	TrendingUp,
	TrendingDown,
	BarChart3,
	PieChart as PieChartIcon,
	LineChart as LineChartIcon,
	Download,
} from "lucide-react";
import { cn } from "@ui/lib";
import type {
	ProgressChartData,
	TrendDataPoint,
	ChartDataPoint,
} from "../types";

interface ProgressChartProps {
	data?: ProgressChartData;
	trendData?: TrendDataPoint[];
	type?: "line" | "area" | "bar" | "pie";
	title: string;
	description?: string;
	showExport?: boolean;
	className?: string;
	height?: number;
}

// Chart color palette matching PipeTrak design
const COLORS = [
	"#3b82f6", // Blue
	"#10b981", // Emerald
	"#f59e0b", // Amber
	"#ef4444", // Red
	"#8b5cf6", // Violet
	"#06b6d4", // Cyan
	"#84cc16", // Lime
	"#f97316", // Orange
];

/**
 * Flexible chart component for progress visualization
 * Supports multiple chart types and data formats
 */
export function ProgressChart({
	data,
	trendData,
	type = "line",
	title,
	description,
	showExport = false,
	className,
	height = 400,
}: ProgressChartProps) {
	const renderTrendChart = () => {
		if (!trendData || trendData.length === 0) {
			return (
				<div className="flex items-center justify-center h-64 text-muted-foreground">
					No trend data available
				</div>
			);
		}

		const chartData = trendData.map((point) => ({
			date: new Date(point.date).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
			}),
			completion: point.completionPercent,
			components: point.componentsCompleted,
			velocity: point.dailyVelocity,
		}));

		switch (type) {
			case "area":
				return (
					<ResponsiveContainer width="100%" height={height}>
						<AreaChart data={chartData}>
							<CartesianGrid
								strokeDasharray="3 3"
								className="stroke-muted"
							/>
							<XAxis
								dataKey="date"
								className="text-xs fill-muted-foreground"
								tick={{ fontSize: 12 }}
							/>
							<YAxis
								className="text-xs fill-muted-foreground"
								tick={{ fontSize: 12 }}
							/>
							<Tooltip
								contentStyle={{
									backgroundColor: "hsl(var(--background))",
									border: "1px solid hsl(var(--border))",
									borderRadius: "6px",
								}}
							/>
							<Legend />
							<Area
								type="monotone"
								dataKey="completion"
								stackId="1"
								stroke={COLORS[0]}
								fill={COLORS[0]}
								fillOpacity={0.3}
								name="Completion %"
							/>
						</AreaChart>
					</ResponsiveContainer>
				);

			case "bar":
				return (
					<ResponsiveContainer width="100%" height={height}>
						<BarChart data={chartData}>
							<CartesianGrid
								strokeDasharray="3 3"
								className="stroke-muted"
							/>
							<XAxis
								dataKey="date"
								className="text-xs fill-muted-foreground"
								tick={{ fontSize: 12 }}
							/>
							<YAxis
								className="text-xs fill-muted-foreground"
								tick={{ fontSize: 12 }}
							/>
							<Tooltip
								contentStyle={{
									backgroundColor: "hsl(var(--background))",
									border: "1px solid hsl(var(--border))",
									borderRadius: "6px",
								}}
							/>
							<Legend />
							<Bar
								dataKey="components"
								fill={COLORS[1]}
								name="Components Completed"
								radius={[2, 2, 0, 0]}
							/>
						</BarChart>
					</ResponsiveContainer>
				);

			default: // line
				return (
					<ResponsiveContainer width="100%" height={height}>
						<LineChart data={chartData}>
							<CartesianGrid
								strokeDasharray="3 3"
								className="stroke-muted"
							/>
							<XAxis
								dataKey="date"
								className="text-xs fill-muted-foreground"
								tick={{ fontSize: 12 }}
							/>
							<YAxis
								yAxisId="left"
								className="text-xs fill-muted-foreground"
								tick={{ fontSize: 12 }}
							/>
							<YAxis
								yAxisId="right"
								orientation="right"
								className="text-xs fill-muted-foreground"
								tick={{ fontSize: 12 }}
							/>
							<Tooltip
								contentStyle={{
									backgroundColor: "hsl(var(--background))",
									border: "1px solid hsl(var(--border))",
									borderRadius: "6px",
								}}
							/>
							<Legend />
							<Line
								yAxisId="left"
								type="monotone"
								dataKey="completion"
								stroke={COLORS[0]}
								strokeWidth={2}
								name="Completion %"
								dot={{ r: 4 }}
								activeDot={{ r: 6 }}
							/>
							<Line
								yAxisId="right"
								type="monotone"
								dataKey="velocity"
								stroke={COLORS[2]}
								strokeWidth={2}
								name="Daily Velocity"
								dot={{ r: 4 }}
								activeDot={{ r: 6 }}
								strokeDasharray="5 5"
							/>
						</LineChart>
					</ResponsiveContainer>
				);
		}
	};

	const renderDistributionChart = (
		chartData: ChartDataPoint[],
		_title: string,
	) => {
		if (type === "pie") {
			return (
				<ResponsiveContainer width="100%" height={height}>
					<PieChart>
						<Pie
							data={chartData}
							cx="50%"
							cy="50%"
							labelLine={false}
							label={({ name, percent }) =>
								`${name} ${(percent * 100).toFixed(0)}%`
							}
							outerRadius={80}
							fill="#8884d8"
							dataKey="value"
						>
							{chartData.map((_entry, index) => (
								<Cell
									key={`cell-${index}`}
									fill={COLORS[index % COLORS.length]}
								/>
							))}
						</Pie>
						<Tooltip />
					</PieChart>
				</ResponsiveContainer>
			);
		}

		return (
			<ResponsiveContainer width="100%" height={height}>
				<BarChart data={chartData} layout="horizontal">
					<CartesianGrid
						strokeDasharray="3 3"
						className="stroke-muted"
					/>
					<XAxis
						type="number"
						className="text-xs fill-muted-foreground"
					/>
					<YAxis
						dataKey="name"
						type="category"
						className="text-xs fill-muted-foreground"
						width={100}
					/>
					<Tooltip
						contentStyle={{
							backgroundColor: "hsl(var(--background))",
							border: "1px solid hsl(var(--border))",
							borderRadius: "6px",
						}}
					/>
					<Bar
						dataKey="value"
						fill={COLORS[0]}
						radius={[0, 4, 4, 0]}
					/>
				</BarChart>
			</ResponsiveContainer>
		);
	};

	const getTrendIcon = () => {
		if (!trendData || trendData.length < 2) return null;

		const recent = trendData.slice(-2);
		const isIncreasing =
			recent[1]?.completionPercent > recent[0]?.completionPercent;

		return isIncreasing ? (
			<TrendingUp className="h-4 w-4 text-green-600" />
		) : (
			<TrendingDown className="h-4 w-4 text-red-600" />
		);
	};

	const getChartIcon = () => {
		switch (type) {
			case "bar":
				return <BarChart3 className="h-4 w-4" />;
			case "pie":
				return <PieChartIcon className="h-4 w-4" />;
			default:
				return <LineChartIcon className="h-4 w-4" />;
		}
	};

	return (
		<Card className={cn("w-full", className)}>
			<CardHeader className="pb-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						{getChartIcon()}
						<CardTitle className="text-lg">{title}</CardTitle>
						{getTrendIcon()}
					</div>
					<div className="flex items-center gap-2">
						<Badge status="info" className="text-xs">
							{type.charAt(0).toUpperCase() + type.slice(1)} Chart
						</Badge>
						{showExport && (
							<Button variant="ghost" size="sm">
								<Download className="h-4 w-4" />
							</Button>
						)}
					</div>
				</div>
				{description && (
					<p className="text-sm text-muted-foreground">
						{description}
					</p>
				)}
			</CardHeader>

			<CardContent>
				{trendData ? (
					renderTrendChart()
				) : data ? (
					<Tabs defaultValue="areas" className="w-full">
						<TabsList className="grid w-full grid-cols-3">
							<TabsTrigger value="areas">By Area</TabsTrigger>
							<TabsTrigger value="systems">By System</TabsTrigger>
							<TabsTrigger value="status">By Status</TabsTrigger>
						</TabsList>

						<TabsContent value="areas" className="mt-4">
							{renderDistributionChart(
								data.areaDistribution,
								"Area Distribution",
							)}
						</TabsContent>

						<TabsContent value="systems" className="mt-4">
							{renderDistributionChart(
								data.systemDistribution,
								"System Distribution",
							)}
						</TabsContent>

						<TabsContent value="status" className="mt-4">
							{renderDistributionChart(
								data.statusDistribution,
								"Status Distribution",
							)}
						</TabsContent>
					</Tabs>
				) : (
					<div className="flex items-center justify-center h-64 text-muted-foreground">
						No data available for visualization
					</div>
				)}
			</CardContent>
		</Card>
	);
}
