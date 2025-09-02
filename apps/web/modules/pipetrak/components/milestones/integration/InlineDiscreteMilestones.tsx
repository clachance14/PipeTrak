"use client";

import { useState, useMemo } from "react";
import { Button } from "@ui/components/button";
import { Progress } from "@ui/components/progress";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	TooltipProvider,
} from "@ui/components/tooltip";
import {
	CheckCircle2,
	Circle,
	Lock,
	Loader2,
	AlertTriangle,
} from "lucide-react";
import { cn } from "@ui/lib";
import { useMilestoneUpdateEngine } from "../core/MilestoneUpdateEngine";
import {
	getMilestoneAbbreviation,
	getMilestoneTooltip,
} from "../../../utils/milestone-abbreviations";
import { WeldMilestoneModal } from "../WeldMilestoneModal";
import type {
	ComponentWithMilestones,
	ComponentMilestone,
} from "../../../types";

interface InlineDiscreteMilestonesProps {
	component: ComponentWithMilestones;
	className?: string;
	onMilestoneUpdate?: (milestoneId: string, completed: boolean) => void;
}

interface MilestonePillProps {
	milestone: ComponentMilestone;
	isLocked: boolean;
	isPending: boolean;
	onToggle: (completed: boolean) => Promise<void>;
	className?: string;
}

function MilestonePill({
	milestone,
	isLocked,
	isPending,
	onToggle,
	className,
}: MilestonePillProps) {
	const [isUpdating, setIsUpdating] = useState(false);
	const abbreviation = getMilestoneAbbreviation(milestone.milestoneName);
	const tooltip = getMilestoneTooltip(
		milestone.milestoneName,
		milestone.isCompleted,
	);

	const handleClick = async () => {
		if (isLocked || isUpdating || isPending) return;

		setIsUpdating(true);
		try {
			await onToggle(!milestone.isCompleted);
		} catch (error) {
			console.error("Failed to update milestone:", error);
		} finally {
			setIsUpdating(false);
		}
	};

	const getButtonVariant = () => {
		if (isLocked) return "secondary";
		if (milestone.isCompleted) return "default";
		return "outline";
	};

	const getButtonStyles = () => {
		if (isLocked) {
			return "bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-100 cursor-not-allowed";
		}
		if (milestone.isCompleted) {
			return "bg-green-500 border-green-500 text-white hover:bg-green-600";
		}
		return "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200";
	};

	const renderIcon = () => {
		if (isUpdating || isPending) {
			return <Loader2 className="h-3 w-3 animate-spin" />;
		}
		if (isLocked) {
			return <Lock className="h-3 w-3" />;
		}
		if (milestone.isCompleted) {
			return <CheckCircle2 className="h-3 w-3" />;
		}
		return <Circle className="h-3 w-3" />;
	};

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant={getButtonVariant()}
						size="sm"
						onClick={handleClick}
						disabled={isLocked || isUpdating || isPending}
						className={cn(
							"h-8 px-2 min-w-[48px] text-xs font-medium transition-all duration-150",
							"flex items-center gap-1",
							getButtonStyles(),
							isUpdating && "animate-pulse",
							className,
						)}
						aria-label={tooltip}
						role="switch"
						aria-checked={milestone.isCompleted}
					>
						{renderIcon()}
						<span className="hidden sm:inline">{abbreviation}</span>
					</Button>
				</TooltipTrigger>
				<TooltipContent side="top" className="text-xs">
					<div className="text-center">
						<div className="font-medium">
							{milestone.milestoneName}
						</div>
						<div className="text-muted-foreground">
							{milestone.isCompleted
								? "Completed"
								: "Not completed"}
						</div>
						{milestone.weight && (
							<div className="text-xs text-muted-foreground">
								Weight: {milestone.weight}%
							</div>
						)}
					</div>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

export function InlineDiscreteMilestones({
	component,
	className,
	onMilestoneUpdate,
}: InlineDiscreteMilestonesProps) {
	const { updateMilestone, hasPendingUpdates, getOperationStatus } =
		useMilestoneUpdateEngine();
	const [showWeldModal, setShowWeldModal] = useState(false);
	const [selectedWeldMilestone, setSelectedWeldMilestone] =
		useState<ComponentMilestone | null>(null);

	// Only show this component for discrete milestone workflows
	if (component.workflowType !== "MILESTONE_DISCRETE") {
		return (
			<div
				className={cn(
					"flex items-center text-muted-foreground",
					className,
				)}
			>
				<AlertTriangle className="h-4 w-4 mr-2" />
				<span className="text-sm">
					Inline view only supports discrete milestones
				</span>
			</div>
		);
	}

	if (!component.milestones || component.milestones.length === 0) {
		return (
			<div
				className={cn(
					"flex items-center text-muted-foreground",
					className,
				)}
			>
				<AlertTriangle className="h-4 w-4 mr-2" />
				<span className="text-sm">No milestones configured</span>
			</div>
		);
	}

	// Sort milestones by order
	const sortedMilestones = useMemo(() => {
		return [...component.milestones!].sort(
			(a, b) => a.milestoneOrder - b.milestoneOrder,
		);
	}, [component.milestones]);

	// Calculate progress
	const completedCount = sortedMilestones.filter((m) => m.isCompleted).length;
	const totalCount = sortedMilestones.length;
	const overallProgress = Math.round((completedCount / totalCount) * 100);

	// Calculate weighted progress using ROC weights from database
	const weightedProgress = useMemo(() => {
		// Filter milestones with valid weights
		const milestonesWithWeights = sortedMilestones.filter(
			(m) => m.weight && m.weight > 0,
		);

		if (milestonesWithWeights.length === 0) {
			console.warn(
				`Component ${component.componentId} (${component.type}) has no weighted milestones`,
			);
			return 0;
		}

		// Validate weights sum to 100%
		const totalWeight = milestonesWithWeights.reduce(
			(sum, m) => sum + m.weight,
			0,
		);

		if (Math.abs(totalWeight - 100) > 0.1) {
			console.error(
				`Component ${component.componentId} (${component.type}) weights sum to ${totalWeight}%, not 100%`,
				"Milestones:",
				milestonesWithWeights.map((m) => ({
					name: m.milestoneName,
					weight: m.weight,
				})),
			);
		}

		// Calculate progress based on completed milestones
		const completedWeight = milestonesWithWeights.reduce(
			(sum, milestone) =>
				sum + (milestone.isCompleted ? milestone.weight : 0),
			0,
		);

		// Return percentage (completedWeight is already in percentage form)
		return Math.round(completedWeight);
	}, [sortedMilestones, component.componentId, component.type]);

	const hasAnyPending = sortedMilestones.some((m) => hasPendingUpdates(m.id));

	const handleMilestoneToggle = async (
		milestone: ComponentMilestone,
		completed: boolean,
	) => {
		// For field weld components with "Weld Made" milestone, open the welder selection modal
		if (
			component.type === "FIELD_WELD" &&
			milestone.milestoneName === "Weld Made" &&
			completed === true
		) {
			setSelectedWeldMilestone(milestone);
			setShowWeldModal(true);
			return;
		}

		await updateMilestone(
			milestone.id,
			component.id,
			milestone.milestoneName,
			component.workflowType,
			completed,
		);

		// Call optional callback
		onMilestoneUpdate?.(milestone.id, completed);
	};

	return (
		<div className={cn("space-y-2", className)}>
			{/* Milestone Pills Row */}
			<div className="flex items-center gap-1 flex-wrap">
				{sortedMilestones.map((milestone, index) => {
					// Check if milestone is locked (previous milestone not completed)
					const isLocked =
						index > 0 && !sortedMilestones[index - 1].isCompleted;
					const isPending = hasPendingUpdates(milestone.id);

					return (
						<MilestonePill
							key={milestone.id}
							milestone={milestone}
							isLocked={isLocked}
							isPending={isPending}
							onToggle={(completed) =>
								handleMilestoneToggle(milestone, completed)
							}
						/>
					);
				})}

				{/* Divider */}
				<div className="h-6 w-px bg-border mx-2" />

				{/* Progress Display */}
				<div className="flex items-center gap-2 min-w-0">
					<span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
						{completedCount}/{totalCount}
					</span>
					<div className="flex-1 min-w-[60px]">
						<Progress
							value={weightedProgress}
							className={cn(
								"h-2",
								hasAnyPending && "animate-pulse",
							)}
						/>
					</div>
					<div className="flex items-center gap-1">
						<span className="text-xs text-muted-foreground font-medium min-w-[32px] text-right">
							{weightedProgress}%
						</span>
						{hasAnyPending && (
							<Loader2 className="h-3 w-3 animate-spin text-blue-600" />
						)}
					</div>
				</div>
			</div>

			{/* Weld Milestone Modal for Field Welds */}
			{selectedWeldMilestone && component.type === "FIELD_WELD" && (
				<WeldMilestoneModal
					open={showWeldModal}
					onOpenChange={setShowWeldModal}
					component={{
						id: component.id,
						componentId: component.componentId,
						displayId: component.displayId || component.componentId,
						projectId: component.projectId || "",
					}}
					milestone={{
						id: selectedWeldMilestone.id,
						milestoneName: selectedWeldMilestone.milestoneName,
						isCompleted: selectedWeldMilestone.isCompleted,
					}}
					onSuccess={async (data) => {
						// Update the milestone with welder information using direct API call
						if (selectedWeldMilestone) {
							try {
								await fetch(
									`/api/pipetrak/milestones/${selectedWeldMilestone.id}`,
									{
										method: "PATCH",
										headers: {
											"Content-Type": "application/json",
										},
										body: JSON.stringify({
											isCompleted: true,
											welderId: data.welderId,
											effectiveDate: data.dateWelded
												.toISOString()
												.split("T")[0],
											comments: data.comments,
										}),
									},
								);

								// Also trigger the standard milestone update for optimistic updates and caching
								await updateMilestone(
									selectedWeldMilestone.id,
									component.id,
									selectedWeldMilestone.milestoneName,
									component.workflowType,
									true,
								);

								// Call optional callback
								onMilestoneUpdate?.(
									selectedWeldMilestone.id,
									true,
								);
							} catch (error) {
								console.error(
									"Failed to update weld milestone:",
									error,
								);
								throw error; // Re-throw so modal can handle the error
							}
						}

						setSelectedWeldMilestone(null);
					}}
				/>
			)}
		</div>
	);
}
