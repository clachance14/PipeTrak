"use client";

import { ChevronRight, ChevronDown, FileText } from "lucide-react";
import { Button } from "@ui/components/button";
import { cn } from "@ui/lib";
import type { DrawingTreeNode } from "../../types";
import { ComponentCountBadge } from "./ComponentCountBadge";

interface DrawingTreeItemProps {
	drawing: DrawingTreeNode;
	isExpanded: boolean;
	isSelected: boolean;
	onToggleExpand: (drawingId: string) => void;
	onSelect: (drawingId: string) => void;
	level: number;
	isMobile?: boolean;
}

export function DrawingTreeItem({
	drawing,
	isExpanded,
	isSelected,
	onToggleExpand,
	onSelect,
	level,
	isMobile = false,
}: DrawingTreeItemProps) {
	const hasChildren = drawing.children && drawing.children.length > 0;
	const indentSize = isMobile ? 12 : 16; // Smaller indent on mobile

	return (
		<div
			className={cn(
				"group relative flex items-center gap-2 px-2 rounded-md cursor-pointer transition-colors",
				"hover:bg-accent/50",
				isSelected && "bg-accent border-l-4 border-primary",
				isMobile ? "min-h-[52px]" : "min-h-[44px]",
			)}
			style={{
				paddingLeft: `${level * indentSize + 8}px`,
			}}
			onClick={() => onSelect(drawing.id)}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					onSelect(drawing.id);
				}
			}}
			role="treeitem"
			tabIndex={0}
			aria-expanded={hasChildren ? isExpanded : undefined}
			aria-level={level + 1}
			aria-selected={isSelected}
		>
			{/* Expand/Collapse Button */}
			{hasChildren ? (
				<Button
					variant="ghost"
					size="icon"
					className={cn("p-0", isMobile ? "h-12 w-12" : "h-6 w-6")}
					onClick={(e: React.MouseEvent) => {
						e.stopPropagation();
						onToggleExpand(drawing.id);
					}}
					aria-label={isExpanded ? "Collapse" : "Expand"}
				>
					{isExpanded ? (
						<ChevronDown className="h-4 w-4" />
					) : (
						<ChevronRight className="h-4 w-4" />
					)}
				</Button>
			) : (
				<div className={cn(isMobile ? "w-12" : "w-6")} /> // Spacer for alignment
			)}

			{/* Drawing Icon */}
			<FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />

			{/* Drawing Info */}
			<div className="flex-1 min-w-0">
				{isMobile ? (
					// Stacked layout for mobile
					<div>
						<div className="font-medium text-sm truncate">
							{drawing.number}
						</div>
						<div className="text-xs text-muted-foreground truncate">
							{drawing.title}
						</div>
					</div>
				) : (
					// Inline layout for desktop
					<div className="flex items-baseline gap-2">
						<span className="font-medium text-sm">
							{drawing.number}
						</span>
						<span className="text-xs text-muted-foreground truncate">
							{drawing.title}
						</span>
					</div>
				)}
				{drawing.revision && (
					<span className="text-xs text-muted-foreground ml-2">
						Rev. {drawing.revision}
					</span>
				)}
			</div>

			{/* Component Count Badge */}
			<ComponentCountBadge
				componentCount={drawing.componentCount}
				variant={isMobile ? "compact" : "default"}
				className="flex-shrink-0"
			/>
		</div>
	);
}
