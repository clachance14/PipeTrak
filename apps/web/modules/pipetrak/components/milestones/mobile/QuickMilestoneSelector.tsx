"use client";

import { Badge } from "@ui/components/badge";
import { Card, CardContent } from "@ui/components/card";
import { Skeleton } from "@ui/components/skeleton";
import { cn } from "@ui/lib";
import {
	AlertCircle,
	Check,
	Clock,
	Loader2,
	Lock,
	RefreshCw,
	WifiOff,
	X,
} from "lucide-react";
import React, { memo, useCallback, useEffect, useRef } from "react";
import type {
	ComponentMilestone,
	ComponentWithMilestones,
	WorkflowType,
} from "../../../types";
import { useMilestoneUpdateEngine } from "../core/MilestoneUpdateEngine";
import { getCompletionPercent } from "./TouchMilestoneCard";

interface QuickMilestoneSelectorProps {
	component: ComponentWithMilestones;
	isOpen: boolean;
	onClose: () => void;
	onMilestoneUpdate?: (milestoneId: string, value: boolean | number) => void;
	isLoading?: boolean;
	error?: string | null;
	isOffline?: boolean;
	onRetry?: () => void;
}

interface MilestoneItemProps {
	milestone: ComponentMilestone;
	component: ComponentWithMilestones;
	isLocked?: boolean;
	isPending?: boolean;
	status?: "pending" | "success" | "error" | null;
	onClick?: () => void;
}

// Skeleton component for loading states
const MilestoneItemSkeleton = memo(function MilestoneItemSkeleton() {
	return (
		<div className="min-h-[56px] p-3 border rounded-lg bg-muted/20">
			<div className="flex items-center gap-3">
				<div className="flex-shrink-0">
					<Skeleton className="h-5 w-5 rounded-full" />
				</div>
				<div className="flex-1 min-w-0">
					<div className="flex items-center justify-between gap-2">
						<div className="flex-1 min-w-0">
							<Skeleton className="h-4 w-32 mb-2" />
							<div className="flex items-center gap-2">
								<Skeleton className="h-5 w-12" />
								<Skeleton className="h-5 w-16" />
							</div>
						</div>
						<div className="text-right flex-shrink-0">
							<Skeleton className="h-4 w-16 mb-1" />
							<Skeleton className="h-3 w-10" />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
});

// Error display component with recovery actions
const ErrorDisplay = memo(function ErrorDisplay({
	error,
	onRetry,
	isOffline,
}: {
	error: string;
	onRetry?: () => void;
	isOffline?: boolean;
}) {
	return (
		<div className="text-center py-8 px-4">
			<div className="mx-auto mb-4 p-3 rounded-full bg-destructive/10 w-fit">
				{isOffline ? (
					<WifiOff className="h-8 w-8 text-destructive" />
				) : (
					<AlertCircle className="h-8 w-8 text-destructive" />
				)}
			</div>
			<h3 className="font-medium text-base mb-2">
				{isOffline ? "No Internet Connection" : "Something went wrong"}
			</h3>
			<p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto leading-relaxed">
				{isOffline
					? "Check your internet connection and try again. Your work will be saved when you reconnect."
					: error ||
						"Unable to load milestone data. Please check your connection and try again."}
			</p>
			{onRetry && (
				<button
					type="button"
					onClick={onRetry}
					className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				>
					<RefreshCw className="h-4 w-4" />
					Try Again
				</button>
			)}
		</div>
	);
});

const MilestoneItem = memo(function MilestoneItem({
	milestone,
	component,
	isLocked = false,
	isPending = false,
	status = null,
	onClick,
}: MilestoneItemProps) {
	// Memoize expensive calculations
	const completionPercent = React.useMemo(
		() => getCompletionPercent(milestone, component.workflowType),
		[milestone, component.workflowType],
	);

	const formattedValue = React.useMemo(
		() => formatValue(component.workflowType, milestone),
		[component.workflowType, milestone],
	);

	function formatValue(
		workflowType: WorkflowType,
		milestone: ComponentMilestone,
	) {
		switch (workflowType) {
			case "MILESTONE_DISCRETE":
				return milestone.isCompleted ? "Complete" : "Incomplete";

			case "MILESTONE_PERCENTAGE": {
				const percent = milestone.percentageComplete || 0;
				return `${percent}%`;
			}

			case "MILESTONE_QUANTITY": {
				const completed = milestone.quantityComplete || 0;
				const total = milestone.quantityTotal || 0;
				const unit = milestone.unit || "units";
				return `${completed}/${total} ${unit}`;
			}

			default:
				return "Unknown";
		}
	}
	const getStatusIcon = () => {
		if (isLocked) {
			return <Lock className="h-5 w-5 text-muted-foreground" />;
		}

		if (isPending || status === "pending") {
			return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
		}

		if (completionPercent === 100) {
			return <Check className="h-5 w-5 text-fieldComplete" />;
		}
		if (completionPercent > 0) {
			return <Clock className="h-5 w-5 text-blue-600" />;
		}
		return <AlertCircle className="h-5 w-5 text-fieldPending" />;
	};

	const getStatusColor = () => {
		if (isLocked) return "border-muted bg-muted/10";
		if (isPending || status === "pending")
			return "border-blue-300 bg-blue-50";
		if (status === "error") return "border-red-300 bg-red-50";

		if (completionPercent === 100) return "border-green-300 bg-green-50";
		if (completionPercent > 0) return "border-blue-200 bg-blue-50";
		return "border-amber-200 bg-amber-50";
	};

	return (
		<button
			type="button"
			className={cn(
				"milestone-item min-h-[56px] p-3 border rounded-lg transition-all duration-200 cursor-pointer text-left w-full",
				"hover:shadow-sm active:scale-[0.98]",
				getStatusColor(),
				isLocked && "cursor-not-allowed opacity-60",
			)}
			onClick={!isLocked ? onClick : undefined}
			disabled={isLocked}
			aria-label={`${milestone.milestoneName} - ${formattedValue}${isLocked ? " (locked)" : ""}`}
			aria-describedby={
				status === "error" ? `error-${milestone.id}` : undefined
			}
		>
			<div className="flex items-center gap-3">
				{/* Status icon */}
				<div className="flex-shrink-0">{getStatusIcon()}</div>

				{/* Content */}
				<div className="flex-1 min-w-0">
					<div className="flex items-center justify-between gap-2">
						<div className="flex-1 min-w-0">
							<h4 className="font-medium text-sm leading-tight truncate">
								{milestone.milestoneName}
							</h4>

							{/* Milestone metadata */}
							<div className="flex items-center gap-2 mt-1 flex-wrap">
								{milestone.sequenceNumber && (
									<Badge status="info" className="text-sm">
										Step {milestone.sequenceNumber}
									</Badge>
								)}
								{milestone.weight && (
									<Badge status="info" className="text-sm">
										{milestone.weight} credits
									</Badge>
								)}
							</div>
						</div>

						{/* Value */}
						<div className="text-right flex-shrink-0">
							<div className="text-sm font-medium">
								{formattedValue}
							</div>
							{component.workflowType !==
								"MILESTONE_DISCRETE" && (
								<div className="text-sm text-muted-foreground">
									{completionPercent}%
								</div>
							)}
						</div>
					</div>

					{/* Error state */}
					{status === "error" && (
						<div
							id={`error-${milestone.id}`}
							className="text-sm text-destructive mt-2 p-2 bg-destructive/10 rounded border-l-2 border-destructive"
							role="alert"
							aria-live="polite"
						>
							<div className="flex items-center gap-2">
								<AlertCircle className="h-4 w-4 flex-shrink-0" />
								<div>
									<div className="font-medium">
										Update failed
									</div>
									<div className="text-sm opacity-90">
										Tap to retry this milestone
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</button>
	);
});

export const QuickMilestoneSelector = memo(function QuickMilestoneSelector({
	component,
	isOpen,
	onClose,
	onMilestoneUpdate,
	isLoading = false,
	error = null,
	isOffline = false,
	onRetry,
}: QuickMilestoneSelectorProps) {
	const { updateMilestone, getOperationStatus, hasPendingUpdates } =
		useMilestoneUpdateEngine();
	const backdropRef = useRef<HTMLDivElement>(null);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Haptic feedback for mobile devices
	const triggerHapticFeedback = useCallback(
		(type: "light" | "medium" | "heavy" = "light") => {
			if ("vibrate" in navigator) {
				const patterns = {
					light: [10],
					medium: [15],
					heavy: [20],
				};
				navigator.vibrate(patterns[type]);
			}
		},
		[],
	);

	// Handle backdrop click
	const handleBackdropClick = useCallback(
		(e: React.MouseEvent) => {
			if (e.target === backdropRef.current) {
				onClose();
			}
		},
		[onClose],
	);

	// Handle ESC key
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isOpen) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener("keydown", handleKeyDown);
			document.body.style.overflow = "hidden";
		}

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			document.body.style.overflow = "";
		};
	}, [isOpen, onClose]);

	// Auto-close after successful update
	const autoCloseAfterSuccess = useCallback(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		timeoutRef.current = setTimeout(() => {
			onClose();
		}, 1500);
	}, [onClose]);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	// Handle milestone toggle with haptic feedback
	const handleMilestoneToggle = useCallback(
		async (milestone: ComponentMilestone) => {
			// Immediate haptic feedback for better UX
			triggerHapticFeedback("light");

			try {
				let newValue: boolean | number;

				if (component.workflowType === "MILESTONE_DISCRETE") {
					newValue = !milestone.isCompleted;
				} else if (component.workflowType === "MILESTONE_PERCENTAGE") {
					// For quick selector, toggle between 0% and 100%
					newValue =
						(milestone.percentageComplete || 0) === 100 ? 0 : 100;
				} else if (component.workflowType === "MILESTONE_QUANTITY") {
					// For quick selector, toggle between 0 and total quantity
					const total = milestone.quantityTotal || 1;
					newValue =
						(milestone.quantityComplete || 0) === total ? 0 : total;
				} else {
					return;
				}

				await updateMilestone(
					milestone.id,
					component.id,
					milestone.milestoneName,
					component.workflowType,
					newValue,
				);

				// Success haptic feedback
				triggerHapticFeedback("medium");

				// Call optional callback
				if (onMilestoneUpdate) {
					onMilestoneUpdate(milestone.id, newValue);
				}

				// Auto-close after successful discrete milestone completion
				if (
					component.workflowType === "MILESTONE_DISCRETE" &&
					newValue === true
				) {
					autoCloseAfterSuccess();
				}
			} catch (error) {
				// Error haptic feedback
				triggerHapticFeedback("heavy");
				console.error("Failed to update milestone:", error);
			}
		},
		[
			component,
			updateMilestone,
			onMilestoneUpdate,
			autoCloseAfterSuccess,
			triggerHapticFeedback,
		],
	);

	// Memoize sorted milestones for performance
	const sortedMilestones = React.useMemo(() => {
		return component.milestones
			? [...component.milestones].sort(
					(a, b) => a.milestoneOrder - b.milestoneOrder,
				)
			: [];
	}, [component.milestones]);

	// Check if milestone is locked (previous milestone incomplete)
	const isMilestoneLocked = useCallback(
		(milestone: ComponentMilestone) => {
			if (sortedMilestones.length <= 1) {
				return false;
			}

			const currentIndex = sortedMilestones.findIndex(
				(m) => m.id === milestone.id,
			);

			if (currentIndex <= 0) {
				return false; // First milestone is never locked
			}

			const previousMilestone = sortedMilestones[currentIndex - 1];
			return !previousMilestone.isCompleted;
		},
		[sortedMilestones],
	);

	if (!isOpen) {
		return null;
	}

	return (
		<div
			ref={backdropRef}
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
			onClick={handleBackdropClick}
			onKeyDown={(e) => {
				if (e.key === "Escape") {
					onClose();
				}
			}}
			role="dialog"
			aria-modal="true"
			aria-labelledby="quick-milestone-title"
		>
			<Card
				className={cn(
					"w-full max-w-md min-w-80 max-h-[80vh] overflow-hidden",
					"transform transition-all duration-300 ease-out",
					"shadow-xl border-2",
				)}
				style={{
					animation: isOpen
						? "slideIn 0.3s ease-out"
						: "slideOut 0.3s ease-in",
				}}
			>
				<CardContent className="p-0">
					{/* Header */}
					<div className="p-4 border-b bg-muted/30">
						<div className="flex items-center justify-between">
							<div className="flex-1 min-w-0">
								<h2
									id="quick-milestone-title"
									className="font-semibold text-lg truncate"
								>
									Quick Update
									{isOffline && (
										<Badge
											status="info"
											className="ml-2 text-sm"
										>
											<WifiOff className="h-3 w-3 mr-1" />
											Offline
										</Badge>
									)}
								</h2>
								<p className="text-sm text-muted-foreground truncate">
									{component.componentId || component.id}
								</p>
							</div>
							<button
								type="button"
								onClick={onClose}
								className="flex-shrink-0 p-2 hover:bg-muted rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
								aria-label="Close quick milestone selector"
							>
								<X className="h-5 w-5" />
							</button>
						</div>
					</div>

					{/* Milestone list */}
					<div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
						{isLoading ? (
							// Loading skeletons
							<div className="space-y-3">
								{Array.from({ length: 3 }).map((_, index) => (
									<MilestoneItemSkeleton key={index} />
								))}
							</div>
						) : error ? (
							// Error state
							<ErrorDisplay
								error={error}
								onRetry={onRetry}
								isOffline={isOffline}
							/>
						) : sortedMilestones.length === 0 ? (
							// Empty state
							<div className="text-center py-8 text-muted-foreground">
								<AlertCircle className="h-8 w-8 mx-auto mb-2" />
								<h3 className="font-medium text-base mb-1">
									No milestones found
								</h3>
								<p className="text-sm">
									This component doesn't have any milestones
									configured
								</p>
							</div>
						) : (
							// Milestone list
							sortedMilestones.map((milestone) => {
								const isLocked = isMilestoneLocked(milestone);
								const isPending = hasPendingUpdates(
									milestone.id,
								);
								const status = getOperationStatus(milestone.id);

								return (
									<MilestoneItem
										key={milestone.id}
										milestone={milestone}
										component={component}
										isLocked={isLocked}
										isPending={isPending}
										status={status}
										onClick={() =>
											handleMilestoneToggle(milestone)
										}
									/>
								);
							})
						)}
					</div>
				</CardContent>
			</Card>

			<style jsx>{`
        @keyframes slideIn {
          from {
            transform: scale(0.95) translateY(10px);
            opacity: 0;
          }
          to {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes slideOut {
          from {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
          to {
            transform: scale(0.95) translateY(10px);
            opacity: 0;
          }
        }
        
        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .milestone-item {
            border-width: 2px !important;
          }
          
          .milestone-item:focus-visible {
            outline: 3px solid currentColor !important;
            outline-offset: 2px !important;
          }
        }
        
        /* Enhanced focus indicators for outdoor visibility */
        .milestone-item:focus-visible {
          outline: 2px solid var(--color-ring);
          outline-offset: 2px;
          box-shadow: 0 0 0 4px rgba(78, 109, 245, 0.2);
        }
        
        /* Better touch targets for mobile */
        @media (hover: none) and (pointer: coarse) {
          .milestone-item {
            min-height: 60px;
            padding: 16px 12px;
          }
        }
      `}</style>
		</div>
	);
});

export default QuickMilestoneSelector;
