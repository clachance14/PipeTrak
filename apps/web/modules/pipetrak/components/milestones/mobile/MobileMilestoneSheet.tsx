"use client";

import { useState, useRef, useEffect } from "react";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@ui/components/sheet";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import { Progress } from "@ui/components/progress";
import { ScrollArea } from "@ui/components/scroll-area";
import { MilestoneWorkflowRenderer } from "../core/MilestoneWorkflowRenderer";
import { useMilestoneUpdateEngine } from "../core/MilestoneUpdateEngine";
import { TouchMilestoneCard, getCompletionPercent } from "./TouchMilestoneCard";
import { SwipeActions } from "./SwipeActions";
import { OfflineIndicator } from "./OfflineIndicator";
import {
	ChevronUp,
	ChevronDown,
	Check,
	Clock,
	AlertCircle,
	Package,
} from "lucide-react";
import { cn } from "@ui/lib";
import type {
	ComponentWithMilestones,
	ComponentMilestone,
} from "../../../types";

interface MobileMilestoneSheetProps {
	isOpen: boolean;
	onClose: () => void;
	component: ComponentWithMilestones;
	selectedMilestoneId?: string;
}

type SheetHeight = "collapsed" | "partial" | "full";

export function MobileMilestoneSheet({
	isOpen,
	onClose,
	component,
	selectedMilestoneId,
}: MobileMilestoneSheetProps) {
	const [sheetHeight, setSheetHeight] = useState<SheetHeight>("partial");
	const [selectedMilestone, setSelectedMilestone] =
		useState<ComponentMilestone | null>(null);
	const dragRef = useRef<HTMLDivElement>(null);
	const startY = useRef<number>(0);
	const currentY = useRef<number>(0);

	const {
		updateMilestone,
		hasPendingUpdates,
		getOperationStatus,
		isOnline,
		offlineQueueCount,
		syncOfflineQueue,
	} = useMilestoneUpdateEngine();

	// Auto-select milestone if provided
	useEffect(() => {
		if (selectedMilestoneId && component.milestones) {
			const milestone = component.milestones.find(
				(m) => m.id === selectedMilestoneId,
			);
			if (milestone) {
				setSelectedMilestone(milestone);
				setSheetHeight("full");
			}
		}
	}, [selectedMilestoneId, component.milestones]);

	// Calculate progress stats
	const stats = {
		total: component.milestones?.length || 0,
		completed:
			component.milestones?.filter((m) => m.isCompleted).length || 0,
		inProgress:
			component.milestones?.filter(
				(m) =>
					!m.isCompleted &&
					getCompletionPercent(m, component.workflowType) > 0,
			).length || 0,
		pending:
			component.milestones?.filter(
				(m) =>
					!m.isCompleted &&
					getCompletionPercent(m, component.workflowType) === 0,
			).length || 0,
	};

	const overallProgress =
		stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

	const handleMilestoneUpdate = async (
		milestoneId: string,
		value: boolean | number,
	) => {
		const milestone = component.milestones?.find(
			(m) => m.id === milestoneId,
		);
		if (!milestone) return;

		await updateMilestone(
			milestoneId,
			component.id,
			milestone.milestoneName,
			component.workflowType,
			value,
		);
	};

	const handleMilestoneSelect = (milestone: ComponentMilestone) => {
		setSelectedMilestone(milestone);
		setSheetHeight("full");
	};

	const handleBackToList = () => {
		setSelectedMilestone(null);
		setSheetHeight("partial");
	};

	// Touch/drag handlers for sheet height control
	const handleTouchStart = (e: React.TouchEvent) => {
		startY.current = e.touches[0].clientY;
		currentY.current = startY.current;
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		currentY.current = e.touches[0].clientY;
	};

	const handleTouchEnd = () => {
		const deltaY = startY.current - currentY.current;
		const threshold = 50;

		if (Math.abs(deltaY) > threshold) {
			if (deltaY > 0) {
				// Swiped up
				setSheetHeight(
					sheetHeight === "collapsed" ? "partial" : "full",
				);
			} else {
				// Swiped down
				setSheetHeight(
					sheetHeight === "full" ? "partial" : "collapsed",
				);
			}
		}
	};

	const getHeightClass = () => {
		switch (sheetHeight) {
			case "collapsed":
				return "h-[120px]";
			case "partial":
				return "h-[50vh]";
			case "full":
				return "h-[90vh]";
			default:
				return "h-[50vh]";
		}
	};

	const renderHeader = () => (
		<SheetHeader className="px-4 pb-2">
			{/* Drag handle */}
			<div
				ref={dragRef}
				className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4 cursor-grab active:cursor-grabbing"
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
			/>

			<div className="flex items-center justify-between">
				<div className="flex-1 min-w-0">
					<SheetTitle className="text-lg flex items-center gap-2">
						<Package className="h-5 w-5" />
						{component.componentId}
					</SheetTitle>
					<SheetDescription>
						Update milestone progress for this component
					</SheetDescription>
					<p className="text-sm text-muted-foreground truncate">
						{component.description || "No description"}
					</p>
				</div>

				<div className="flex items-center gap-2">
					<OfflineIndicator
						isOnline={isOnline}
						queueCount={offlineQueueCount}
						onSync={syncOfflineQueue}
					/>
				</div>
			</div>

			{/* Progress overview */}
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4 text-sm">
						<span className="flex items-center gap-1">
							<Check className="h-4 w-4 text-fieldComplete" />
							{stats.completed}
						</span>
						<span className="flex items-center gap-1">
							<Clock className="h-4 w-4 text-blue-600" />
							{stats.inProgress}
						</span>
						<span className="flex items-center gap-1">
							<AlertCircle className="h-4 w-4 text-fieldPending" />
							{stats.pending}
						</span>
					</div>
					<span className="text-sm font-medium">
						{overallProgress}%
					</span>
				</div>
				<Progress value={overallProgress} className="h-2" />
			</div>
		</SheetHeader>
	);

	const renderMilestoneList = () => (
		<ScrollArea className="flex-1 px-4">
			<div className="space-y-3 pb-4">
				{component.milestones?.map((milestone, index) => {
					const isPending = hasPendingUpdates(milestone.id);
					const status = getOperationStatus(milestone.id);
					const isLocked =
						index > 0 &&
						!component.milestones![index - 1].isCompleted;

					return (
						<SwipeActions
							key={milestone.id}
							milestone={milestone}
							component={component}
							onUpdate={handleMilestoneUpdate}
							onSelect={() => handleMilestoneSelect(milestone)}
						>
							<TouchMilestoneCard
								milestone={milestone}
								component={component}
								isLocked={isLocked}
								isPending={isPending}
								status={status}
								onClick={() => handleMilestoneSelect(milestone)}
								className="w-full"
							/>
						</SwipeActions>
					);
				})}
			</div>
		</ScrollArea>
	);

	const renderMilestoneDetail = () => {
		if (!selectedMilestone) return null;

		const milestone =
			component.milestones?.find((m) => m.id === selectedMilestone.id) ||
			selectedMilestone;
		const milestoneIndex =
			component.milestones?.findIndex((m) => m.id === milestone.id) || 0;
		const isLocked =
			milestoneIndex > 0 &&
			!component.milestones![milestoneIndex - 1].isCompleted;

		return (
			<div className="flex-1 flex flex-col">
				{/* Detail header */}
				<div className="px-4 pb-2 border-b">
					<Button
						variant="ghost"
						onClick={handleBackToList}
						className="mb-2 h-8 px-2"
					>
						<ChevronDown className="h-4 w-4 mr-2" />
						Back to List
					</Button>

					<div className="flex items-center justify-between">
						<div>
							<h3 className="font-medium">
								{milestone.milestoneName}
							</h3>
							<div className="flex items-center gap-2 mt-1">
								<Badge status="info" className="text-xs">
									Step {milestoneIndex + 1} of{" "}
									{component.milestones?.length || 1}
								</Badge>
								{milestone.creditWeight && (
									<Badge status="info" className="text-xs">
										{milestone.creditWeight} credits
									</Badge>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Milestone renderer */}
				<ScrollArea className="flex-1 p-4">
					<MilestoneWorkflowRenderer
						milestone={milestone}
						workflowType={component.workflowType}
						isLocked={isLocked}
						isLoading={hasPendingUpdates(milestone.id)}
						touchTargetSize={56} // Larger for mobile
						onUpdate={(value) =>
							handleMilestoneUpdate(milestone.id, value)
						}
						className="space-y-4"
					/>
				</ScrollArea>
			</div>
		);
	};

	return (
		<Sheet open={isOpen} onOpenChange={onClose}>
			<SheetContent
				side="bottom"
				className={cn(
					"rounded-t-lg transition-all duration-300 ease-in-out p-0",
					getHeightClass(),
				)}
			>
				<div className="flex flex-col h-full">
					{renderHeader()}

					{selectedMilestone
						? renderMilestoneDetail()
						: renderMilestoneList()}

					{/* Height toggle buttons */}
					<div className="flex justify-center p-2 border-t">
						<Button
							variant="ghost"
							size="sm"
							onClick={() =>
								setSheetHeight(
									sheetHeight === "full"
										? "partial"
										: sheetHeight === "partial"
											? "collapsed"
											: "partial",
								)
							}
							className="h-8 px-4"
						>
							{sheetHeight === "collapsed" ? (
								<ChevronUp className="h-4 w-4" />
							) : (
								<ChevronDown className="h-4 w-4" />
							)}
						</Button>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
