"use client";

import { Card, CardContent } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { Progress } from "@ui/components/progress";
import {
	CheckCircle2,
	Clock,
	AlertCircle,
	Lock,
	Loader2,
	ChevronRight,
} from "lucide-react";
import { cn } from "@ui/lib";
import type {
	ComponentMilestone,
	ComponentWithMilestones,
	WorkflowType,
} from "../../../types";

interface TouchMilestoneCardProps {
	milestone: ComponentMilestone;
	component: ComponentWithMilestones;
	isLocked?: boolean;
	isPending?: boolean;
	status?: "pending" | "success" | "error" | null;
	onClick?: () => void;
	className?: string;
	touchTargetSize?: number;
}

export function TouchMilestoneCard({
	milestone,
	component,
	isLocked = false,
	isPending = false,
	status = null,
	onClick,
	className,
	touchTargetSize = 52,
}: TouchMilestoneCardProps) {
	const getStatusIcon = () => {
		if (isLocked) {
			return <Lock className="h-5 w-5 text-muted-foreground" />;
		}

		if (isPending || status === "pending") {
			return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
		}

		const completionPercent = getCompletionPercent(
			milestone,
			component.workflowType,
		);

		if (completionPercent === 100) {
			return <CheckCircle2 className="h-5 w-5 text-fieldComplete" />;
		}
		if (completionPercent > 0) {
			return <Clock className="h-5 w-5 text-blue-600" />;
		}
		return <AlertCircle className="h-5 w-5 text-fieldPending" />;
	};

	const getStatusColor = () => {
		if (isLocked) return "border-muted bg-muted/10";
		if (isPending || status === "pending")
			return "border-blue-300 bg-blue-50";
		if (status === "error") return "border-red-300 bg-red-50";

		const completionPercent = getCompletionPercent(
			milestone,
			component.workflowType,
		);

		if (completionPercent === 100) return "border-green-300 bg-green-50";
		if (completionPercent > 0) return "border-blue-200 bg-blue-50";
		return "border-amber-200 bg-amber-50";
	};

	const formatValue = (
		workflowType: WorkflowType,
		milestone: ComponentMilestone,
	) => {
		switch (workflowType) {
			case "MILESTONE_DISCRETE":
				return milestone.isCompleted ? "Complete" : "Incomplete";

			case "MILESTONE_PERCENTAGE": {
				const percent = milestone.percentageComplete || 0;
				return `${percent}%`;
			}

			case "MILESTONE_QUANTITY": {
				const completed = milestone.quantityComplete || 0;
				const total = milestone.quantityTotal || 0;
				const unit = milestone.unit || "units";
				return `${completed}/${total} ${unit}`;
			}

			default:
				return "Unknown";
		}
	};

	return (
		<Card
			className={cn(
				"transition-all duration-200 cursor-pointer hover:shadow-md active:scale-[0.98]",
				getStatusColor(),
				isLocked && "cursor-not-allowed opacity-60",
				className,
			)}
			style={{ minHeight: `${touchTargetSize}px` }}
			onClick={!isLocked ? onClick : undefined}
		>
			<CardContent className="p-4">
				<div className="flex items-center gap-3">
					{/* Status icon */}
					<div className="flex-shrink-0">{getStatusIcon()}</div>

					{/* Content */}
					<div className="flex-1 min-w-0">
						<div className="flex items-start justify-between gap-2">
							<div className="flex-1 min-w-0">
								<h4 className="font-medium text-sm leading-tight truncate">
									{milestone.milestoneName}
								</h4>

								{/* Milestone metadata */}
								<div className="flex items-center gap-2 mt-1 flex-wrap">
									{milestone.sequenceNumber && (
										<Badge
											status="info"
											className="text-xs"
										>
											Step {milestone.sequenceNumber}
										</Badge>
									)}
									{milestone.creditWeight && (
										<Badge
											status="success"
											className="text-xs"
										>
											{milestone.creditWeight} credits
										</Badge>
									)}
								</div>
							</div>

							{/* Value and chevron */}
							<div className="flex items-center gap-2 flex-shrink-0">
								<div className="text-right">
									<div className="text-sm font-medium">
										{formatValue(
											component.workflowType,
											milestone,
										)}
									</div>
									{component.workflowType !==
										"MILESTONE_DISCRETE" && (
										<div className="text-xs text-muted-foreground">
											{getCompletionPercent(
												milestone,
												component.workflowType,
											)}
											%
										</div>
									)}
								</div>
								<ChevronRight className="h-4 w-4 text-muted-foreground" />
							</div>
						</div>

						{/* Progress bar for non-discrete milestones */}
						{component.workflowType !== "MILESTONE_DISCRETE" && (
							<div className="mt-2">
								<Progress
									value={getCompletionPercent(
										milestone,
										component.workflowType,
									)}
									className="h-1.5"
								/>
							</div>
						)}

						{/* Completion info */}
						{milestone.completedAt && milestone.isCompleted && (
							<div className="text-xs text-muted-foreground mt-2">
								Completed{" "}
								{new Date(
									milestone.completedAt,
								).toLocaleDateString()}
								{milestone.completer && (
									<>
										{" "}
										by{" "}
										{milestone.completer.name ||
											milestone.completer.email}
									</>
								)}
							</div>
						)}

						{/* Lock reason */}
						{isLocked && (
							<div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
								<Lock className="h-3 w-3" />
								Previous milestone must be completed first
							</div>
						)}

						{/* Error state */}
						{status === "error" && (
							<div className="text-xs text-red-600 mt-2">
								Update failed. Tap to retry.
							</div>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export function getCompletionPercent(
	milestone: ComponentMilestone,
	workflowType: WorkflowType,
): number {
	switch (workflowType) {
		case "MILESTONE_DISCRETE":
			return milestone.isCompleted ? 100 : 0;
		case "MILESTONE_PERCENTAGE":
			return milestone.percentageComplete || 0;
		case "MILESTONE_QUANTITY": {
			const total = milestone.quantityTotal || 0;
			const completed = milestone.quantityComplete || 0;
			return total > 0 ? Math.round((completed / total) * 100) : 0;
		}
		default:
			return 0;
	}
}
