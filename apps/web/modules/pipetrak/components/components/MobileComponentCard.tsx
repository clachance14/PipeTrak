"use client";

import { Card, CardContent } from "@ui/components/card";
import { cn } from "@ui/lib";
import { MapPin } from "lucide-react";
import type { ComponentWithMilestones } from "../../types";
import { useMilestoneUpdateEngine } from "../milestones/core/MilestoneUpdateEngine";
import { MilestoneButtonRow } from "../milestones/mobile/MilestoneButtonRow";

interface MobileComponentCardProps {
	component: ComponentWithMilestones;
	isSelected: boolean;
	onSelect: (selected: boolean) => void;
	onClick: () => void;
	onQuickUpdate?: (status: string) => void;
	onEdit?: () => void;
	onDuplicate?: () => void;
	onDelete?: () => void;
}

export function MobileComponentCard({
	component,
	isSelected,
	onSelect,
	onClick,
}: MobileComponentCardProps) {
	// Access milestone update engine if available
	const milestoneEngine = useMilestoneUpdateEngine?.() || null;

	// Handle milestone updates using the engine directly
	const handleMilestoneUpdate = async (
		milestoneId: string,
		value: boolean | number,
	) => {
		console.log("MobileComponentCard: handleMilestoneUpdate called", {
			milestoneId,
			value,
			componentId: component.id,
		});

		if (!milestoneEngine) {
			console.error("MilestoneUpdateEngine not available");
			return;
		}

		// Find the milestone to get its name
		const milestone = component.milestones?.find(
			(m) => m.id === milestoneId,
		);
		if (!milestone) {
			console.error("Milestone not found:", milestoneId);
			return;
		}

		try {
			console.log("Calling milestoneEngine.updateMilestone", {
				milestoneId,
				componentId: component.id,
				milestoneName: milestone.milestoneName,
				workflowType: component.workflowType,
				value,
			});

			await milestoneEngine.updateMilestone(
				milestoneId,
				component.id,
				milestone.milestoneName,
				component.workflowType,
				value,
			);
			console.log(
				"Milestone updated successfully:",
				milestone.milestoneName,
				value,
			);
		} catch (error) {
			console.error("Failed to update milestone:", error);
		}
	};

	return (
		<Card
			className={cn(
				"relative w-full",
				isSelected && "ring-2 ring-primary shadow-lg",
			)}
			onClick={onClick}
		>
			<CardContent className="p-2 space-y-1">
				{/* Header Section - 24px */}
				<div className="flex items-center justify-between gap-2 h-6">
					{/* Left side: Checkbox, ID, Drawing */}
					<div className="flex items-center gap-1.5 flex-1 min-w-0">
						<input
							type="checkbox"
							checked={isSelected}
							onChange={(e) => {
								e.stopPropagation();
								onSelect(e.target.checked);
							}}
							className="h-5 w-5 rounded border-gray-300 flex-shrink-0"
							onClick={(e) => {
								e.stopPropagation();
							}}
						/>
						<div className="flex items-center gap-1.5 min-w-0">
							<MapPin className="h-3 w-3 text-blue-600 flex-shrink-0" />
							<span className="text-xs text-blue-600 font-medium truncate">
								{component.drawingNumber}
							</span>
						</div>
						<h3 className="font-semibold text-xs truncate">
							{component.componentId}
						</h3>
					</div>

					{/* Right side: Progress percentage */}
					<div className="text-right flex-shrink-0">
						<div className="text-sm font-bold text-primary">
							{component.completionPercent || 0}%
						</div>
					</div>
				</div>

				{/* Meta Section - 16px */}
				<div className="flex items-center gap-1.5 text-[10px] text-muted-foreground h-4 overflow-hidden">
					{component.type && (
						<span className="font-medium truncate">
							{component.type}
						</span>
					)}
					{component.size && (
						<span className="truncate">• {component.size}</span>
					)}
					{component.area && (
						<div className="flex items-center gap-0.5 truncate">
							<MapPin className="h-2.5 w-2.5 flex-shrink-0" />
							<span className="truncate">{component.area}</span>
						</div>
					)}
				</div>

				{/* Milestone Button Section - 40px */}
				{component.milestones && component.milestones.length > 0 && (
					<MilestoneButtonRow
						milestones={component.milestones}
						workflowType={component.workflowType}
						componentId={component.id}
						componentType={component.type}
						onMilestoneComplete={(milestoneId) => {
							console.log(
								"MobileComponentCard: onMilestoneComplete triggered",
								milestoneId,
							);
							handleMilestoneUpdate(milestoneId, true);
						}}
						onMilestoneUncomplete={(milestoneId) => {
							console.log(
								"MobileComponentCard: onMilestoneUncomplete triggered",
								milestoneId,
							);
							handleMilestoneUpdate(milestoneId, false);
						}}
						isLoading={milestoneEngine?.hasPendingUpdates}
						hasError={(milestoneId) =>
							milestoneEngine?.getOperationStatus(milestoneId) ===
							"error"
						}
					/>
				)}
			</CardContent>
		</Card>
	);
}
