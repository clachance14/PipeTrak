"use client";

import { Badge } from "@ui/components/badge";
import { ScrollArea, ScrollBar } from "@ui/components/scroll-area";
import { TrendingUp, Package, AlertTriangle } from "lucide-react";
import type { DashboardMetrics, TestPackageReadiness } from "../types";

interface QuickStatsChipsProps {
	metrics: DashboardMetrics | null;
	testPackages: TestPackageReadiness | null;
}

/**
 * Quick Stats Chips - Horizontal scrollable chip list for tablet/mobile
 * Displays condensed metrics: Overall %, Components, Stalled (muted)
 */
export function QuickStatsChips({
	metrics,
	testPackages,
}: QuickStatsChipsProps) {
	if (!metrics) {
		return (
			<div className="flex gap-2 overflow-hidden">
				<div className="animate-pulse">
					<Badge status="info" className="h-8 w-20" />
				</div>
				<div className="animate-pulse">
					<Badge status="info" className="h-8 w-24" />
				</div>
				<div className="animate-pulse">
					<Badge status="info" className="h-8 w-16" />
				</div>
			</div>
		);
	}

	const readyPackages =
		testPackages?.testPackages.filter((pkg) => pkg.isReady).length || 0;

	const statsChips = [
		{
			id: "overall",
			icon: TrendingUp,
			label: "Overall",
			value: `${Math.round(metrics.overallCompletionPercent)}%`,
			status: "info" as const,
			primary: true,
		},
		{
			id: "components",
			icon: Package,
			label: "Components",
			value: `${metrics.completedComponents.toLocaleString()}/${metrics.totalComponents.toLocaleString()}`,
			status: "info" as const,
			primary: true,
		},
		{
			id: "ready-packages",
			icon: Package,
			label: "Ready",
			value: `${readyPackages} pkgs`,
			status: "info" as const,
			primary: true,
		},
		{
			id: "stalled",
			icon: AlertTriangle,
			label: "Stalled",
			value: `${metrics.stalledComponents.stalled7Days}`,
			status: "info" as const,
			primary: false, // Secondary metric
			muted: true,
		},
	];

	return (
		<ScrollArea className="w-full whitespace-nowrap">
			<div className="flex gap-2 pb-2">
				{statsChips.map((chip) => {
					const Icon = chip.icon;
					return (
						<Badge
							key={chip.id}
							status={chip.status}
							className={`
                flex items-center gap-1.5 px-3 py-2 text-sm font-medium
                ${chip.primary ? "h-9" : "h-8 text-xs"}
                ${chip.muted ? "text-muted-foreground bg-orange-50 border-orange-200" : ""}
                ${chip.id === "overall" ? "bg-primary text-primary-foreground" : ""}
                whitespace-nowrap shrink-0
              `}
						>
							<Icon
								className={`${chip.primary ? "h-4 w-4" : "h-3 w-3"}`}
							/>
							<span className="hidden sm:inline">
								{chip.label}:
							</span>
							<span className="font-semibold">{chip.value}</span>
						</Badge>
					);
				})}
			</div>
			<ScrollBar orientation="horizontal" />
		</ScrollArea>
	);
}
