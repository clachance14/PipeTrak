/**
 * Example component showing the enhanced QuickMilestoneSelector with all new features
 * This demonstrates the A- grade improvements including:
 * - Skeleton loading states
 * - Enhanced error handling with recovery
 * - Better typography (14px minimum)
 * - Accessibility improvements
 * - Haptic feedback
 * - Performance optimizations
 */

"use client";

import React, { useState } from "react";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { QuickMilestoneSelector } from "./QuickMilestoneSelector";
import { useQuickMilestoneSelector } from "./useQuickMilestoneSelector";
import type { ComponentWithMilestones } from "../../../types";

// Mock component data for demonstration
const mockComponent: ComponentWithMilestones = {
	id: "comp-001",
	componentId: "P001-EL-001",
	description: '6" CS Pipe Elbow',
	workflowType: "MILESTONE_DISCRETE",
	milestones: [
		{
			id: "ms-1",
			milestoneName: "Material Received",
			isCompleted: true,
			milestoneOrder: 1,
			sequenceNumber: 1,
			creditWeight: 10,
			percentageComplete: 0,
			quantityComplete: 0,
			quantityTotal: 0,
			unit: null,
		},
		{
			id: "ms-2",
			milestoneName: "Fit Up Complete",
			isCompleted: false,
			milestoneOrder: 2,
			sequenceNumber: 2,
			creditWeight: 15,
			percentageComplete: 0,
			quantityComplete: 0,
			quantityTotal: 0,
			unit: null,
		},
		{
			id: "ms-3",
			milestoneName: "Welding Complete",
			isCompleted: false,
			milestoneOrder: 3,
			sequenceNumber: 3,
			creditWeight: 25,
			percentageComplete: 0,
			quantityComplete: 0,
			quantityTotal: 0,
			unit: null,
		},
	],
};

export function QuickMilestoneSelectorExample() {
	const {
		isOpen,
		selectedComponent,
		isLoading,
		error,
		isOffline,
		openSelector,
		closeSelector,
		setLoading,
		setError,
		setOffline,
		retry,
	} = useQuickMilestoneSelector();

	const [demoState, setDemoState] = useState<
		"normal" | "loading" | "error" | "offline"
	>("normal");

	const handleOpenSelector = (state: typeof demoState) => {
		setDemoState(state);

		// Simulate different states
		switch (state) {
			case "loading":
				setLoading(true);
				setError(null);
				setOffline(false);
				// Auto-complete loading after 2 seconds
				setTimeout(() => {
					setLoading(false);
				}, 2000);
				break;
			case "error":
				setLoading(false);
				setError(
					"Failed to load milestone data. Please check your connection and try again.",
				);
				setOffline(false);
				break;
			case "offline":
				setLoading(false);
				setError(null);
				setOffline(true);
				break;
			default:
				setLoading(false);
				setError(null);
				setOffline(false);
				break;
		}

		openSelector(mockComponent);
	};

	const handleRetry = () => {
		setLoading(true);
		setError(null);
		// Simulate successful retry after 1 second
		setTimeout(() => {
			setLoading(false);
			setDemoState("normal");
		}, 1000);
	};

	const handleMilestoneUpdate = (
		milestoneId: string,
		value: boolean | number,
	) => {
		console.log("Milestone updated:", { milestoneId, value });
	};

	return (
		<div className="container mx-auto p-6 space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="text-2xl">
						Enhanced Quick Milestone Selector
					</CardTitle>
					<p className="text-muted-foreground">
						Demonstration of A- grade improvements including
						skeleton loading, enhanced error handling, better
						typography, accessibility features, and performance
						optimizations.
					</p>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
						<Button
							onClick={() => handleOpenSelector("normal")}
							className="w-full"
						>
							Normal State
						</Button>
						<Button
							onClick={() => handleOpenSelector("loading")}
							status="info"
							className="w-full"
						>
							Loading State
						</Button>
						<Button
							onClick={() => handleOpenSelector("error")}
							status="info"
							className="w-full"
						>
							Error State
						</Button>
						<Button
							onClick={() => handleOpenSelector("offline")}
							status="info"
							className="w-full"
						>
							Offline State
						</Button>
					</div>

					<div className="space-y-3">
						<h3 className="font-semibold text-lg">
							Key Improvements
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Badge status="info">Typography</Badge>
								<ul className="text-sm space-y-1 text-muted-foreground">
									<li>
										• 14px minimum font size for field
										visibility
									</li>
									<li>• Enhanced contrast for outdoor use</li>
									<li>• Better heading hierarchy</li>
								</ul>
							</div>

							<div className="space-y-2">
								<Badge status="info">Loading States</Badge>
								<ul className="text-sm space-y-1 text-muted-foreground">
									<li>
										• Skeleton placeholders prevent layout
										shift
									</li>
									<li>• Realistic loading animations</li>
									<li>• Progressive content loading</li>
								</ul>
							</div>

							<div className="space-y-2">
								<Badge status="info">Error Handling</Badge>
								<ul className="text-sm space-y-1 text-muted-foreground">
									<li>• Descriptive error messages</li>
									<li>• Clear recovery actions</li>
									<li>• Offline indicator and guidance</li>
								</ul>
							</div>

							<div className="space-y-2">
								<Badge status="info">Accessibility</Badge>
								<ul className="text-sm space-y-1 text-muted-foreground">
									<li>• High contrast mode support</li>
									<li>• Enhanced focus indicators</li>
									<li>• Better screen reader support</li>
								</ul>
							</div>

							<div className="space-y-2">
								<Badge status="info">Performance</Badge>
								<ul className="text-sm space-y-1 text-muted-foreground">
									<li>• Memoized expensive calculations</li>
									<li>• Optimized re-render patterns</li>
									<li>• Virtual scrolling ready</li>
								</ul>
							</div>

							<div className="space-y-2">
								<Badge status="info">Field UX</Badge>
								<ul className="text-sm space-y-1 text-muted-foreground">
									<li>• Haptic feedback for interactions</li>
									<li>• Better touch targets</li>
									<li>• Success animations</li>
								</ul>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Component information */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm font-medium">
						Demo Component
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-2 text-sm">
						<div>
							<strong>ID:</strong> {mockComponent.componentId}
						</div>
						<div>
							<strong>Description:</strong>{" "}
							{mockComponent.description}
						</div>
						<div>
							<strong>Workflow:</strong>{" "}
							{mockComponent.workflowType}
						</div>
						<div>
							<strong>Milestones:</strong>{" "}
							{mockComponent.milestones?.length || 0}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Render the selector */}
			{selectedComponent && (
				<QuickMilestoneSelector
					component={selectedComponent}
					isOpen={isOpen}
					onClose={closeSelector}
					onMilestoneUpdate={handleMilestoneUpdate}
					isLoading={isLoading}
					error={error}
					isOffline={isOffline}
					onRetry={handleRetry}
				/>
			)}
		</div>
	);
}

export default QuickMilestoneSelectorExample;
