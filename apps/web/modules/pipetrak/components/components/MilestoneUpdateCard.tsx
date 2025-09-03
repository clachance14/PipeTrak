"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Checkbox } from "@ui/components/checkbox";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Progress } from "@ui/components/progress";
import { Slider } from "@ui/components/slider";
import { Badge } from "@ui/components/badge";
import { CheckCircle2, Circle, Clock, AlertCircle, Lock } from "lucide-react";
import { cn } from "@ui/lib";
import type { ComponentMilestone, WorkflowType } from "../../types";

interface MilestoneUpdateCardProps {
	milestone: ComponentMilestone;
	workflowType: WorkflowType;
	isLocked?: boolean; // True if previous milestone is incomplete
	onUpdate: (value: number | boolean) => Promise<void>;
	touchTargetSize?: number;
	isMobile?: boolean;
}

export function MilestoneUpdateCard({
	milestone,
	workflowType,
	isLocked = false,
	onUpdate,
	touchTargetSize = 52,
	isMobile = false,
}: MilestoneUpdateCardProps) {
	const [isUpdating, setIsUpdating] = useState(false);
	const [tempValue, setTempValue] = useState<number | boolean | null>(null);

	const getStatusIcon = () => {
		if (isLocked) {
			return <Lock className="h-5 w-5 text-muted-foreground" />;
		}

		if (workflowType === "MILESTONE_DISCRETE") {
			return milestone.isCompleted ? (
				<CheckCircle2 className="h-5 w-5 text-fieldComplete" />
			) : (
				<Circle className="h-5 w-5 text-muted-foreground" />
			);
		}

		const percent = milestone.percentageComplete || 0;
		if (percent === 100) {
			return <CheckCircle2 className="h-5 w-5 text-fieldComplete" />;
		}
		if (percent > 0) {
			return <Clock className="h-5 w-5 text-blue-600" />;
		}
		return <AlertCircle className="h-5 w-5 text-fieldPending" />;
	};

	const handleUpdate = async () => {
		if (isLocked || tempValue === null) return;

		setIsUpdating(true);
		try {
			await onUpdate(tempValue);
			setTempValue(null);
		} catch (error) {
			console.error("Failed to update milestone:", error);
		} finally {
			setIsUpdating(false);
		}
	};

	const renderDiscreteWorkflow = () => {
		const isChecked =
			tempValue !== null ? (tempValue as boolean) : milestone.isCompleted;

		if (isMobile) {
			return (
				<div className="space-y-1">
					<div
						className={cn(
							"flex items-center gap-2 p-1 rounded border cursor-pointer transition-colors",
							isLocked && "opacity-50 cursor-not-allowed",
							!isLocked && "hover:bg-muted/50",
						)}
						style={{
							minHeight: `${Math.max(40, touchTargetSize - 12)}px`,
						}}
						onClick={() => !isLocked && setTempValue(!isChecked)}
					>
						<Checkbox
							checked={isChecked}
							disabled={isLocked}
							className="h-4 w-4"
						/>
						<Label className="text-sm flex-1 cursor-pointer">
							{milestone.milestoneName}
						</Label>
						<div className="flex-shrink-0">{getStatusIcon()}</div>
					</div>

					{tempValue !== null &&
						tempValue !== milestone.isCompleted && (
							<div className="flex gap-1">
								<Button
									onClick={handleUpdate}
									disabled={isUpdating}
									className="flex-1 h-8 text-xs"
								>
									Save
								</Button>
								<Button
									status="info"
									onClick={() => setTempValue(null)}
									className="h-8 text-xs px-2"
								>
									Cancel
								</Button>
							</div>
						)}
				</div>
			);
		}

		return (
			<div className="space-y-4">
				<div
					className={cn(
						"flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors",
						isLocked && "opacity-50 cursor-not-allowed",
						!isLocked && "hover:bg-muted/50",
					)}
					style={{ minHeight: `${touchTargetSize}px` }}
					onClick={() => !isLocked && setTempValue(!isChecked)}
				>
					<Checkbox
						checked={isChecked}
						disabled={isLocked}
						className="h-6 w-6"
					/>
					<Label className="text-base flex-1 cursor-pointer">
						{milestone.milestoneName}
					</Label>
					{getStatusIcon()}
				</div>

				{tempValue !== null && tempValue !== milestone.isCompleted && (
					<div className="flex gap-2">
						<Button
							onClick={handleUpdate}
							disabled={isUpdating}
							className="flex-1"
							style={{ minHeight: `${touchTargetSize}px` }}
						>
							Save
						</Button>
						<Button
							status="info"
							onClick={() => setTempValue(null)}
							style={{ minHeight: `${touchTargetSize}px` }}
						>
							Cancel
						</Button>
					</div>
				)}
			</div>
		);
	};

	const renderPercentageWorkflow = () => {
		const currentValue =
			tempValue !== null
				? (tempValue as number)
				: milestone.percentageComplete || 0;

		if (isMobile) {
			return (
				<div className="space-y-1">
					<div className="flex items-center justify-between">
						<Label className="text-sm">
							{milestone.milestoneName}
						</Label>
						<div className="flex-shrink-0">{getStatusIcon()}</div>
					</div>

					<div className="flex items-center gap-1">
						<Input
							type="number"
							value={currentValue}
							onChange={(e) =>
								!isLocked &&
								setTempValue(
									Math.min(
										100,
										Math.max(
											0,
											Number.parseInt(e.target.value) ||
												0,
										),
									),
								)
							}
							className="w-14 text-center h-7 text-xs"
							disabled={isLocked}
							min={0}
							max={100}
						/>
						<span className="text-xs">%</span>
						<Progress value={currentValue} className="h-2 flex-1" />
					</div>

					{tempValue !== null &&
						tempValue !== milestone.percentageComplete && (
							<div className="flex gap-1">
								<Button
									onClick={handleUpdate}
									disabled={isUpdating}
									className="flex-1 h-8 text-xs"
								>
									Save {tempValue}%
								</Button>
								<Button
									status="info"
									onClick={() => setTempValue(null)}
									className="h-8 text-xs px-2"
								>
									Cancel
								</Button>
							</div>
						)}
				</div>
			);
		}

		return (
			<div className="space-y-4">
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<Label className="text-base">
							{milestone.milestoneName}
						</Label>
						{getStatusIcon()}
					</div>

					<div className="space-y-3">
						<Slider
							value={[currentValue]}
							onValueChange={(value) =>
								!isLocked && setTempValue(value[0])
							}
							max={100}
							step={5}
							disabled={isLocked}
							className={cn("w-full", isLocked && "opacity-50")}
							style={{ minHeight: `${touchTargetSize}px` }}
						/>

						<div className="flex items-center justify-between">
							<span className="text-sm text-muted-foreground">
								Progress
							</span>
							<div className="flex items-center gap-2">
								<Input
									type="number"
									value={currentValue}
									onChange={(e) =>
										!isLocked &&
										setTempValue(
											Math.min(
												100,
												Math.max(
													0,
													Number.parseInt(
														e.target.value,
													) || 0,
												),
											),
										)
									}
									className="w-20 text-center"
									style={{
										minHeight: `${touchTargetSize}px`,
									}}
									disabled={isLocked}
									min={0}
									max={100}
								/>
								<span className="text-sm font-medium">%</span>
							</div>
						</div>
					</div>

					<Progress value={currentValue} className="h-3" />
				</div>

				{tempValue !== null &&
					tempValue !== milestone.percentageComplete && (
						<div className="flex gap-2">
							<Button
								onClick={handleUpdate}
								disabled={isUpdating}
								className="flex-1"
								style={{ minHeight: `${touchTargetSize}px` }}
							>
								Save {tempValue}%
							</Button>
							<Button
								status="info"
								onClick={() => setTempValue(null)}
								style={{ minHeight: `${touchTargetSize}px` }}
							>
								Cancel
							</Button>
						</div>
					)}
			</div>
		);
	};

	const renderQuantityWorkflow = () => {
		const currentValue =
			tempValue !== null
				? (tempValue as number)
				: milestone.quantityComplete || 0;
		const total = milestone.quantityTotal || 0;
		const percent =
			total > 0 ? Math.round((currentValue / total) * 100) : 0;

		if (isMobile) {
			return (
				<div className="space-y-1">
					<div className="flex items-center justify-between">
						<Label className="text-sm">
							{milestone.milestoneName}
						</Label>
						<div className="flex-shrink-0">{getStatusIcon()}</div>
					</div>

					<div className="flex items-center gap-1">
						<Input
							type="number"
							value={currentValue}
							onChange={(e) =>
								!isLocked &&
								setTempValue(
									Math.min(
										total,
										Math.max(
											0,
											Number.parseFloat(e.target.value) ||
												0,
										),
									),
								)
							}
							className="w-16 text-center h-7 text-xs"
							disabled={isLocked}
							min={0}
							max={total}
							step={
								milestone.unit === "ft" ||
								milestone.unit === "m"
									? 0.1
									: 1
							}
						/>
						<span className="text-xs">/{total}</span>
						<Progress value={percent} className="h-2 flex-1" />
						<span className="text-xs">{percent}%</span>
					</div>

					{tempValue !== null &&
						tempValue !== milestone.quantityComplete && (
							<div className="flex gap-1">
								<Button
									onClick={handleUpdate}
									disabled={isUpdating}
									className="flex-1 h-8 text-xs"
								>
									Save {tempValue} {milestone.unit}
								</Button>
								<Button
									status="info"
									onClick={() => setTempValue(null)}
									className="h-8 text-xs px-2"
								>
									Cancel
								</Button>
							</div>
						)}
				</div>
			);
		}

		return (
			<div className="space-y-4">
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<Label className="text-base">
							{milestone.milestoneName}
						</Label>
						{getStatusIcon()}
					</div>

					<div className="space-y-3">
						<div className="flex items-center gap-2">
							<Input
								type="number"
								value={currentValue}
								onChange={(e) =>
									!isLocked &&
									setTempValue(
										Math.min(
											total,
											Math.max(
												0,
												Number.parseFloat(
													e.target.value,
												) || 0,
											),
										),
									)
								}
								className="flex-1"
								style={{ minHeight: `${touchTargetSize}px` }}
								disabled={isLocked}
								min={0}
								max={total}
								step={
									milestone.unit === "ft" ||
									milestone.unit === "m"
										? 0.1
										: 1
								}
							/>
							<span className="text-sm font-medium min-w-[60px]">
								/ {total} {milestone.unit}
							</span>
						</div>

						<div className="flex items-center justify-between text-sm text-muted-foreground">
							<span>
								{currentValue} of {total} {milestone.unit}{" "}
								complete
							</span>
							<span className="font-medium">{percent}%</span>
						</div>

						<Progress value={percent} className="h-3" />
					</div>
				</div>

				{tempValue !== null &&
					tempValue !== milestone.quantityComplete && (
						<div className="flex gap-2">
							<Button
								onClick={handleUpdate}
								disabled={isUpdating}
								className="flex-1"
								style={{ minHeight: `${touchTargetSize}px` }}
							>
								Save {tempValue} {milestone.unit}
							</Button>
							<Button
								status="info"
								onClick={() => setTempValue(null)}
								style={{ minHeight: `${touchTargetSize}px` }}
							>
								Cancel
							</Button>
						</div>
					)}
			</div>
		);
	};

	if (isMobile) {
		return (
			<div
				className={cn(
					"bg-white border rounded-lg p-2 transition-shadow",
					!isLocked && "hover:shadow-sm",
				)}
			>
				<div className="flex items-center justify-between mb-1">
					<div className="flex items-center gap-1">
						<Badge status="info" className="text-xs h-4 px-1">
							#{milestone.milestoneOrder || 1}
						</Badge>
						{milestone.creditWeight && (
							<Badge
								status="info"
								className="text-xs h-4 px-1"
							>
								{milestone.creditWeight}c
							</Badge>
						)}
					</div>
					{isLocked && (
						<Badge
							status="info"
							className="text-xs text-muted-foreground h-4 px-1"
						>
							<Lock className="h-3 w-3 mr-1" />
							Locked
						</Badge>
					)}
				</div>

				{workflowType === "MILESTONE_DISCRETE" &&
					renderDiscreteWorkflow()}
				{workflowType === "MILESTONE_PERCENTAGE" &&
					renderPercentageWorkflow()}
				{workflowType === "MILESTONE_QUANTITY" &&
					renderQuantityWorkflow()}

				{milestone.dependencies &&
					milestone.dependencies.length > 0 && (
						<div className="mt-1 pt-1 border-t">
							<p className="text-xs text-muted-foreground">
								Requires: {milestone.dependencies.join(", ")}
							</p>
						</div>
					)}
			</div>
		);
	}

	return (
		<Card
			className={cn("transition-shadow", !isLocked && "hover:shadow-md")}
		>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="text-lg flex items-center gap-2">
						<Badge status="info" className="text-xs">
							{milestone.milestoneOrder ||
								milestone.sequenceNumber ||
								1}{" "}
							of{" "}
							{milestone.totalInWorkflow ||
								milestone.milestoneOrder ||
								1}
						</Badge>
						{milestone.creditWeight && (
							<Badge status="info" className="text-xs">
								{milestone.creditWeight} credits
							</Badge>
						)}
					</CardTitle>
					{isLocked && (
						<Badge
							status="info"
							className="text-xs text-muted-foreground"
						>
							<Lock className="h-3 w-3 mr-1" />
							Locked
						</Badge>
					)}
				</div>
			</CardHeader>

			<CardContent>
				{workflowType === "MILESTONE_DISCRETE" &&
					renderDiscreteWorkflow()}
				{workflowType === "MILESTONE_PERCENTAGE" &&
					renderPercentageWorkflow()}
				{workflowType === "MILESTONE_QUANTITY" &&
					renderQuantityWorkflow()}

				{milestone.dependencies &&
					milestone.dependencies.length > 0 && (
						<div className="mt-4 pt-4 border-t">
							<p className="text-xs text-muted-foreground">
								Requires: {milestone.dependencies.join(", ")}
							</p>
						</div>
					)}
			</CardContent>
		</Card>
	);
}
