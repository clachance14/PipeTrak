"use client";

import { Card, CardContent } from "@ui/components/card";
import { cn } from "@ui/lib";
import { MapPin } from "lucide-react";
import { useState } from "react";
import type { ComponentWithMilestones } from "../../types";
import { useMilestoneUpdateEngine } from "../milestones/core/MilestoneUpdateEngine";
import { MilestoneButtonRow } from "../milestones/mobile/MilestoneButtonRow";
import { WeldMilestoneModal } from "../milestones/WeldMilestoneModal";

interface MobileComponentCardProps {
	component: ComponentWithMilestones;
	isSelected: boolean;
	onSelect: (selected: boolean) => void;
	onClick: () => void;
	onQuickUpdate?: (status: string) => void;
	onEdit?: () => void;
	onDuplicate?: () => void;
	onDelete?: () => void;
	projectId?: string;
	onWeldModalChange?: (open: boolean) => void;
}

export function MobileComponentCard({
	component,
	isSelected,
	onSelect,
	onClick,
	projectId,
	onWeldModalChange,
}: MobileComponentCardProps) {
	// Access milestone update engine if available
	const milestoneEngine = useMilestoneUpdateEngine?.() || null;

	// State for weld milestone modal
	const [showWeldModal, setShowWeldModal] = useState(false);
	const [selectedWeldMilestone, setSelectedWeldMilestone] = useState<any>(null);

	// Handle milestone updates using the engine directly
	const handleMilestoneUpdate = async (
		milestoneId: string,
		value: boolean | number,
	) => {

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

		// For field weld components with "Weld Made" milestone, open the welder selection modal
		if (
			component.type === "FIELD_WELD" &&
			milestone.milestoneName === "Weld Made" &&
			value === true &&
			projectId
		) {
			setSelectedWeldMilestone(milestone);
			setShowWeldModal(true);
			onWeldModalChange?.(true);
			return;
		}

		try {

			await milestoneEngine.updateMilestone(
				milestoneId,
				component.id,
				milestone.milestoneName,
				component.workflowType,
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
						componentType={component.type || undefined}
						onMilestoneComplete={(milestoneId) => {
							handleMilestoneUpdate(milestoneId, true);
						}}
						onMilestoneUncomplete={(milestoneId) => {
							handleMilestoneUpdate(milestoneId, false);
						}}
						isLoading={(milestoneId) => {
							// Access React state object directly to ensure re-renders
							return milestoneEngine?.operationStatuses?.[milestoneId] === "pending" || false;
						}}
						hasError={(milestoneId) => {
							// Access React state object directly to ensure re-renders
							return milestoneEngine?.operationStatuses?.[milestoneId] === "error" || false;
						}}
						hasRecentSuccess={(milestoneId) => {
							// Access React state object directly to ensure re-renders
							return milestoneEngine?.recentSuccesses?.[milestoneId] || false;
						}}
					/>
				)}
			</CardContent>

			{/* Weld Milestone Modal for Field Welds */}
			{selectedWeldMilestone && component.type === "FIELD_WELD" && projectId && (
				<WeldMilestoneModal
					open={showWeldModal}
					onOpenChange={(open) => {
						setShowWeldModal(open);
						onWeldModalChange?.(open);
					}}
					component={{
						id: component.id,
						componentId: component.componentId,
						displayId: component.displayId || component.componentId,
						projectId: projectId,
					}}
					milestone={{
						id: selectedWeldMilestone.id,
						milestoneName: selectedWeldMilestone.milestoneName,
						isCompleted: selectedWeldMilestone.isCompleted,
					}}
					onSuccess={async (data) => {
						// Update the milestone with welder information using direct API call
						if (selectedWeldMilestone && milestoneEngine) {
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
								await milestoneEngine.updateMilestone(
									selectedWeldMilestone.id,
									component.id,
									selectedWeldMilestone.milestoneName,
									component.workflowType,
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
						onWeldModalChange?.(false);
					}}
				/>
			)}
		</Card>
	);
}
