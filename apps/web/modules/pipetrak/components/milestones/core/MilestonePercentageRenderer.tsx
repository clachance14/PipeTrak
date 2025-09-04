"use client";

import { useState, useCallback } from "react";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Slider } from "@ui/components/slider";
import { Progress } from "@ui/components/progress";
import { Badge } from "@ui/components/badge";
import {
	CheckCircle2,
	Clock,
	AlertCircle,
	Lock,
	Loader2,
	Undo2,
	Minus,
	Plus,
} from "lucide-react";
import { cn } from "@ui/lib";
import type { ComponentMilestone } from "../../../types";

interface MilestonePercentageRendererProps {
	milestone: ComponentMilestone;
	isLocked?: boolean;
	isLoading?: boolean;
	touchTargetSize?: number;
	showUndo2Option?: boolean;
	onUpdate: (value: number) => Promise<void>;
	onUndo2?: () => void;
	className?: string;
}

export function MilestonePercentageRenderer({
	milestone,
	isLocked = false,
	isLoading = false,
	touchTargetSize = 52,
	showUndo2Option = false,
	onUpdate,
	onUndo2,
	className,
}: MilestonePercentageRendererProps) {
	const [optimisticValue, setOptimisticValue] = useState<number | null>(null);
	const [inputValue, setInputValue] = useState<string>("");
	const [isUpdating, setIsUpdating] = useState(false);

	const currentValue =
		optimisticValue !== null
			? optimisticValue
			: milestone.percentageComplete || 0;
	const hasChanges =
		optimisticValue !== null &&
		optimisticValue !== (milestone.percentageComplete || 0);

	const handleSliderChange = useCallback(
		(values: number[]) => {
			if (!isLocked && !isUpdating) {
				const value = Math.min(100, Math.max(0, values[0]));
				setOptimisticValue(value);
				setInputValue(value.toString());
			}
		},
		[isLocked, isUpdating],
	);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value;
			setInputValue(value);

			if (!isLocked && !isUpdating) {
				const numValue = Number.parseInt(value) || 0;
				const clampedValue = Math.min(100, Math.max(0, numValue));
				setOptimisticValue(clampedValue);
			}
		},
		[isLocked, isUpdating],
	);

	const handleInputBlur = useCallback(() => {
		if (optimisticValue !== null) {
			setInputValue(optimisticValue.toString());
		}
	}, [optimisticValue]);

	const handleStepChange = useCallback(
		(delta: number) => {
			if (!isLocked && !isUpdating) {
				const newValue = Math.min(
					100,
					Math.max(0, currentValue + delta),
				);
				setOptimisticValue(newValue);
				setInputValue(newValue.toString());
			}
		},
		[isLocked, isUpdating, currentValue],
	);

	const handleSave = async () => {
		if (optimisticValue === null || isUpdating) return;

		setIsUpdating(true);
		try {
			await onUpdate(optimisticValue);
			// Success - clear optimistic state
			setOptimisticValue(null);
			setInputValue("");
		} catch (error) {
			// Error - rollback optimistic state
			setOptimisticValue(null);
			setInputValue("");
			console.error("Failed to update milestone:", error);
		} finally {
			setIsUpdating(false);
		}
	};

	const handleCancel = () => {
		setOptimisticValue(null);
		setInputValue("");
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

		if (currentValue === 100) {
			return (
				<CheckCircle2
					className="h-5 w-5 text-fieldComplete"
					aria-label="100% Complete"
				/>
			);
		}
		if (currentValue > 0) {
			return (
				<Clock
					className="h-5 w-5 text-blue-600"
					aria-label="In Progress"
				/>
			);
		}
		return (
			<AlertCircle
				className="h-5 w-5 text-fieldPending"
				aria-label="Not Started"
			/>
		);
	};

	return (
		<div className={cn("space-y-4", className)}>
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex-1 min-w-0">
					<Label className="text-base font-medium block">
						{milestone.milestoneName}
					</Label>

					{milestone.sequenceNumber && (
						<div className="flex items-center gap-2 mt-1">
							<Badge status="info" className="text-xs">
								Step {milestone.sequenceNumber} of{" "}
								{milestone.totalInWorkflow || 1}
							</Badge>
							{milestone.creditWeight && (
								<Badge status="info" className="text-xs">
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
							onClick={onUndo2}
							className="h-8 w-8 p-0"
							aria-label="Undo2 completion"
						>
							<Undo2 className="h-4 w-4" />
						</Button>
					)}
				</div>
			</div>

			{/* Progress visualization */}
			<div className="space-y-2">
				<Progress
					value={currentValue}
					className={cn(
						"h-4 transition-all duration-200",
						hasChanges && "ring-2 ring-blue-200",
					)}
					aria-label={`${currentValue}% complete`}
				/>

				<div className="flex items-center justify-between text-sm text-muted-foreground">
					<span>Progress</span>
					<span className="font-medium">
						{Math.round(currentValue)}%
					</span>
				</div>
			</div>

			{/* Slider control */}
			<div className="space-y-3">
				<Slider
					value={[currentValue]}
					onValueChange={handleSliderChange}
					max={100}
					step={5}
					disabled={isLocked || isUpdating}
					className={cn(
						"w-full",
						isLocked && "opacity-50",
						hasChanges && "accent-blue-500",
					)}
					style={{ minHeight: `${touchTargetSize}px` }}
					aria-label="Adjust completion percentage"
				/>

				{/* Input controls */}
				<div className="flex items-center gap-2">
					<Button
						variant="secondary"
						size="sm"
						onClick={() => handleStepChange(-5)}
						disabled={isLocked || isUpdating || currentValue <= 0}
						className="h-10 w-10 p-0"
						aria-label="Decrease by 5%"
					>
						<Minus className="h-4 w-4" />
					</Button>

					<div className="flex-1 flex items-center gap-2">
						<Input
							type="number"
							value={inputValue || currentValue}
							onChange={handleInputChange}
							onBlur={handleInputBlur}
							className="text-center"
							style={{
								minHeight: `${Math.min(touchTargetSize, 44)}px`,
							}}
							disabled={isLocked || isUpdating}
							min={0}
							max={100}
							aria-label="Completion percentage"
						/>
						<span className="text-sm font-medium min-w-[20px]">
							%
						</span>
					</div>

					<Button
						variant="secondary"
						size="sm"
						onClick={() => handleStepChange(5)}
						disabled={isLocked || isUpdating || currentValue >= 100}
						className="h-10 w-10 p-0"
						aria-label="Increase by 5%"
					>
						<Plus className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Action buttons for pending changes */}
			{hasChanges && (
				<div className="flex gap-2">
					<Button
						onClick={handleSave}
						disabled={isUpdating}
						className="flex-1"
						style={{
							minHeight: `${Math.min(touchTargetSize, 44)}px`,
						}}
						aria-label={`Save ${optimisticValue}% completion`}
					>
						{isUpdating ? (
							<>
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								Saving...
							</>
						) : (
							<>Save {optimisticValue}%</>
						)}
					</Button>
					<Button
						variant="secondary"
						onClick={handleCancel}
						disabled={isUpdating}
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
			{milestone.completedAt &&
				milestone.completedBy &&
				currentValue === 100 && (
					<div className="text-xs text-muted-foreground">
						Completed{" "}
						{new Date(milestone.completedAt).toLocaleDateString()}
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
		</div>
	);
}
