"use client";

import { Badge } from "@ui/components/badge";
import { cn } from "@ui/lib";
import type { DrawingComponentCount } from "../../types";

interface ComponentCountBadgeProps {
	componentCount?: DrawingComponentCount;
	variant?: "default" | "compact" | "detailed";
	className?: string;
}

export function ComponentCountBadge({
	componentCount,
	variant = "default",
	className,
}: ComponentCountBadgeProps) {
	if (!componentCount || componentCount.total === 0) {
		return null;
	}

	const { total, notStarted, inProgress, completed, onHold } = componentCount;
	const completionPercentage = Math.round((completed / total) * 100);

	if (variant === "compact") {
		return (
			<Badge
				status="info"
				className={cn(
					"text-xs font-normal",
					completionPercentage === 100 &&
						"border-green-500 text-green-700",
					completionPercentage > 0 &&
						completionPercentage < 100 &&
						"border-blue-500 text-blue-700",
					completionPercentage === 0 &&
						"border-gray-400 text-gray-600",
					className,
				)}
			>
				{total}
			</Badge>
		);
	}

	if (variant === "detailed") {
		return (
			<div className={cn("flex items-center gap-4 text-xs", className)}>
				<div className="flex items-center gap-2">
					<span className="text-muted-foreground">Total:</span>
					<Badge status="info" className="font-normal">
						{total}
					</Badge>
				</div>
				{notStarted > 0 && (
					<div className="flex items-center gap-1">
						<div className="w-2 h-2 rounded-full bg-gray-400" />
						<span className="text-gray-600">{notStarted}</span>
					</div>
				)}
				{inProgress > 0 && (
					<div className="flex items-center gap-1">
						<div className="w-2 h-2 rounded-full bg-blue-500" />
						<span className="text-blue-700">{inProgress}</span>
					</div>
				)}
				{completed > 0 && (
					<div className="flex items-center gap-1">
						<div className="w-2 h-2 rounded-full bg-green-500" />
						<span className="text-green-700">{completed}</span>
					</div>
				)}
				{onHold > 0 && (
					<div className="flex items-center gap-1">
						<div className="w-2 h-2 rounded-full bg-amber-500" />
						<span className="text-amber-700">{onHold}</span>
					</div>
				)}
			</div>
		);
	}

	// Default variant - shows status breakdown in horizontal badges
	return (
		<div className={cn("flex items-center gap-1", className)}>
			{notStarted > 0 && (
				<Badge
					status="info"
					className="h-5 px-1.5 text-xs font-normal border-gray-300 text-gray-600 bg-gray-50"
				>
					{notStarted}
				</Badge>
			)}
			{inProgress > 0 && (
				<Badge
					status="info"
					className="h-5 px-1.5 text-xs font-normal border-blue-300 text-blue-700 bg-blue-50"
				>
					{inProgress}
				</Badge>
			)}
			{completed > 0 && (
				<Badge
					status="info"
					className="h-5 px-1.5 text-xs font-normal border-green-300 text-green-700 bg-green-50"
				>
					{completed}
				</Badge>
			)}
			{onHold > 0 && (
				<Badge
					status="info"
					className="h-5 px-1.5 text-xs font-normal border-amber-300 text-amber-700 bg-amber-50"
				>
					{onHold}
				</Badge>
			)}
		</div>
	);
}
