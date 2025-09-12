"use client";

import { cn } from "@ui/lib";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	List,
	type ListImperativeAPI,
	type RowComponentProps,
} from "react-window";
import type { ComponentWithMilestones } from "../../types";
import { MobileComponentCard } from "./MobileComponentCard";

export interface VirtualizedMobileComponentListProps {
	components: ComponentWithMilestones[];
	selectedComponents: Set<string>;
	onComponentSelect: (componentId: string, selected: boolean) => void;
	onComponentClick: (component: ComponentWithMilestones) => void;
	onMilestoneUpdate?: (
		componentId: string,
		milestoneId: string,
		value: boolean | number,
	) => void;
	onQuickUpdate?: (componentId: string, status: string) => void;
	onOpenMilestones?: (component: ComponentWithMilestones) => void;
	onOpenQuickSelector?: (component: ComponentWithMilestones) => void;
	height: number;
	className?: string;
}

type RowProps = {
	components: ComponentWithMilestones[];
	selectedComponents: Set<string>;
	onComponentSelect: (componentId: string, selected: boolean) => void;
	onComponentClick: (component: ComponentWithMilestones) => void;
	onMilestoneUpdate?: (
		componentId: string,
		milestoneId: string,
		value: boolean | number,
	) => void;
	onQuickUpdate?: (componentId: string, status: string) => void;
	onOpenMilestones?: (component: ComponentWithMilestones) => void;
	onOpenQuickSelector?: (component: ComponentWithMilestones) => void;
};

// Memoized list item component for performance
const ListItem = memo(function ListItem({
	index,
	style,
	...rest
}: RowComponentProps<RowProps>) {
	const {
		components,
		selectedComponents,
		onComponentSelect,
		onComponentClick,
	} = rest as RowProps;
	const component = components[index as number];
	const isSelected = selectedComponents.has(component.id);

	const handleSelect = useCallback(
		(selected: boolean) => {
			onComponentSelect(component.id, selected);
		},
		[component.id, onComponentSelect],
	);

	const handleClick = useCallback(() => {
		onComponentClick(component);
	}, [component, onComponentClick]);

	return (
		<div style={style}>
			<div className="px-4 pb-1.5">
				<MobileComponentCard
					component={component}
					isSelected={isSelected}
					onSelect={handleSelect}
					onClick={handleClick}
				/>
			</div>
		</div>
	);
});

// Calculate item height based on component content
function getItemHeight(): number {
	// Base height: padding + header + meta + milestone buttons
	let height = 8 + 24 + 16 + 40; // 88px base

	// Add padding between items
	height += 6;

	return height;
}

export const VirtualizedMobileComponentList = memo(
	function VirtualizedMobileComponentList({
		components,
		selectedComponents,
		onComponentSelect,
		onComponentClick,
		onMilestoneUpdate,
		onQuickUpdate,
		onOpenMilestones,
		onOpenQuickSelector,
		height,
		className,
	}: VirtualizedMobileComponentListProps) {
		const listRef = useRef<ListImperativeAPI | null>(null);
		const [containerHeight, setContainerHeight] = useState(height);

		// Memoize list data to prevent unnecessary re-renders
		const rowProps = useMemo<RowProps>(
			() => ({
				components,
				selectedComponents,
				onComponentSelect,
				onComponentClick,
				onMilestoneUpdate,
				onQuickUpdate,
				onOpenMilestones,
				onOpenQuickSelector,
			}),
			[
				components,
				selectedComponents,
				onComponentSelect,
				onComponentClick,
				onMilestoneUpdate,
				onQuickUpdate,
				onOpenMilestones,
				onOpenQuickSelector,
			],
		);

		// Memoize item size getter
		const getRowHeight = useCallback((_index: number) => {
			return getItemHeight();
		}, []);

		// Handle container resize
		useEffect(() => {
			setContainerHeight(height);
		}, [height]);

		// (Helper removed; not used internally)

		if (components.length === 0) {
			return (
				<div
					className={cn(
						"flex items-center justify-center",
						className,
					)}
					style={{ height: containerHeight }}
				>
					<div className="text-center text-muted-foreground">
						<p className="text-lg font-medium">
							No components found
						</p>
						<p className="text-sm">
							Try adjusting your filters or search criteria
						</p>
					</div>
				</div>
			);
		}

		return (
			<div className={cn("w-full", className)}>
				<List
					listRef={listRef}
					rowCount={components.length}
					rowHeight={getRowHeight}
					rowComponent={ListItem}
					rowProps={rowProps}
					overscanCount={5}
					style={{ height: containerHeight, width: "100%" }}
				/>
			</div>
		);
	},
);
