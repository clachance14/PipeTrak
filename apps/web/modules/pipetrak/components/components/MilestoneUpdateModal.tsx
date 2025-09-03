"use client";

import { useState, memo, useMemo } from "react";
import { MilestoneUpdatePanel } from "./MilestoneUpdatePanel";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@ui/components/dialog";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { ComponentWithMilestones, WorkflowType } from "../../types";

interface MilestoneUpdateModalProps {
	components: ComponentWithMilestones[];
	isOpen: boolean;
	onClose: () => void;
	onUpdate?: () => void;
	isMobile?: boolean;
}

const MilestoneUpdateModalComponent = memo(function MilestoneUpdateModal({
	components,
	isOpen,
	onClose,
	onUpdate,
	isMobile = false,
}: MilestoneUpdateModalProps) {
	const [currentIndex, setCurrentIndex] = useState(0);

	// Memoize current component to prevent unnecessary recalculations
	const currentComponent = useMemo(
		() => components[currentIndex],
		[components, currentIndex],
	);

	// Memoize handlers to prevent recreation on every render
	const handlePrevious = useMemo(
		() => () => {
			if (currentIndex > 0) {
				setCurrentIndex(currentIndex - 1);
			}
		},
		[currentIndex],
	);

	const handleNext = useMemo(
		() => () => {
			if (currentIndex < components.length - 1) {
				setCurrentIndex(currentIndex + 1);
			}
		},
		[currentIndex, components.length],
	);

	// Memoize workflow type calculation
	const workflowType = useMemo(() => {
		return (
			currentComponent?.workflowType ||
			("MILESTONE_DISCRETE" as WorkflowType)
		);
	}, [currentComponent?.workflowType]);

	// Reset index when modal opens/closes or components change
	useMemo(() => {
		if (isOpen && currentIndex >= components.length) {
			setCurrentIndex(0);
		}
	}, [isOpen, components.length, currentIndex]);

	if (!currentComponent) {
		return null;
	}

	return (
		<Dialog open={isOpen} onOpenChange={() => onClose()}>
			<DialogContent
				className={
					isMobile
						? "max-w-full h-screen w-screen p-0 will-change-transform m-0 rounded-none flex flex-col"
						: "max-w-3xl max-h-[90vh] will-change-transform"
				}
				style={{
					// Optimize for performance by promoting to its own layer
					transform: "translateZ(0)",
					backfaceVisibility: "hidden",
				}}
			>
				<DialogHeader
					className={isMobile ? "p-3 pb-2 flex-shrink-0" : ""}
				>
					<div className="flex items-center justify-between">
						<div>
							<DialogTitle>Update Milestones</DialogTitle>
							<DialogDescription className="mt-1">
								Track progress for component milestones
							</DialogDescription>
						</div>
						{isMobile && (
							<Button
								variant="ghost"
								size="icon"
								onClick={onClose}
								className="h-8 w-8"
							>
								<X className="h-4 w-4" />
							</Button>
						)}
					</div>

					{/* Navigation for multiple components */}
					{components.length > 1 && (
						<div className="flex items-center justify-between mt-3 pt-3 border-t">
							<Button
								status="info"
								size="sm"
								onClick={handlePrevious}
								disabled={currentIndex === 0}
								className="h-8"
							>
								<ChevronLeft className="h-4 w-4 mr-1" />
								Previous
							</Button>

							<div className="flex items-center gap-2">
								<Badge status="info" className="text-xs">
									{currentIndex + 1} of {components.length}
								</Badge>
								<span className="text-xs text-muted-foreground">
									Components
								</span>
							</div>

							<Button
								status="info"
								size="sm"
								onClick={handleNext}
								disabled={
									currentIndex === components.length - 1
								}
								className="h-8"
							>
								Next
								<ChevronRight className="h-4 w-4 ml-1" />
							</Button>
						</div>
					)}
				</DialogHeader>

				{isMobile ? (
					<div className="flex-1 min-h-0 bg-gray-50/30">
						<MilestoneUpdatePanel
							component={currentComponent}
							workflowType={workflowType}
							isMobile={isMobile}
							onUpdate={() => {
								if (onUpdate) onUpdate();

								// Auto-advance to next component if available, but don't auto-close
								if (currentIndex < components.length - 1) {
									setTimeout(
										() => setCurrentIndex(currentIndex + 1),
										500,
									);
								}
								// Note: Removed auto-close behavior - let user close manually
							}}
							touchTargetSize={52}
						/>
					</div>
				) : (
					<div className="max-h-[60vh] overflow-y-auto">
						<div className="px-6 pb-6">
							<MilestoneUpdatePanel
								component={currentComponent}
								workflowType={workflowType}
								isMobile={isMobile}
								onUpdate={() => {
									if (onUpdate) onUpdate();

									// Auto-advance to next component if available, but don't auto-close
									if (currentIndex < components.length - 1) {
										setTimeout(
											() =>
												setCurrentIndex(
													currentIndex + 1,
												),
											500,
										);
									}
									// Note: Removed auto-close behavior - let user close manually
								}}
								touchTargetSize={44}
							/>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
});

export { MilestoneUpdateModalComponent as MilestoneUpdateModal };
