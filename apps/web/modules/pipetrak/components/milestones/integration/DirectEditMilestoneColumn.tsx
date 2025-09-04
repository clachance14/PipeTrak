"use client";

import { useState } from "react";
import { Progress } from "@ui/components/progress";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { MilestoneWorkflowRenderer } from "../core/MilestoneWorkflowRenderer";
import { useMilestoneUpdateEngine } from "../core/MilestoneUpdateEngine";
import {
	CheckCircle22,
	Clock,
	AlertCircle,
	Loader2,
	ChevronDown,
	ChevronRight,
} from "lucide-react";
import { cn } from "@ui/lib";
import type {
	ComponentWithMilestones,
	ComponentMilestone,
	WorkflowType,
} from "../../../types";

interface DirectEditMilestoneColumnProps {
	component: ComponentWithMilestones;
	className?: string;
	expandedByDefault?: boolean;
}

function getCompletionPercent(
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

function calculateOverallProgress(
	milestones: ComponentMilestone[],
	workflowType: WorkflowType,
): number {
	if (!milestones || milestones.length === 0) return 0;

	const totalProgress = milestones.reduce((sum, milestone) => {
		const weight = milestone.creditWeight || 1;
		const progress = getCompletionPercent(milestone, workflowType);
		return sum + progress * weight;
	}, 0);

	const totalWeight = milestones.reduce(
		(sum, milestone) => sum + (milestone.creditWeight || 1),
		0,
	);

	return totalWeight > 0 ? Math.round(totalProgress / totalWeight) : 0;
}

export function DirectEditMilestoneColumn({
	component,
	className,
	expandedByDefault = false,
}: DirectEditMilestoneColumnProps) {
	const { updateMilestone, hasPendingUpdates, getOperationStatus } =
		useMilestoneUpdateEngine();
	const [isExpanded, setIsExpanded] = useState(expandedByDefault);

	if (!component.milestones || component.milestones.length === 0) {
		return (
			<div
				className={cn(
					"flex items-center text-muted-foreground",
					className,
				)}
			>
				<AlertCircle className="h-4 w-4 mr-2" />
				<span className="text-sm">No milestones</span>
			</div>
		);
	}

	const overallProgress = calculateOverallProgress(
		component.milestones,
		component.workflowType,
	);
	const hasAnyPending = component.milestones.some((m) =>
		hasPendingUpdates(m.id),
	);
	const completedCount = component.milestones.filter(
		(m) => m.isCompleted,
	).length;
	const totalCount = component.milestones.length;

	const handleMilestoneUpdate = async (
		milestone: ComponentMilestone,
		value: boolean | number,
	) => {
		await updateMilestone(
			milestone.id,
			component.id,
			milestone.milestoneName,
			component.workflowType,
			value,
		);
	};

	const getStatusIcon = (milestone: ComponentMilestone) => {
		const status = getOperationStatus(milestone.id);

		if (status === "pending") {
			return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
		}

		if (milestone.isCompleted) {
			return <CheckCircle22 className="h-4 w-4 text-fieldComplete" />;
		}

		const completionPercent = getCompletionPercent(
			milestone,
			component.workflowType,
		);
		if (completionPercent > 0) {
			return <Clock className="h-4 w-4 text-blue-600" />;
		}

		return <AlertCircle className="h-4 w-4 text-fieldPending" />;
	};

	return (
		<div className={cn("space-y-3", className)}>
			{/* Overall progress bar with expand/collapse */}
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setIsExpanded(!isExpanded)}
						className="h-6 px-1 -ml-1"
					>
						{isExpanded ? (
							<ChevronDown className="h-4 w-4" />
						) : (
							<ChevronRight className="h-4 w-4" />
						)}
						<span className="ml-1 text-sm font-medium">
							{completedCount}/{totalCount}
						</span>
					</Button>

					<div className="flex items-center gap-2">
						{hasAnyPending && (
							<Badge status="info" className="text-xs">
								<Loader2 className="h-3 w-3 mr-1 animate-spin" />
								Updating
							</Badge>
						)}
						<span className="text-xs text-muted-foreground">
							{overallProgress}%
						</span>
					</div>
				</div>

				<Progress
					value={overallProgress}
					className={cn(
						"h-2 transition-all duration-300",
						hasAnyPending && "animate-pulse",
					)}
				/>
			</div>

			{/* Expanded milestone list with direct editing */}
			{isExpanded && (
				<div className="space-y-2 pl-2">
					{component.milestones.map((milestone, index) => {
						const isLocked =
							index > 0 &&
							!component.milestones![index - 1].isCompleted;
						const isPending = hasPendingUpdates(milestone.id);

						return (
							<div
								key={milestone.id}
								className={cn(
									"flex items-center gap-3 min-h-[36px] group",
									isPending && "bg-blue-50 rounded px-2",
									isLocked && "opacity-50",
								)}
							>
								{/* Status Icon */}
								<div className="flex-shrink-0">
									{getStatusIcon(milestone)}
								</div>

								{/* Milestone Name */}
								<div className="flex-1 min-w-0">
									<p
										className={cn(
											"text-sm truncate",
											milestone.isCompleted &&
												"line-through text-muted-foreground",
										)}
									>
										{milestone.milestoneName}
									</p>
								</div>

								{/* Direct Edit Control */}
								<div className="flex-shrink-0">
									<MilestoneWorkflowRenderer
										milestone={milestone}
										workflowType={component.workflowType}
										isLocked={isLocked}
										isLoading={isPending}
										touchTargetSize={36} // Smaller for inline
										onUpdate={(value) =>
											handleMilestoneUpdate(
												milestone,
												value,
											)
										}
										className="inline-flex"
									/>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
