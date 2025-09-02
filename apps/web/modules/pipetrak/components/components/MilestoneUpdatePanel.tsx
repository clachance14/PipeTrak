"use client";

import { useState, useTransition } from "react";
import { MilestoneUpdateCard } from "./MilestoneUpdateCard";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Progress } from "@ui/components/progress";
import { Badge } from "@ui/components/badge";
import { toast } from "sonner";
import {
	CheckCircle2,
	AlertCircle,
	RefreshCw,
	Save,
	Package,
} from "lucide-react";
import { cn } from "@ui/lib";
import type {
	ComponentWithMilestones,
	ComponentMilestone,
	WorkflowType,
} from "../../types";
import { apiClient } from "@shared/lib/api-client";

interface MilestoneUpdatePanelProps {
	component: ComponentWithMilestones;
	workflowType: WorkflowType;
	onUpdate?: () => void;
	touchTargetSize?: number;
	isMobile?: boolean;
}

export function MilestoneUpdatePanel({
	component,
	workflowType,
	onUpdate,
	touchTargetSize = 52,
	isMobile = false,
}: MilestoneUpdatePanelProps) {
	const [milestones, setMilestones] = useState(component.milestones);
	const [isPending, startTransition] = useTransition();
	const [pendingUpdates, setPendingUpdates] = useState<Map<string, any>>(
		new Map(),
	);

	// Calculate overall progress
	const totalCredits = milestones.reduce(
		(sum, m) => sum + (m.creditWeight || 0),
		0,
	);
	const earnedCredits = milestones.reduce((sum, m) => {
		if (workflowType === "MILESTONE_DISCRETE") {
			return sum + (m.isCompleted ? m.creditWeight || 0 : 0);
		}
		if (workflowType === "MILESTONE_PERCENTAGE") {
			return (
				sum +
				((m.percentageComplete || 0) / 100) * (m.creditWeight || 0)
			);
		}
		const percent =
			(m.quantityTotal || 0) > 0
				? (m.quantityComplete || 0) / (m.quantityTotal || 1)
				: 0;
		return sum + percent * (m.creditWeight || 0);
	}, 0);

	const overallProgress =
		totalCredits > 0 ? Math.round((earnedCredits / totalCredits) * 100) : 0;

	// Check if milestone is locked (previous milestone incomplete)
	const isMilestoneLocked = (milestone: ComponentMilestone): boolean => {
		// If no dependencies, check sequential completion
		if (!milestone.dependencies || milestone.dependencies.length === 0) {
			if (milestone.milestoneOrder === 1) return false;

			const previousMilestone = milestones.find(
				(m) => m.milestoneOrder === milestone.milestoneOrder - 1,
			);

			if (!previousMilestone) return false;

			if (workflowType === "MILESTONE_DISCRETE") {
				return !previousMilestone.isCompleted;
			}
			if (workflowType === "MILESTONE_PERCENTAGE") {
				return (previousMilestone.percentageComplete || 0) < 100;
			}
			return (
				(previousMilestone.quantityComplete || 0) <
				(previousMilestone.quantityTotal || 0)
			);
		}

		// Check dependencies
		return milestone.dependencies.some((depName) => {
			const dep = milestones.find((m) => m.milestoneName === depName);
			if (!dep) return false;

			if (workflowType === "MILESTONE_DISCRETE") {
				return !dep.isCompleted;
			}
			if (workflowType === "MILESTONE_PERCENTAGE") {
				return (dep.percentageComplete || 0) < 100;
			}
			return (dep.quantityComplete || 0) < (dep.quantityTotal || 0);
		});
	};

	const handleMilestoneUpdate = async (
		milestoneId: string,
		value: number | boolean,
	) => {
		// Store pending update
		setPendingUpdates((prev) => new Map(prev).set(milestoneId, value));

		// Update local state optimistically
		setMilestones((prev) =>
			prev.map((m) => {
				if (m.id !== milestoneId) return m;

				if (workflowType === "MILESTONE_DISCRETE") {
					return { ...m, isCompleted: value as boolean };
				}
				if (workflowType === "MILESTONE_PERCENTAGE") {
					return { ...m, percentageComplete: value as number };
				}
				return { ...m, quantityComplete: value as number };
			}),
		);

		toast.info("Update pending - click Save All to apply");
	};

	const handleSaveAll = async () => {
		if (pendingUpdates.size === 0) {
			toast.info("No pending updates to save");
			return;
		}

		startTransition(async () => {
			try {
				// Prepare updates array
				const updates = Array.from(pendingUpdates.entries()).map(
					([milestoneId, value]) => ({
						milestoneId,
						value,
						workflowType,
					}),
				);

				// Call API to update milestones
				const response = await apiClient.pipetrak.milestones[
					"bulk-update"
				].$post({
					json: {
						updates: Array.from(pendingUpdates.entries()).map(
							([milestoneId, value]) => {
								const milestone = milestones.find(
									(m) => m.id === milestoneId,
								);
								return {
									componentId: component.id,
									milestoneName:
										milestone?.milestoneName || "",
									isCompleted:
										workflowType === "MILESTONE_DISCRETE"
											? (value as boolean)
											: undefined,
									percentageValue:
										workflowType === "MILESTONE_PERCENTAGE"
											? (value as number)
											: undefined,
									quantityValue:
										workflowType === "MILESTONE_QUANTITY"
											? (value as number)
											: undefined,
								};
							},
						),
					},
				});

				if (!response.ok) {
					throw new Error("Failed to update milestones");
				}

				setPendingUpdates(new Map());
				toast.success(
					`${updates.length} milestone${updates.length > 1 ? "s" : ""} updated successfully`,
				);

				// Call parent update callback
				if (onUpdate) {
					onUpdate();
				}
			} catch (error) {
				console.error("Error updating milestones:", error);
				toast.error("Failed to save milestone updates");

				// Revert optimistic updates
				setMilestones(component.milestones);
				setPendingUpdates(new Map());
			}
		});
	};

	const handleRefresh = async () => {
		startTransition(async () => {
			try {
				const response = await apiClient.pipetrak.components[
					":id"
				].$get({
					param: { id: component.id },
				});

				if (!response.ok) {
					throw new Error("Failed to fetch component");
				}

				const data = await response.json();
				setMilestones(data.milestones);
				setPendingUpdates(new Map());
				toast.success("Milestones refreshed");
			} catch (error) {
				console.error("Error refreshing milestones:", error);
				toast.error("Failed to refresh milestones");
			}
		});
	};

	if (isMobile) {
		return (
			<div className="flex flex-col h-full p-3">
				{/* Component Header - Compact on mobile */}
				<div className="bg-white rounded-lg p-2 border shadow-sm mb-2 flex-shrink-0">
					<div className="flex items-center justify-between">
						<div className="flex-1 min-w-0">
							<h3 className="font-semibold text-sm truncate">
								{component.componentId}
							</h3>
							<div className="flex items-center gap-2 mt-1">
								<Progress
									value={overallProgress}
									className="h-2 flex-1"
								/>
								<Badge
									status="info"
									className={cn(
										"text-xs h-5",
										overallProgress === 100 &&
											"bg-fieldComplete/10 text-fieldComplete border-fieldComplete/20",
										overallProgress > 0 &&
											overallProgress < 100 &&
											"bg-blue-100 text-blue-700 border-blue-200",
										overallProgress === 0 &&
											"bg-fieldPending/10 text-fieldPending border-fieldPending/20",
									)}
								>
									{overallProgress}%
								</Badge>
							</div>
						</div>
					</div>
				</div>

				{/* Milestone Cards - Scrollable */}
				<div className="flex-1 min-h-0 overflow-y-auto space-y-1 mb-1">
					{milestones
						.sort(
							(a, b) =>
								(a.milestoneOrder || 0) -
								(b.milestoneOrder || 0),
						)
						.map((milestone) => (
							<MilestoneUpdateCard
								key={milestone.id}
								milestone={milestone}
								workflowType={workflowType}
								isLocked={isMilestoneLocked(milestone)}
								onUpdate={(value) =>
									handleMilestoneUpdate(milestone.id, value)
								}
								touchTargetSize={touchTargetSize}
								isMobile={isMobile}
							/>
						))}
				</div>

				{/* Sticky Action Buttons at Bottom */}
				<div className="flex-shrink-0 bg-white border-t pt-2 -mx-3 px-3">
					<div className="flex gap-2">
						<Button
							onClick={handleSaveAll}
							disabled={isPending || pendingUpdates.size === 0}
							className="flex-1 h-11"
						>
							<Save className="h-4 w-4 mr-2" />
							Save All ({pendingUpdates.size})
						</Button>
						<Button
							status="info"
							onClick={handleRefresh}
							disabled={isPending}
							className="h-11 px-3"
						>
							<RefreshCw
								className={cn(
									"h-4 w-4",
									isPending && "animate-spin",
								)}
							/>
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className={cn("space-y-4", isMobile && "space-y-2")}>
			{/* Component Header - Desktop */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="flex items-center gap-2">
								<Package className="h-5 w-5" />
								{component.componentId}
							</CardTitle>
							<p className="text-sm text-muted-foreground mt-1">
								{component.description}
							</p>
						</div>
						<Badge
							status="info"
							className={cn(
								"text-sm",
								overallProgress === 100 &&
									"bg-fieldComplete/10 text-fieldComplete border-fieldComplete/20",
								overallProgress > 0 &&
									overallProgress < 100 &&
									"bg-blue-100 text-blue-700 border-blue-200",
								overallProgress === 0 &&
									"bg-fieldPending/10 text-fieldPending border-fieldPending/20",
							)}
						>
							{overallProgress === 100 ? (
								<CheckCircle2 className="h-4 w-4 mr-1" />
							) : (
								<AlertCircle className="h-4 w-4 mr-1" />
							)}
							{overallProgress}% Complete
						</Badge>
					</div>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground">
								Overall Progress
							</span>
							<span className="font-medium">
								{earnedCredits.toFixed(1)} / {totalCredits}{" "}
								credits
							</span>
						</div>
						<Progress value={overallProgress} className="h-3" />
					</div>
				</CardContent>
			</Card>

			{/* Action Buttons */}
			<div className="flex gap-2">
				<Button
					onClick={handleSaveAll}
					disabled={isPending || pendingUpdates.size === 0}
					className="flex-1"
					style={{ minHeight: `${touchTargetSize}px` }}
				>
					<Save className="h-4 w-4 mr-2" />
					Save All ({pendingUpdates.size})
				</Button>
				<Button
					status="info"
					onClick={handleRefresh}
					disabled={isPending}
					style={{ minHeight: `${touchTargetSize}px` }}
				>
					<RefreshCw
						className={cn("h-4 w-4", isPending && "animate-spin")}
					/>
				</Button>
			</div>

			{/* Milestone Cards */}
			<div className="space-y-3">
				{milestones
					.sort(
						(a, b) =>
							(a.milestoneOrder || 0) - (b.milestoneOrder || 0),
					)
					.map((milestone) => (
						<MilestoneUpdateCard
							key={milestone.id}
							milestone={milestone}
							workflowType={workflowType}
							isLocked={isMilestoneLocked(milestone)}
							onUpdate={(value) =>
								handleMilestoneUpdate(milestone.id, value)
							}
							touchTargetSize={touchTargetSize}
							isMobile={isMobile}
						/>
					))}
			</div>

			{/* Summary */}
			{milestones.length > 0 && (
				<Card>
					<CardContent className="pt-6">
						<div className="grid grid-cols-2 gap-4 text-sm">
							<div className="space-y-1">
								<p className="text-muted-foreground">
									Workflow Type
								</p>
								<p className="font-medium capitalize">
									{workflowType
										.toLowerCase()
										.replace("_", " ")}
								</p>
							</div>
							<div className="space-y-1">
								<p className="text-muted-foreground">
									Total Milestones
								</p>
								<p className="font-medium">
									{milestones.length}
								</p>
							</div>
							<div className="space-y-1">
								<p className="text-muted-foreground">Area</p>
								<p className="font-medium">
									{component.area || "N/A"}
								</p>
							</div>
							<div className="space-y-1">
								<p className="text-muted-foreground">System</p>
								<p className="font-medium">
									{component.system || "N/A"}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
