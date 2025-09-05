"use client";

import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Checkbox } from "@ui/components/checkbox";
import { Label } from "@ui/components/label";
import { cn } from "@ui/lib";
import { Check, Circle, Loader2, Lock, Undo2 } from "lucide-react";
import { useState } from "react";
// Removed keyboard navigation import - made optional
import type { ComponentMilestone } from "../../../types";

interface MilestoneDiscreteRendererProps {
	milestone: ComponentMilestone;
	isLocked?: boolean;
	isLoading?: boolean;
	touchTargetSize?: number;
	showUndo2Option?: boolean;
	onUpdate: (value: boolean) => Promise<void>;
	onUndo2?: () => void;
	className?: string;
}

export function MilestoneDiscreteRenderer({
	milestone,
	isLocked = false,
	isLoading = false,
	touchTargetSize = 52,
	showUndo2Option = false,
	onUpdate,
	onUndo2,
	className,
}: MilestoneDiscreteRendererProps) {
	const [optimisticValue, setOptimisticValue] = useState<boolean | null>(
		null,
	);
	const [isUpdating, setIsUpdating] = useState(false);

	const currentValue =
		optimisticValue !== null ? optimisticValue : milestone.isCompleted;
	const hasChanges =
		optimisticValue !== null && optimisticValue !== milestone.isCompleted;

	// Keyboard navigation removed - was causing provider requirement issues
	// Can be re-added when KeyboardNavigationProvider is properly integrated

	const handleToggle = async (checked: boolean) => {
		if (isLocked || isUpdating) {
			return;
		}

		// Apply optimistic update
		setOptimisticValue(checked);
		setIsUpdating(true);

		try {
			await onUpdate(checked);
			// Success - clear optimistic state
			setOptimisticValue(null);

			// Announce success to screen readers
			window.announceMilestoneUpdate?.(
				milestone.milestoneName,
				milestone.componentId || "unknown",
				checked ? "completed" : "incomplete",
			);
		} catch (error) {
			// Error - rollback optimistic state
			setOptimisticValue(null);
			console.error("Failed to update milestone:", error);

			// Announce error to screen readers
			window.announceError?.(
				`Failed to update milestone ${milestone.milestoneName}`,
			);
		} finally {
			setIsUpdating(false);
		}
	};

	const handleCancel = () => {
		setOptimisticValue(null);
	};

	const getStatusIcon = () => {
		if (isLocked) {
			return (
				<Lock
					className="h-5 w-5 text-muted-foreground"
					aria-label="Locked"
				/>
			);
		}

		if (isUpdating || isLoading) {
			return (
				<Loader2
					className="h-5 w-5 text-blue-600 animate-spin"
					aria-label="Updating"
				/>
			);
		}

		return currentValue ? (
			<Check
				className="h-5 w-5 text-fieldComplete"
				aria-label="Completed"
			/>
		) : (
			<Circle
				className="h-5 w-5 text-muted-foreground"
				aria-label="Not completed"
			/>
		);
	};

	return (
		<div className={cn("space-y-3", className)}>
			{/* Main milestone control */}
			<div
				className={cn(
					"flex items-center gap-3 p-3 rounded-lg border transition-colors",
					isLocked && "opacity-50 cursor-not-allowed bg-muted/30",
					!isLocked &&
						!isUpdating &&
						"hover:bg-muted/50 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
					hasChanges && "border-blue-500 bg-blue-50/50",
					isUpdating && "bg-blue-50/30",
				)}
				style={{ minHeight: `${touchTargetSize}px` }}
				onClick={() =>
					!isLocked && !isUpdating && handleToggle(!currentValue)
				}
				role="checkbox"
				tabIndex={isLocked ? -1 : 0}
				aria-checked={currentValue}
				aria-disabled={isLocked || isUpdating}
				aria-busy={isUpdating}
				aria-label={`${milestone.milestoneName}: ${currentValue ? "Completed" : "Not completed"}${isLocked ? " (locked)" : ""}${hasChanges ? " (changes pending)" : ""}`}
				aria-describedby={
					milestone.sequenceNumber
						? `${milestone.id}-sequence`
						: undefined
				}
			>
				<Checkbox
					checked={currentValue}
					disabled={isLocked || isUpdating}
					className="h-6 w-6"
					onCheckedChange={(checked) => handleToggle(!!checked)}
					onClick={(e) => e.stopPropagation()}
					aria-label={`Mark ${milestone.milestoneName} as ${currentValue ? "incomplete" : "complete"}`}
				/>

				<div className="flex-1 min-w-0">
					<Label
						className={cn(
							"text-base font-medium cursor-pointer block",
							isLocked && "cursor-not-allowed",
						)}
					>
						{milestone.milestoneName}
					</Label>

					{milestone.sequenceNumber && (
						<div
							className="flex items-center gap-2 mt-1"
							id={`${milestone.id}-sequence`}
						>
							<Badge
								status="info"
								className="text-xs"
								role="img"
								aria-label={`Step ${milestone.sequenceNumber} of ${milestone.totalInWorkflow || 1}`}
							>
								Step {milestone.sequenceNumber} of{" "}
								{milestone.totalInWorkflow || 1}
							</Badge>
							{milestone.creditWeight && (
								<Badge
									status="info"
									className="text-xs"
									role="img"
									aria-label={`Worth ${milestone.creditWeight} credits`}
								>
									{milestone.creditWeight} credits
								</Badge>
							)}
						</div>
					)}
				</div>

				<div className="flex items-center gap-2">
					{getStatusIcon()}
					{showUndo2Option && onUndo2 && milestone.completedAt && (
						<Button
							variant="ghost"
							size="sm"
							onClick={(e: React.MouseEvent) => {
								e.stopPropagation();
								onUndo2();
							}}
							className="h-8 w-8 p-0"
							aria-label="Undo2 completion"
						>
							<Undo2 className="h-4 w-4" />
						</Button>
					)}
				</div>
			</div>

			{/* Action buttons for pending changes */}
			{hasChanges && (
				<div className="flex gap-2 px-3">
					<Button
						onClick={() => handleToggle(optimisticValue ?? false)}
						disabled={isUpdating}
						size="sm"
						className="flex-1"
						style={{
							minHeight: `${Math.min(touchTargetSize, 44)}px`,
						}}
						aria-label={`Save ${optimisticValue ? "completion" : "incomplete status"}`}
					>
						{isUpdating ? (
							<>
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								Saving...
							</>
						) : (
							<>
								Save{" "}
								{optimisticValue ? "Complete" : "Incomplete"}
							</>
						)}
					</Button>
					<Button
						variant="outline"
						onClick={handleCancel}
						disabled={isUpdating}
						size="sm"
						style={{
							minHeight: `${Math.min(touchTargetSize, 44)}px`,
						}}
						aria-label="Cancel changes"
					>
						Cancel
					</Button>
				</div>
			)}

			{/* Completion metadata */}
			{milestone.completedAt && milestone.completedBy && (
				<div className="px-3 text-xs text-muted-foreground">
					Completed{" "}
					{new Date(milestone.completedAt).toLocaleDateString()}
					{milestone.completedBy && <> by {milestone.completedBy}</>}
				</div>
			)}
		</div>
	);
}
