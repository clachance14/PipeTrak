"use client";

import { Button } from "@ui/components/button";
import { Checkbox } from "@ui/components/checkbox";
import { Input } from "@ui/components/input";
import { Progress } from "@ui/components/progress";
import { Slider } from "@ui/components/slider";
import { Check, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { MarkWeldCompleteModal } from "../../qc/components/MarkWeldCompleteModal";
import type { Component, ComponentMilestone } from "../../types";
import { updateComponentMilestone } from "../lib/actions";

interface MilestoneEditorProps {
	component: Component;
	milestones: ComponentMilestone[];
	onUpdate?: (componentId: string, updates: any) => void;
	onProgressChange?: (progress: number) => void;
}

export function MilestoneEditor({
	component,
	milestones,
	onUpdate,
	onProgressChange,
}: MilestoneEditorProps) {
	const [editedMilestones, setEditedMilestones] = useState<
		Record<string, any>
	>({});
	const [isSaving, setIsSaving] = useState(false);
	const [showWeldModal, setShowWeldModal] = useState(false);
	const [selectedWeldMilestone, setSelectedWeldMilestone] =
		useState<ComponentMilestone | null>(null);

	// Calculate current progress including unsaved edits
	const currentProgress = useMemo(() => {
		const updatedMilestones = milestones.map((m) => {
			const changes = editedMilestones[m.id];
			return changes ? { ...m, ...changes } : m;
		});

		const completedCount = updatedMilestones.filter(
			(m) => m.isCompleted,
		).length;
		const progress =
			updatedMilestones.length > 0
				? Math.round((completedCount / updatedMilestones.length) * 100)
				: 0;

		return progress;
	}, [milestones, editedMilestones]);

	// Notify parent of progress changes
	useEffect(() => {
		if (onProgressChange) {
			onProgressChange(currentProgress);
		}
	}, [currentProgress, onProgressChange]);

	const handleMilestoneChange = (
		milestoneId: string,
		field: string,
		value: any,
	) => {
		// For field weld components with "Weld" milestone completion, open the welder selection modal
		const milestone = milestones.find((m) => m.id === milestoneId);
		if (
			component.type === "FIELD_WELD" &&
			milestone?.milestoneName === "Weld" &&
			field === "isCompleted" &&
			value === true
		) {
			// Check if component has a valid weldId before opening the modal
			if (!component.weldId) {
				console.error(
					"Cannot complete weld milestone: component.weldId is missing",
					{ component, milestone },
				);
				toast.error(
					"This field weld component is missing a weld ID. Cannot complete weld milestone.",
				);
				return;
			}

			console.log("Opening weld completion modal for component:", {
				componentId: component.id,
				weldId: component.weldId,
				milestone,
			});

			setSelectedWeldMilestone(milestone);
			setShowWeldModal(true);
			return;
		}

		setEditedMilestones((prev) => ({
			...prev,
			[milestoneId]: {
				...prev[milestoneId],
				[field]: value,
			},
		}));
	};

	const handleSave = async () => {
		if (Object.keys(editedMilestones).length === 0) {
			toast.info("No changes to save");
			return;
		}

		setIsSaving(true);

		try {
			// Direct API calls to update milestones
			const updates = Object.entries(editedMilestones)
				.map(([milestoneId, changes]) => {
					const milestone = milestones.find(
						(m) => m.id === milestoneId,
					);
					if (!milestone) return null;

					return updateComponentMilestone(
						component.id,
						milestone.id,
						changes,
					);
				})
				.filter(Boolean);

			await Promise.all(updates);

			toast.success("Milestones updated successfully");
			setEditedMilestones({});

			// Trigger parent update callback if provided
			if (onUpdate) {
				// Calculate new progress based on updated milestones
				const updatedMilestones = milestones.map((m) => {
					const changes = editedMilestones[m.id];
					return changes ? { ...m, ...changes } : m;
				});

				const completedCount = updatedMilestones.filter(
					(m) => m.isCompleted,
				).length;
				const progress =
					updatedMilestones.length > 0
						? Math.round(
								(completedCount / updatedMilestones.length) *
									100,
							)
						: 0;

				onUpdate(component.id, {
					milestones: updatedMilestones,
					completionPercent: progress,
					status:
						progress === 100
							? "COMPLETED"
							: progress > 0
								? "IN_PROGRESS"
								: "NOT_STARTED",
				});
			}

			// No need to reload - real-time updates handle it
		} catch (error) {
			console.error("Error saving milestones:", error);
			toast.error("Failed to save milestones");
		} finally {
			setIsSaving(false);
		}
	};

	const renderMilestoneControl = (milestone: ComponentMilestone) => {
		const edited = editedMilestones[milestone.id] || {};

		switch (component.workflowType) {
			case "MILESTONE_DISCRETE": {
				const isCompleted =
					edited.isCompleted !== undefined
						? edited.isCompleted
						: milestone.isCompleted;
				return (
					<button
						type="button"
						className="flex items-center gap-3 cursor-pointer select-none py-3 px-3 -mx-1 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-[48px] w-full text-left bg-transparent border-none"
						onClick={() =>
							!isSaving &&
							handleMilestoneChange(
								milestone.id,
								"isCompleted",
								!isCompleted,
							)
						}
						disabled={isSaving}
						aria-label={`Toggle ${milestone.milestoneName} milestone`}
					>
						<Checkbox
							checked={isCompleted}
							onCheckedChange={(checked) =>
								handleMilestoneChange(
									milestone.id,
									"isCompleted",
									checked,
								)
							}
							disabled={isSaving}
							className="h-5 w-5 pointer-events-none"
							aria-hidden="true"
						/>
						<span
							className={`text-base flex-1 ${isCompleted ? "line-through text-muted-foreground" : ""}`}
						>
							{milestone.milestoneName}
						</span>
						{isCompleted && (
							<Check className="h-4 w-4 text-green-600" />
						)}
					</button>
				);
			}

			case "MILESTONE_PERCENTAGE": {
				const percentage =
					edited.percentageComplete !== undefined
						? edited.percentageComplete
						: milestone.percentageComplete || 0;
				return (
					<div className="space-y-1">
						<div className="flex items-center justify-between">
							<span className="text-sm">
								{milestone.milestoneName}
							</span>
							<span className="text-xs font-medium">
								{percentage}%
							</span>
						</div>
						<Slider
							value={[percentage]}
							onValueChange={(value) =>
								handleMilestoneChange(
									milestone.id,
									"percentageComplete",
									value[0],
								)
							}
							min={0}
							max={100}
							step={5}
							disabled={isSaving}
							className="w-full"
						/>
						<Progress value={percentage} className="h-1.5" />
					</div>
				);
			}

			case "MILESTONE_QUANTITY": {
				const quantityComplete =
					edited.quantityComplete !== undefined
						? edited.quantityComplete
						: milestone.quantityComplete || 0;
				const quantityTotal =
					milestone.quantityTotal || component.totalQuantity || 0;
				const quantityPercent =
					quantityTotal > 0
						? (quantityComplete / quantityTotal) * 100
						: 0;

				return (
					<div className="space-y-1">
						<div className="flex items-center justify-between">
							<span className="text-sm">
								{milestone.milestoneName}
							</span>
							<span className="text-xs text-muted-foreground">
								{quantityComplete} / {quantityTotal}
							</span>
						</div>
						<div className="flex items-center gap-2">
							<Input
								type="number"
								value={quantityComplete}
								onChange={(e) =>
									handleMilestoneChange(
										milestone.id,
										"quantityComplete",
										Number.parseInt(e.target.value) || 0,
									)
								}
								min={0}
								max={quantityTotal}
								disabled={isSaving}
								className="w-20 h-7 text-xs"
							/>
							<Progress
								value={quantityPercent}
								className="flex-1 h-1.5"
							/>
							<span className="text-xs font-medium min-w-[2.5rem]">
								{Math.round(quantityPercent)}%
							</span>
						</div>
					</div>
				);
			}

			default:
				return null;
		}
	};

	const hasChanges = Object.keys(editedMilestones).length > 0;

	return (
		<div className="rounded-lg border">
			<div className="p-3 border-b">
				<div className="flex items-center justify-between">
					<h3 className="font-semibold text-sm">Milestones</h3>
					{hasChanges && (
						<Button
							size="sm"
							onClick={handleSave}
							disabled={isSaving}
							className="h-7 px-2 text-xs"
						>
							{isSaving ? (
								"Saving..."
							) : (
								<>
									<Save className="mr-1 h-3 w-3" />
									Save
								</>
							)}
						</Button>
					)}
				</div>
			</div>

			<div className="p-3 space-y-2">
				{milestones.length === 0 ? (
					<p className="text-muted-foreground text-center py-4 text-sm">
						No milestones configured for this component
					</p>
				) : (
					milestones.map((milestone) => (
						<div
							key={milestone.id}
							className={`rounded transition-all ${
								editedMilestones[milestone.id]
									? "bg-blue-50 border border-blue-200"
									: ""
							}`}
						>
							{renderMilestoneControl(milestone)}
							{milestone.completedAt && (
								<p className="text-xs text-muted-foreground mt-1 px-7">
									Completed:{" "}
									{new Date(
										milestone.completedAt,
									).toLocaleDateString()}
								</p>
							)}
						</div>
					))
				)}
			</div>

			{/* Compact Progress Summary */}
			<div className="p-2 border-t bg-gray-50">
				<div className="flex items-center justify-between">
					<span className="text-xs text-muted-foreground">
						Overall Progress
					</span>
					<div className="flex items-center gap-2">
						<Progress
							value={currentProgress}
							className="w-24 h-1.5"
						/>
						<span className="font-semibold text-sm">
							{currentProgress}%
						</span>
					</div>
				</div>
			</div>

			{/* Weld Complete Modal for Field Welds */}
			{selectedWeldMilestone &&
				component.type === "FIELD_WELD" &&
				component.weldId && (
					<MarkWeldCompleteModal
						open={showWeldModal}
						onOpenChange={setShowWeldModal}
						fieldWeld={{
							id: component.weldId, // This is the FieldWeld.weldIdNumber, not the FieldWeld.id
							weldIdNumber: component.weldId, // Use weldId as the weld identifier
							projectId: component.projectId || "",
						}}
						onMilestoneUpdate={async (
							welderId: string,
							dateWelded: Date,
						) => {
							// Update the milestone with welderId when weld is completed
							if (selectedWeldMilestone) {
								await fetch(
									`/api/pipetrak/milestones/${selectedWeldMilestone.id}`,
									{
										method: "PATCH",
										headers: {
											"Content-Type": "application/json",
										},
										body: JSON.stringify({
											isCompleted: true,
											welderId: welderId,
											effectiveDate: dateWelded
												.toISOString()
												.split("T")[0],
										}),
									},
								);

								// Mark the milestone as completed in the local editor state as well
								setEditedMilestones((prev) => ({
									...prev,
									[selectedWeldMilestone.id]: {
										...prev[selectedWeldMilestone.id],
										isCompleted: true,
									},
								}));
							}
						}}
						onSuccess={async () => {
							setSelectedWeldMilestone(null);
						}}
					/>
				)}
		</div>
	);
}
