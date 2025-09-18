"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import { Progress } from "@ui/components/progress";
import { ScrollArea } from "@ui/components/scroll-area";
import { cn } from "@ui/lib";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";
import { useMemo, useState } from "react";
import { buildDrawingTree } from "../lib/utils";
import type { DrawingRollup, DrawingRollups } from "../types";

interface DrawingHierarchyProps {
	data: DrawingRollups | null;
}

interface DrawingTreeNode extends DrawingRollup {
	children: DrawingTreeNode[];
}

interface DrawingNodeProps {
	node: DrawingTreeNode;
	level: number;
	isExpanded: boolean;
	onToggle: () => void;
}

function DrawingNode({ node, level, isExpanded, onToggle }: DrawingNodeProps) {
	const hasChildren = node.children.length > 0;
	const indent = level * 20;

	return (
		<div className="space-y-1">
			<div
				role={hasChildren ? "button" : undefined}
				tabIndex={hasChildren ? 0 : undefined}
				className={cn(
					"flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors",
					hasChildren && "cursor-pointer",
					level > 0 && "bg-muted/25",
				)}
				style={{ marginLeft: `${indent}px` }}
				onClick={hasChildren ? onToggle : undefined}
				onKeyDown={hasChildren ? (e: React.KeyboardEvent) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						onToggle();
					}
				} : undefined}
				{...(hasChildren
					? {
						"aria-expanded": isExpanded,
						"aria-label": `${
							isExpanded ? "Collapse" : "Expand"
						} ${node.drawingNumber || "drawing"}`,
					}
					: {})}
			>
				{/* Expand/collapse button */}
				<div className="flex-shrink-0 w-4 h-4">
					{hasChildren && (
						<button
							type="button"
							className="w-4 h-4 flex items-center justify-center hover:bg-accent rounded"
							onClick={(e) => {
								e.stopPropagation();
								onToggle();
							}}
						>
							{isExpanded ? (
								<ChevronDown className="w-3 h-3" />
							) : (
								<ChevronRight className="w-3 h-3" />
							)}
						</button>
					)}
				</div>

				{/* Drawing icon */}
				<FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />

				{/* Drawing info */}
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-1">
						<span className="font-medium text-sm truncate">
							{node.drawingNumber}
						</span>
						{node.drawingName && (
							<span className="text-xs text-muted-foreground truncate">
								{node.drawingName}
							</span>
						)}
					</div>

					{/* Progress bar */}
					<div className="flex items-center gap-2">
						<Progress
							value={node.completionPercent}
							className="h-1.5 flex-1"
						/>
						<span className="text-xs text-muted-foreground whitespace-nowrap">
							{node.completionPercent}%
						</span>
					</div>
				</div>

				{/* Component count and stalled indicator */}
				<div className="flex items-center gap-2 text-xs text-muted-foreground">
					<span>
						{node.completedCount}/{node.componentCount}
					</span>
					{node.stalledCount > 0 && (
						<span className="text-red-500 font-medium">
							({node.stalledCount} stalled)
						</span>
					)}
				</div>
			</div>

			{/* Children */}
			{hasChildren && isExpanded && (
				<div className="space-y-1">
					{node.children.map((child) => (
						<DrawingNodeContainer
							key={child.drawingId}
							node={child}
							level={level + 1}
						/>
					))}
				</div>
			)}
		</div>
	);
}

function DrawingNodeContainer({
	node,
	level,
}: {
	node: DrawingTreeNode;
	level: number;
}) {
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<DrawingNode
			node={node}
			level={level}
			isExpanded={isExpanded}
			onToggle={() => setIsExpanded(!isExpanded)}
		/>
	);
}

export function DrawingHierarchy({ data }: DrawingHierarchyProps) {
	const drawingTree = useMemo(() => {
		if (!data?.drawings?.length) return [];
		return buildDrawingTree(data.drawings);
	}, [data]);

	const totalStats = useMemo(() => {
		if (!data?.drawings?.length) {
			return {
				totalComponents: 0,
				completedComponents: 0,
				totalStalled: 0,
			};
		}

		return data.drawings.reduce(
			(acc, drawing) => ({
				totalComponents: acc.totalComponents + drawing.componentCount,
				completedComponents:
					acc.completedComponents + drawing.completedCount,
				totalStalled: acc.totalStalled + drawing.stalledCount,
			}),
			{ totalComponents: 0, completedComponents: 0, totalStalled: 0 },
		);
	}, [data]);

	if (!data?.drawings?.length) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Drawing Hierarchy</CardTitle>
					<CardDescription>
						Hierarchical tree view of drawings with progress
						rollups.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center h-64 text-muted-foreground">
						No drawings available
					</div>
				</CardContent>
			</Card>
		);
	}

	const overallProgress =
		totalStats.totalComponents > 0
			? Math.round(
					(totalStats.completedComponents /
						totalStats.totalComponents) *
						100,
				)
			: 0;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					<span>Drawing Hierarchy</span>
					<span className="text-sm font-normal text-muted-foreground">
						{data.drawings.length} drawings
					</span>
				</CardTitle>
				<CardDescription>
					{totalStats.totalComponents.toLocaleString()} total
					components, {overallProgress}% complete
					{totalStats.totalStalled > 0 && (
						<span className="text-red-500 ml-1">
							({totalStats.totalStalled} stalled)
						</span>
					)}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ScrollArea className="h-[400px] w-full">
					<div className="space-y-1 pr-4">
						{drawingTree.map((drawing) => (
							<DrawingNodeContainer
								key={drawing.drawingId}
								node={drawing}
								level={0}
							/>
						))}
					</div>
				</ScrollArea>
			</CardContent>
		</Card>
	);
}
