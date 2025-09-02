"use client";

import { MilestoneDiscreteRenderer } from "./MilestoneDiscreteRenderer";
import { MilestonePercentageRenderer } from "./MilestonePercentageRenderer";
import { MilestoneQuantityRenderer } from "./MilestoneQuantityRenderer";
import { Alert, AlertDescription } from "@ui/components/alert";
import { AlertTriangle } from "lucide-react";
import type { ComponentMilestone, WorkflowType } from "../../../types";

interface MilestoneWorkflowRendererProps {
	milestone: ComponentMilestone;
	workflowType: WorkflowType;
	isLocked?: boolean;
	isLoading?: boolean;
	touchTargetSize?: number;
	showUndoOption?: boolean;
	onUpdate: (value: boolean | number) => Promise<void>;
	onUndo?: () => void;
	className?: string;
}

export function MilestoneWorkflowRenderer({
	milestone,
	workflowType,
	isLocked = false,
	isLoading = false,
	touchTargetSize = 52,
	showUndoOption = false,
	onUpdate,
	onUndo,
	className,
}: MilestoneWorkflowRendererProps) {
	// Handle discrete milestone updates
	const handleDiscreteUpdate = async (value: boolean) => {
		await onUpdate(value);
	};

	// Handle percentage milestone updates
	const handlePercentageUpdate = async (value: number) => {
		await onUpdate(value);
	};

	// Handle quantity milestone updates
	const handleQuantityUpdate = async (value: number) => {
		await onUpdate(value);
	};

	// Validate workflow type matches milestone data
	const validateMilestoneData = () => {
		switch (workflowType) {
			case "MILESTONE_DISCRETE":
				return milestone.isCompleted !== undefined;

			case "MILESTONE_PERCENTAGE":
				return milestone.percentageComplete !== undefined;

			case "MILESTONE_QUANTITY":
				return (
					milestone.quantityComplete !== undefined &&
					milestone.quantityTotal !== undefined
				);

			default:
				return false;
		}
	};

	const isValidMilestone = validateMilestoneData();

	if (!isValidMilestone) {
		return (
			<Alert status="error" className={className}>
				<AlertTriangle className="h-4 w-4" />
				<AlertDescription>
					Milestone data is incompatible with workflow type "
					{workflowType}". Please check the milestone configuration.
				</AlertDescription>
			</Alert>
		);
	}

	switch (workflowType) {
		case "MILESTONE_DISCRETE":
			return (
				<MilestoneDiscreteRenderer
					milestone={milestone}
					isLocked={isLocked}
					isLoading={isLoading}
					touchTargetSize={touchTargetSize}
					showUndoOption={showUndoOption}
					onUpdate={handleDiscreteUpdate}
					onUndo={onUndo}
					className={className}
				/>
			);

		case "MILESTONE_PERCENTAGE":
			return (
				<MilestonePercentageRenderer
					milestone={milestone}
					isLocked={isLocked}
					isLoading={isLoading}
					touchTargetSize={touchTargetSize}
					showUndoOption={showUndoOption}
					onUpdate={handlePercentageUpdate}
					onUndo={onUndo}
					className={className}
				/>
			);

		case "MILESTONE_QUANTITY":
			return (
				<MilestoneQuantityRenderer
					milestone={milestone}
					isLocked={isLocked}
					isLoading={isLoading}
					touchTargetSize={touchTargetSize}
					showUndoOption={showUndoOption}
					onUpdate={handleQuantityUpdate}
					onUndo={onUndo}
					className={className}
				/>
			);

		default:
			return (
				<Alert status="error" className={className}>
					<AlertTriangle className="h-4 w-4" />
					<AlertDescription>
						Unknown workflow type: "{workflowType}". Supported types
						are MILESTONE_DISCRETE, MILESTONE_PERCENTAGE, and
						MILESTONE_QUANTITY.
					</AlertDescription>
				</Alert>
			);
	}
}
