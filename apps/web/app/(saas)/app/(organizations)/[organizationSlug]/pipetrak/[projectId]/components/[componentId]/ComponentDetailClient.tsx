"use client";

import { useState } from "react";
// import { MilestoneEditor } from "@pipetrak/components/components/MilestoneEditor";
import { MilestoneUpdateEngine } from "@pipetrak/components/milestones/core/MilestoneUpdateEngine";
import { RealtimeManager } from "@pipetrak/components/milestones/realtime/RealtimeManager";
import { Button } from "@ui/components/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type {
	Component,
	ComponentMilestone,
} from "@repo/database/prisma/generated/client";

interface ComponentDetailClientProps {
	component: Component & { milestones?: ComponentMilestone[] };
	projectId: string;
	userId: string;
}

export function ComponentDetailClient({
	component: initialComponent,
	projectId,
	userId,
}: ComponentDetailClientProps) {
	const [component, setComponent] = useState(initialComponent);
	const [liveProgress, setLiveProgress] = useState<number | null>(null);

	// Handle component updates from milestone changes
	const handleComponentUpdate = (componentId: string, updates: any) => {
		if (componentId === component.id) {
			setComponent((prev) => ({
				...prev,
				...updates,
			}));
			// Reset live progress when component is updated (saved)
			setLiveProgress(null);
		}
	};

	// Handle live progress updates as user edits milestones
	// const _handleProgressChange = (progress: number) => {
	// 	setLiveProgress(progress);
	// };

	// Use live progress if available, otherwise use component progress
	const displayProgress =
		liveProgress !== null ? liveProgress : component.completionPercent || 0;

	return (
		<RealtimeManager projectId={projectId} userId={userId}>
			<MilestoneUpdateEngine
				projectId={projectId}
				components={[component]}
				onComponentUpdate={handleComponentUpdate}
			>
				{/* Mobile-optimized header with live progress */}
				<div className="space-y-3 mb-4">
					<Link href={`/app/pipetrak/${projectId}/components`}>
						<Button variant="ghost" size="sm" className="mb-2">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to Components
						</Button>
					</Link>

					<div className="flex items-start justify-between gap-2">
						<div className="min-w-0 flex-1">
							<h1 className="text-xl font-bold truncate">
								Component {component.componentId}
							</h1>
							<p className="text-sm text-muted-foreground">
								{[
									component.type,
									component.spec,
									component.size,
								]
									.filter(Boolean)
									.join(" • ") || "No specifications"}
							</p>
						</div>

						<div className="text-right flex-shrink-0">
							<p className="text-xs text-muted-foreground">
								Progress
							</p>
							<p className="text-lg font-semibold">
								{Math.round(displayProgress)}%
							</p>
						</div>
					</div>
				</div>

				<div className="space-y-4">
					{/* Ultra-compact status bar with live updates */}
					<div className="rounded-lg border p-2 bg-white flex items-center justify-between">
						<div className="flex items-center gap-3">
							<span
								className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
									component.status === "COMPLETED"
										? "bg-green-100 text-green-800"
										: component.status === "IN_PROGRESS"
											? "bg-blue-100 text-blue-800"
											: "bg-gray-100 text-gray-800"
								}`}
							>
								{component.status.replace("_", " ")}
							</span>
							<span className="text-xs text-muted-foreground">
								{component.type} • {component.size} •{" "}
								{component.material}
							</span>
						</div>
						<div className="text-xs text-muted-foreground">
							{component.area} / {component.system}
						</div>
					</div>

					{/* Milestone Editor with real-time updates */}
					{/* <MilestoneEditor 
              component={component} 
              milestones={component.milestones || []}
              onUpdate={handleComponentUpdate}
              onProgressChange={handleProgressChange}
            /> */}
					<div>Component details will be shown here</div>
				</div>
			</MilestoneUpdateEngine>
		</RealtimeManager>
	);
}
