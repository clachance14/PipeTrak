"use client";

import { useState, useMemo, useCallback } from "react";
import { Search } from "lucide-react";
import { Input } from "@ui/components/input";
import { ScrollArea } from "@ui/components/scroll-area";
import { Skeleton } from "@ui/components/skeleton";
import { cn } from "@ui/lib";
import type { DrawingTreeNode } from "../../types";
import { DrawingTreeItem } from "./DrawingTreeItem";

interface DrawingTreeViewProps {
	drawings: DrawingTreeNode[];
	selectedDrawingId?: string;
	onDrawingSelect: (drawingId: string) => void;
	className?: string;
	isMobile?: boolean;
	isLoading?: boolean;
}

export function DrawingTreeView({
	drawings,
	selectedDrawingId,
	onDrawingSelect,
	className,
	isMobile = false,
	isLoading = false,
}: DrawingTreeViewProps) {
	const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
	const [searchQuery, setSearchQuery] = useState("");

	const handleToggleExpand = useCallback((drawingId: string) => {
		setExpandedNodes((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(drawingId)) {
				newSet.delete(drawingId);
			} else {
				newSet.add(drawingId);
			}
			return newSet;
		});
	}, []);

	const handleExpandAll = useCallback(() => {
		const allNodeIds = new Set<string>();
		const collectIds = (nodes: DrawingTreeNode[]) => {
			nodes.forEach((node) => {
				if (node.children && node.children.length > 0) {
					allNodeIds.add(node.id);
					collectIds(node.children);
				}
			});
		};
		collectIds(drawings);
		setExpandedNodes(allNodeIds);
	}, [drawings]);

	const handleCollapseAll = useCallback(() => {
		setExpandedNodes(new Set());
	}, []);

	// Filter drawings based on search query
	const filteredDrawings = useMemo(() => {
		if (!searchQuery) return drawings;

		const query = searchQuery.toLowerCase();
		const filterNodes = (nodes: DrawingTreeNode[]): DrawingTreeNode[] => {
			return nodes
				.map((node) => {
					const matchesSearch =
						node.number.toLowerCase().includes(query) ||
						node.title.toLowerCase().includes(query);

					const filteredChildren = node.children
						? filterNodes(node.children)
						: [];

					if (matchesSearch || filteredChildren.length > 0) {
						return {
							...node,
							children: filteredChildren,
						};
					}
					return null;
				})
				.filter((node): node is DrawingTreeNode => node !== null);
		};

		return filterNodes(drawings);
	}, [drawings, searchQuery]);

	// Auto-expand nodes when searching
	useMemo(() => {
		if (searchQuery) {
			const nodesToExpand = new Set<string>();
			const collectExpandedNodes = (nodes: DrawingTreeNode[]) => {
				nodes.forEach((node) => {
					if (node.children && node.children.length > 0) {
						nodesToExpand.add(node.id);
						collectExpandedNodes(node.children);
					}
				});
			};
			collectExpandedNodes(filteredDrawings);
			setExpandedNodes(nodesToExpand);
		}
	}, [searchQuery, filteredDrawings]);

	const renderTree = (nodes: DrawingTreeNode[], level = 0) => {
		return nodes.map((node) => (
			<div key={node.id}>
				<DrawingTreeItem
					drawing={node}
					isExpanded={expandedNodes.has(node.id)}
					isSelected={selectedDrawingId === node.id}
					onToggleExpand={handleToggleExpand}
					onSelect={onDrawingSelect}
					level={level}
					isMobile={isMobile}
				/>
				{expandedNodes.has(node.id) &&
					node.children &&
					node.children.length > 0 &&
					renderTree(node.children, level + 1)}
			</div>
		));
	};

	if (isLoading) {
		return <DrawingTreeSkeleton isMobile={isMobile} />;
	}

	return (
		<div className={cn("flex flex-col h-full", className)}>
			{/* Search Bar */}
			<div className="p-3 border-b">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Search drawings..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>
				<div className="flex gap-2 mt-2">
					<button
						onClick={handleExpandAll}
						className={cn(
							"text-muted-foreground hover:text-foreground",
							isMobile
								? "text-sm px-3 py-2 bg-secondary/50 rounded-md"
								: "text-xs",
						)}
					>
						Expand all
					</button>
					{!isMobile && (
						<span className="text-xs text-muted-foreground">·</span>
					)}
					<button
						onClick={handleCollapseAll}
						className={cn(
							"text-muted-foreground hover:text-foreground",
							isMobile
								? "text-sm px-3 py-2 bg-secondary/50 rounded-md"
								: "text-xs",
						)}
					>
						Collapse all
					</button>
				</div>
			</div>

			{/* Tree Content */}
			<ScrollArea className="flex-1">
				<div className="p-2" role="tree" aria-label="Drawing hierarchy">
					{filteredDrawings.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							{searchQuery
								? "No drawings found matching your search"
								: "No drawings available"}
						</div>
					) : (
						renderTree(filteredDrawings)
					)}
				</div>
			</ScrollArea>
		</div>
	);
}

function DrawingTreeSkeleton({ isMobile }: { isMobile?: boolean }) {
	const itemHeight = isMobile ? 52 : 44;
	return (
		<div className="p-3 space-y-2">
			{Array.from({ length: 8 }, (_, i) => (
				<div
					key={i}
					className="flex items-center gap-3"
					style={{ height: `${itemHeight}px` }}
				>
					<Skeleton className="h-4 w-4 rounded" />
					<Skeleton className="h-4 w-4 rounded" />
					<Skeleton className="h-4 w-32" />
					<div className="flex gap-1 ml-auto">
						<Skeleton className="h-5 w-6 rounded-full" />
						<Skeleton className="h-5 w-6 rounded-full" />
					</div>
				</div>
			))}
		</div>
	);
}
