"use client";

import { useState } from "react";
import { Button } from "@ui/components/button";
import { Progress } from "@ui/components/progress";
import { Badge } from "@ui/components/badge";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ui/components/popover";
import { MilestoneWorkflowRenderer } from "../core/MilestoneWorkflowRenderer";
import { useMilestoneUpdateEngine } from "../core/MilestoneUpdateEngine";
import {
	CheckCircle2,
	Clock,
	AlertCircle,
	ChevronRight,
	MoreVertical,
	Loader2,
} from "lucide-react";
import { cn } from "@ui/lib";
import type {
	ComponentWithMilestones,
	ComponentMilestone,
	WorkflowType,
} from "../../../types";

interface TableMilestoneColumnProps {
	component: ComponentWithMilestones;
	className?: string;
}

interface MilestoneQuickEditProps {
	milestone: ComponentMilestone;
	component: ComponentWithMilestones;
	isLocked?: boolean;
}

function MilestoneQuickEdit({
	milestone,
	component,
	isLocked = false,
}: MilestoneQuickEditProps) {
	const { updateMilestone, hasPendingUpdates, getOperationStatus } =
		useMilestoneUpdateEngine();
	const [isOpen, setIsOpen] = useState(false);

	const isPending = hasPendingUpdates(milestone.id);
	const status = getOperationStatus(milestone.id);

	const handleUpdate = async (value: boolean | number) => {
		await updateMilestone(
			milestone.id,
			component.id,
			milestone.milestoneName,
			component.workflowType,
			value,
		);
		setIsOpen(false);
	};

	const getStatusIndicator = () => {
		if (status === "pending") {
			return <Loader2 className="h-3 w-3 animate-spin text-blue-600" />;
		}

		if (milestone.isCompleted) {
			return <CheckCircle2 className="h-3 w-3 text-fieldComplete" />;
		}

		const completionPercent = getCompletionPercent(
			milestone,
			component.workflowType,
		);
		if (completionPercent > 0) {
			return <Clock className="h-3 w-3 text-blue-600" />;
		}

		return <AlertCircle className="h-3 w-3 text-fieldPending" />;
	};

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className={cn(
						"h-6 px-2 text-xs justify-start gap-2",
						isPending && "bg-blue-50",
						isLocked && "opacity-50 cursor-not-allowed",
					)}
					disabled={isLocked}
				>
					{getStatusIndicator()}
					<span className="truncate max-w-20">
						{milestone.milestoneName}
					</span>
					<ChevronRight className="h-3 w-3 ml-auto" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80 p-4" align="start">
				<MilestoneWorkflowRenderer
					milestone={milestone}
					workflowType={component.workflowType}
					isLocked={isLocked}
					isLoading={isPending}
					touchTargetSize={44} // Smaller for inline editing
					onUpdate={handleUpdate}
					className="space-y-3"
				/>
			</PopoverContent>
		</Popover>
	);
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

export function TableMilestoneColumn({
	component,
	className,
}: TableMilestoneColumnProps) {
	const { hasPendingUpdates } = useMilestoneUpdateEngine();
	const [showAllMilestones, setShowAllMilestones] = useState(false);

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

	// Show first 2 milestones by default, expand to show all
	const visibleMilestones = showAllMilestones
		? component.milestones
		: component.milestones.slice(0, 2);
	const hasMoreMilestones = component.milestones.length > 2;

	return (
		<div className={cn("space-y-2 min-w-[200px]", className)}>
			{/* Overall progress bar */}
			<div className="space-y-1">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div className="text-sm font-medium">
							{completedCount}/{totalCount}
						</div>
						{hasAnyPending && (
							<Badge status="success" className="text-xs">
								<Loader2 className="h-3 w-3 mr-1 animate-spin" />
								Updating
							</Badge>
						)}
					</div>
					<span className="text-xs text-muted-foreground">
						{overallProgress}%
					</span>
				</div>
				<Progress
					value={overallProgress}
					className={cn(
						"h-2 transition-all duration-300",
						hasAnyPending && "animate-pulse",
					)}
				/>
			</div>

			{/* Individual milestones */}
			<div className="space-y-1">
				{visibleMilestones.map((milestone, index) => {
					const isLocked =
						index > 0 &&
						!component.milestones![index - 1].isCompleted;

					return (
						<MilestoneQuickEdit
							key={milestone.id}
							milestone={milestone}
							component={component}
							isLocked={isLocked}
						/>
					);
				})}

				{hasMoreMilestones && !showAllMilestones && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setShowAllMilestones(true)}
						className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
					>
						<MoreVertical className="h-3 w-3 mr-1" />+
						{component.milestones.length - 2} more
					</Button>
				)}

				{showAllMilestones && hasMoreMilestones && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setShowAllMilestones(false)}
						className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
					>
						Show less
					</Button>
				)}
			</div>
		</div>
	);
}
