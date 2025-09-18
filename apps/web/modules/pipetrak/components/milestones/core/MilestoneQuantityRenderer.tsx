"use client";

import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Progress } from "@ui/components/progress";
import { cn } from "@ui/lib";
import {
	AlertCircle,
	Check,
	Clock,
	Loader2,
	Lock,
	Minus,
	Plus,
	Undo2,
} from "lucide-react";
import { useCallback, useState } from "react";
import type { ComponentMilestone } from "../../../types";

interface MilestoneQuantityRendererProps {
	milestone: ComponentMilestone;
	isLocked?: boolean;
	isLoading?: boolean;
	touchTargetSize?: number;
	showUndo2Option?: boolean;
	onUpdate: (value: number) => Promise<void>;
	onUndo2?: () => void;
	className?: string;
}

export function MilestoneQuantityRenderer({
	milestone,
	isLocked = false,
	isLoading = false,
	touchTargetSize = 52,
	showUndo2Option = false,
	onUpdate,
	onUndo2,
	className,
}: MilestoneQuantityRendererProps) {
	const [optimisticValue, setOptimisticValue] = useState<number | null>(null);
	const [inputValue, setInputValue] = useState<string>("");
	const [isUpdating, setIsUpdating] = useState(false);

	const currentValue =
		optimisticValue !== null
			? optimisticValue
			: milestone.quantityComplete || 0;
	const totalQuantity = milestone.quantityTotal || 0;
	const unit = milestone.unit || "units";
	const percent =
		totalQuantity > 0
			? Math.round((currentValue / totalQuantity) * 100)
			: 0;
	const hasChanges =
		optimisticValue !== null &&
		optimisticValue !== (milestone.quantityComplete || 0);

	// Determine step size based on unit type
	const getStepSize = () => {
		if (unit === "ft" || unit === "m" || unit === "inches") {
			return 0.1;
		}
		return 1;
	};

	const stepSize = getStepSize();

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value;
			setInputValue(value);

			if (!isLocked && !isUpdating) {
				const numValue = Number.parseFloat(value) || 0;
				const clampedValue = Math.min(
					totalQuantity,
					Math.max(0, numValue),
				);
				setOptimisticValue(clampedValue);
			}
		},
		[isLocked, isUpdating, totalQuantity],
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
					totalQuantity,
					Math.max(0, currentValue + delta),
				);
				setOptimisticValue(newValue);
				setInputValue(newValue.toString());
			}
		},
		[isLocked, isUpdating, currentValue, totalQuantity],
	);

	const handleSave = async () => {
		if (optimisticValue === null || isUpdating) {
			return;
		}

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

		if (percent === 100) {
			return (
				<Check
					className="h-5 w-5 text-fieldComplete"
					aria-label="Completed"
				/>
			);
		}
		if (percent > 0) {
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

	const formatValue = (value: number) => {
		return stepSize < 1 ? value.toFixed(1) : value.toString();
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
							{milestone.weight && (
								<Badge status="info" className="text-xs">
									{milestone.weight} credits
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

			{/* Quantity input controls */}
			<div className="space-y-3">
				<div className="flex items-center gap-2">
					<Button
						variant="secondary"
						size="sm"
						onClick={() => handleStepChange(-stepSize)}
						disabled={isLocked || isUpdating || currentValue <= 0}
						className="h-12 w-12 p-0"
						style={{
							minHeight: `${Math.min(touchTargetSize, 48)}px`,
							minWidth: `${Math.min(touchTargetSize, 48)}px`,
						}}
						aria-label={`Decrease by ${stepSize} ${unit}`}
					>
						<Minus className="h-4 w-4" />
					</Button>

					<div className="flex-1 space-y-2">
						<Input
							type="number"
							value={inputValue || formatValue(currentValue)}
							onChange={handleInputChange}
							onBlur={handleInputBlur}
							className={cn(
								"text-center text-lg font-medium",
								hasChanges &&
									"border-blue-500 ring-2 ring-blue-200",
							)}
							style={{ minHeight: `${touchTargetSize}px` }}
							disabled={isLocked || isUpdating}
							min={0}
							max={totalQuantity}
							step={stepSize}
							aria-label={`Quantity completed in ${unit}`}
						/>

						<div className="flex items-center justify-center text-sm text-muted-foreground">
							<span className="font-medium">
								/ {formatValue(totalQuantity)} {unit}
							</span>
						</div>
					</div>

					<Button
						variant="secondary"
						size="sm"
						onClick={() => handleStepChange(stepSize)}
						disabled={
							isLocked ||
							isUpdating ||
							currentValue >= totalQuantity
						}
						className="h-12 w-12 p-0"
						style={{
							minHeight: `${Math.min(touchTargetSize, 48)}px`,
							minWidth: `${Math.min(touchTargetSize, 48)}px`,
						}}
						aria-label={`Increase by ${stepSize} ${unit}`}
					>
						<Plus className="h-4 w-4" />
					</Button>
				</div>

				{/* Progress visualization */}
				<div className="space-y-2">
					<Progress
						value={percent}
						className={cn(
							"h-4 transition-all duration-200",
							hasChanges && "ring-2 ring-blue-200",
						)}
						aria-label={`${percent}% complete`}
					/>

					<div className="flex items-center justify-between text-sm text-muted-foreground">
						<span>
							{formatValue(currentValue)} of{" "}
							{formatValue(totalQuantity)} {unit} complete
						</span>
						<span className="font-medium">{percent}%</span>
					</div>
				</div>

				{/* Quick increment buttons for common quantities */}
				{totalQuantity >= 10 && (
					<div className="flex gap-2">
						{[1, 5, 10].map((increment) => (
							<Button
								key={increment}
								variant="secondary"
								size="sm"
								onClick={() => handleStepChange(increment)}
								disabled={
									isLocked ||
									isUpdating ||
									currentValue + increment > totalQuantity
								}
								className="text-xs"
								aria-label={`Add ${increment} ${unit}`}
							>
								+{increment}
							</Button>
						))}
					</div>
				)}
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
						aria-label={`Save ${formatValue(optimisticValue ?? 0)} ${unit}`}
					>
						{isUpdating ? (
							<>
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								Saving...
							</>
						) : (
							<>
								Save {formatValue(optimisticValue ?? 0)} {unit}
							</>
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
				percent === 100 && (
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
