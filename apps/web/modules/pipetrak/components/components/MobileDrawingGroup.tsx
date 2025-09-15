"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { Progress } from "@ui/components/progress";
import { Button } from "@ui/components/button";
import { Checkbox } from "@ui/components/checkbox";
import {
	ChevronDown,
	ChevronRight,
	MapPin,
	Check,
	AlertCircle,
	Clock,
	Minus,
	Zap,
	CheckSquare,
} from "lucide-react";
import { cn } from "@ui/lib";
import { MobileComponentCard } from "./MobileComponentCard";
import type { ComponentWithMilestones } from "../../types";

interface MobileDrawingGroupProps {
	drawingNumber: string;
	components: ComponentWithMilestones[];
	isExpanded: boolean;
	onToggleExpand: () => void;
	selectedIds: Set<string>;
	onSelectComponent: (componentId: string, selected: boolean) => void;
	onSelectAll: (componentIds: string[], selected: boolean) => void;
	onComponentClick: (componentId: string) => void;
	onQuickUpdate: (componentId: string, status: string) => void;
	onEdit: (componentId: string) => void;
	projectId?: string;
	onWeldModalChange?: (open: boolean) => void;
}

export function MobileDrawingGroup({
	drawingNumber,
	components,
	isExpanded,
	onToggleExpand,
	selectedIds,
	onSelectComponent,
	onSelectAll,
	onComponentClick,
	onQuickUpdate,
	onEdit,
	projectId,
	onWeldModalChange,
}: MobileDrawingGroupProps) {
	// Calculate drawing-level statistics including milestones
	const stats = useMemo(() => {
		const total = components.length;
		const completed = components.filter(
			(c) => c.status === "COMPLETED",
		).length;
		const inProgress = components.filter(
			(c) => c.status === "IN_PROGRESS",
		).length;
		const notStarted = components.filter(
			(c) => c.status === "NOT_STARTED",
		).length;

		const totalProgress = components.reduce(
			(sum, c) => sum + (c.completionPercent || 0),
			0,
		);
		const avgProgress = total > 0 ? Math.round(totalProgress / total) : 0;

		const selectedInGroup = components.filter((c) =>
			selectedIds.has(c.id),
		).length;
		const allSelected = selectedInGroup === total && total > 0;
		const someSelected = selectedInGroup > 0 && selectedInGroup < total;

		// Calculate milestone statistics
		let totalMilestones = 0;
		let completedMilestones = 0;
		const milestoneDistribution = new Map<string, number>();

		components.forEach((component) => {
			if (component.milestones && component.milestones.length > 0) {
				totalMilestones += component.milestones.length;
				completedMilestones += component.milestones.filter(
					(m) => m.isCompleted,
				).length;

				// Find current milestone for distribution
				const currentMilestone = component.milestones.find(
					(m) => !m.isCompleted,
				);
				const currentMilestoneName = currentMilestone
					? currentMilestone.milestoneName
					: "All Complete";

				milestoneDistribution.set(
					currentMilestoneName,
					(milestoneDistribution.get(currentMilestoneName) || 0) + 1,
				);
			}
		});

		// Get most common current milestone
		let mostCommonMilestone = "";
		let maxCount = 0;
		milestoneDistribution.forEach((count, name) => {
			if (count > maxCount) {
				maxCount = count;
				mostCommonMilestone = name;
			}
		});

		const milestoneProgress =
			totalMilestones > 0
				? Math.round((completedMilestones / totalMilestones) * 100)
				: 0;

		return {
			total,
			completed,
			inProgress,
			notStarted,
			avgProgress,
			selectedInGroup,
			allSelected,
			someSelected,
			totalMilestones,
			completedMilestones,
			milestoneProgress,
			mostCommonMilestone,
			componentsAtMilestone: maxCount,
		};
	}, [components, selectedIds]);

	// Extract unique areas, systems, and test packages for display
	const uniqueData = useMemo(() => {
		const areas = new Set(
			components.map((c) => c.area).filter((area): area is string => Boolean(area))
		);
		const systems = new Set(
			components.map((c) => c.system).filter((system): system is string => Boolean(system))
		);
		const testPackages = new Set(
			components.map((c) => c.testPackage).filter((pkg): pkg is string => Boolean(pkg))
		);

		return {
			areas: Array.from(areas).slice(0, 2), // Show fewer on mobile
			systems: Array.from(systems).slice(0, 2),
			testPackages: Array.from(testPackages).slice(0, 2),
			hasMoreAreas: areas.size > 2,
			hasMoreSystems: systems.size > 2,
			hasMoreTestPackages: testPackages.size > 2,
		};
	}, [components]);

	// Determine drawing status color
	const getStatusColor = () => {
		if (stats.completed === stats.total && stats.total > 0) {
			return "border-fieldComplete bg-fieldComplete/5";
		}
		if (stats.inProgress > 0 || stats.completed > 0) {
			return "border-blue-500 bg-blue-50/50";
		}
		return "border-gray-300 bg-white";
	};

	// Get status icon
	const getStatusIcon = () => {
		if (stats.completed === stats.total && stats.total > 0) {
			return <Check className="h-5 w-5 text-fieldComplete" />;
		}
		if (stats.inProgress > 0) {
			return <Clock className="h-5 w-5 text-blue-600" />;
		}
		return <AlertCircle className="h-5 w-5 text-fieldPending" />;
	};

	const handleSelectAll = () => {
		const componentIds = components.map((c) => c.id);
		onSelectAll(componentIds, !stats.allSelected);
	};



	return (
		<div className="space-y-2 w-full">
			{/* Drawing Header Card */}
			<Card
				className={cn(
					"transition-all duration-200 w-full",
					getStatusColor(),
					stats.selectedInGroup > 0 && "ring-2 ring-primary",
				)}
			>
				<CardContent className="p-4 md:p-6">
					<div className="space-y-3 md:space-y-4">
						{/* Compact Header Row */}
						<div className="flex items-center gap-2">
							{/* Selection Checkbox */}
							<div
								onClick={(e: React.MouseEvent) => {
									e.stopPropagation();
									handleSelectAll();
								}}
								className="cursor-pointer"
							>
								{stats.someSelected && !stats.allSelected ? (
									<div className="h-6 w-6 md:h-7 md:w-7 rounded border-2 border-primary bg-primary flex items-center justify-center">
										<Minus className="h-4 w-4 text-primary-foreground" />
									</div>
								) : (
									<Checkbox
										checked={stats.allSelected}
										onCheckedChange={handleSelectAll}
										onClick={(e: React.MouseEvent) => e.stopPropagation()}
										className="h-6 w-6 md:h-7 md:w-7"
									/>
								)}
							</div>

							{/* Drawing Info - Single Line */}
							<div
								className="flex-1 cursor-pointer flex items-center justify-between"
								onClick={onToggleExpand}
							>
								<div className="flex items-center gap-2">
									<MapPin className="h-4 w-4 text-blue-600" />
									<h3 className="font-semibold text-base md:text-lg leading-tight">
										{drawingNumber || "No Drawing"}
									</h3>
									<Badge
										status="info"
										className="text-sm md:text-base px-3 py-1 min-h-[32px] flex items-center"
									>
										{stats.total}
									</Badge>
								</div>
								<div className="flex items-center gap-2">
									{stats.selectedInGroup > 0 && (
										<Badge
											status="warning"
											className="text-sm px-3 py-1 min-h-[32px] flex items-center"
										>
											{stats.selectedInGroup}
										</Badge>
									)}
									{getStatusIcon()}
									{isExpanded ? (
										<ChevronDown className="h-4 w-4 text-gray-500" />
									) : (
										<ChevronRight className="h-4 w-4 text-gray-500" />
									)}
								</div>
							</div>
						</div>

						{/* Areas, Systems, and Test Packages - Mobile optimized */}
						{(uniqueData.areas.length > 0 || uniqueData.systems.length > 0 || uniqueData.testPackages.length > 0) && (
							<div className="overflow-x-auto">
								<div className="flex items-center gap-2 w-max">
									{/* Areas */}
									{uniqueData.areas.length > 0 && (
										<div className="flex items-center gap-1 whitespace-nowrap">
											<MapPin className="h-3 w-3 text-blue-500" />
											<span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-xs font-medium">
												{uniqueData.areas.join(", ")}
												{uniqueData.hasMoreAreas && ` +${Math.max(0, new Set(components.map(c => c.area).filter(Boolean)).size - 2)}`}
											</span>
										</div>
									)}

									{/* Systems */}
									{uniqueData.systems.length > 0 && (
										<div className="flex items-center gap-1 whitespace-nowrap">
											<Zap className="h-3 w-3 text-green-500" />
											<span className="bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded text-xs font-medium">
												{uniqueData.systems.join(", ")}
												{uniqueData.hasMoreSystems && ` +${Math.max(0, new Set(components.map(c => c.system).filter(Boolean)).size - 2)}`}
											</span>
										</div>
									)}

									{/* Test Packages */}
									{uniqueData.testPackages.length > 0 && (
										<div className="flex items-center gap-1 whitespace-nowrap">
											<CheckSquare className="h-3 w-3 text-purple-500" />
											<span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-xs font-medium">
												{uniqueData.testPackages.join(", ")}
												{uniqueData.hasMoreTestPackages && ` +${Math.max(0, new Set(components.map(c => c.testPackage).filter(Boolean)).size - 2)}`}
											</span>
										</div>
									)}
								</div>
							</div>
						)}

						{/* Compact Progress Bar - No text label */}
						{stats.totalMilestones > 0 && (
							<div className="flex items-center gap-2">
								<Progress
									value={stats.avgProgress}
									className="flex-1 h-2"
								/>
								<div className="flex items-center gap-1 text-xs">
									<span className="font-medium">
										{stats.completedMilestones}/
										{stats.totalMilestones}
									</span>
									<span className="text-muted-foreground">
										({stats.avgProgress}%)
									</span>
								</div>
							</div>
						)}

						{/* Quick Actions - Show when collapsed and items selected */}
						{!isExpanded && stats.selectedInGroup > 0 && (
							<div className="flex gap-3 pt-4 border-t">
								<Button
									size="lg"
									variant="secondary"
									className="flex-1 min-h-[44px] text-base font-medium"
									onClick={(e: React.MouseEvent) => {
										e.stopPropagation();
										// Trigger bulk status update for selected components
										components
											.filter(
												(c) =>
													selectedIds.has(c.id) &&
													c.status === "NOT_STARTED",
											)
											.forEach((c) =>
												onQuickUpdate(
													c.id,
													"IN_PROGRESS",
												),
											);
									}}
								>
									Start Selected
								</Button>
								<Button
									size="lg"
									variant="secondary"
									className="flex-1 min-h-[44px] text-base font-medium"
									onClick={(e: React.MouseEvent) => {
										e.stopPropagation();
										// Trigger bulk status update for selected components
										components
											.filter(
												(c) =>
													selectedIds.has(c.id) &&
													c.status === "IN_PROGRESS",
											)
											.forEach((c) =>
												onQuickUpdate(
													c.id,
													"COMPLETED",
												),
											);
									}}
								>
									Complete Selected
								</Button>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Expanded Component List */}
			{isExpanded ? (
				<div className="space-y-4 md:space-y-6 pl-6 md:pl-8 border-l-4 border-blue-500">
					{components.length === 0 ? (
						<Card className="bg-gray-50">
							<CardContent className="p-4 text-center text-muted-foreground">
								No components in this drawing
							</CardContent>
						</Card>
					) : (
						<>
							{components.map((component) => (
								<MobileComponentCard
									key={component.id}
									component={component}
									isSelected={selectedIds.has(
										component.id,
									)}
									onSelect={(selected) =>
										onSelectComponent(
											component.id,
											selected,
										)
									}
									onClick={() =>
										onComponentClick(component.id)
									}
									onQuickUpdate={(status) =>
										onQuickUpdate(component.id, status)
									}
									onEdit={() => onEdit(component.id)}
									projectId={projectId}
									onWeldModalChange={onWeldModalChange}
								/>
							))}
						</>
					)}
				</div>
			) : null}

		</div>
	);
}
