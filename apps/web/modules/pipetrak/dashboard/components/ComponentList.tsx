"use client";

import { useState, useMemo } from "react";
import { Input } from "@ui/components/input";
import { Badge } from "@ui/components/badge";
import { Switch } from "@ui/components/switch";
import { ScrollArea } from "@ui/components/scroll-area";
import { Search, Triangle, CheckCircle22, Circle, Clock } from "lucide-react";
import { cn } from "@ui/lib";
import type { ComponentWithMilestones } from "../../types";

interface ComponentListProps {
	components: ComponentWithMilestones[];
	loading?: boolean;
	onComponentClick?: (component: ComponentWithMilestones) => void;
	onMilestoneToggle?: (
		componentId: string,
		milestoneId: string,
		completed: boolean,
	) => void;
	searchable?: boolean;
}

/**
 * Component List - Virtualized list for tablet/mobile dashboard
 * Features inline milestone toggles, progress indicators, and search
 */
export function ComponentList({
	components,
	loading = false,
	onComponentClick,
	onMilestoneToggle,
	searchable = true,
}: ComponentListProps) {
	const [searchQuery, setSearchQuery] = useState("");

	// FileFilter components based on search
	const filteredComponents = useMemo(() => {
		if (!searchQuery.trim()) return components;

		const query = searchQuery.toLowerCase();
		return components.filter(
			(component) =>
				component.componentId.toLowerCase().includes(query) ||
				component.description?.toLowerCase().includes(query) ||
				component.area?.toLowerCase().includes(query),
		);
	}, [components, searchQuery]);

	// Calculate if component is stalled (no updates in 7+ days)
	const isStalled = (component: ComponentWithMilestones): boolean => {
		if (!component.updatedAt) return false;
		const daysSinceUpdate = Math.floor(
			(Date.now() - new Date(component.updatedAt).getTime()) /
				(1000 * 60 * 60 * 24),
		);
		return daysSinceUpdate >= 7;
	};

	if (loading) {
		return (
			<div className="space-y-3">
				{[...Array(8)].map((_, i) => (
					<div key={i} className="animate-pulse">
						<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
							<div className="flex-1 space-y-2">
								<div className="h-4 bg-gray-300 rounded w-32" />
								<div className="h-3 bg-gray-200 rounded w-48" />
							</div>
							<div className="flex gap-2">
								{[...Array(3)].map((_, j) => (
									<div
										key={j}
										className="h-6 w-6 bg-gray-200 rounded-full"
									/>
								))}
							</div>
						</div>
					</div>
				))}
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Search */}
			{searchable && (
				<div className="relative">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search components..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>
			)}

			{/* Component List */}
			<ScrollArea className="h-[calc(100vh-280px)]">
				<div className="space-y-3 pr-4">
					{filteredComponents.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							<Search className="h-8 w-8 mx-auto mb-2" />
							<p>No components found</p>
							{searchQuery && (
								<p className="text-sm">
									Try adjusting your search terms
								</p>
							)}
						</div>
					) : (
						filteredComponents.map((component) => (
							<ComponentListItem
								key={component.id}
								component={component}
								isStalled={isStalled(component)}
								onClick={() => onComponentClick?.(component)}
								onMilestoneToggle={onMilestoneToggle}
							/>
						))
					)}
				</div>
			</ScrollArea>

			{/* Results count */}
			{searchQuery && (
				<div className="text-xs text-muted-foreground text-center">
					Showing {filteredComponents.length} of {components.length}{" "}
					components
				</div>
			)}
		</div>
	);
}

interface ComponentListItemProps {
	component: ComponentWithMilestones;
	isStalled: boolean;
	onClick?: () => void;
	onMilestoneToggle?: (
		componentId: string,
		milestoneId: string,
		completed: boolean,
	) => void;
}

function ComponentListItem({
	component,
	isStalled,
	onClick,
	onMilestoneToggle,
}: ComponentListItemProps) {
	const completedMilestones =
		component.milestones?.filter((m) => m.isCompleted).length || 0;
	const totalMilestones = component.milestones?.length || 0;
	const progressPercent =
		totalMilestones > 0
			? Math.round((completedMilestones / totalMilestones) * 100)
			: 0;

	// Show first 3-4 milestones inline
	const visibleMilestones = component.milestones?.slice(0, 4) || [];
	const hasMoreMilestones = (component.milestones?.length || 0) > 4;

	return (
		<div
			className={cn(
				"group relative bg-white border rounded-lg p-4 transition-all duration-200",
				"hover:shadow-md hover:border-primary/20",
				onClick ? "cursor-pointer" : "",
			)}
			onClick={onClick}
		>
			{/* Header */}
			<div className="flex items-start justify-between mb-3">
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2">
						<h3 className="font-medium text-sm truncate">
							{component.componentId}
						</h3>
						{/* Stalled indicator - small triangle */}
						{isStalled && (
							<Triangle className="h-3 w-3 text-orange-500 fill-orange-100" />
						)}
					</div>
					{component.description && (
						<p className="text-xs text-muted-foreground truncate mt-1">
							{component.description}
						</p>
					)}
					<div className="flex items-center gap-2 mt-1">
						{component.area && (
							<Badge
								status="info"
								className="text-xs px-1.5 py-0"
							>
								{component.area}
							</Badge>
						)}
						{component.drawingNumber && (
							<span className="text-xs text-muted-foreground">
								{component.drawingNumber}
							</span>
						)}
					</div>
				</div>

				{/* Progress */}
				<div className="text-right shrink-0 ml-4">
					<div className="flex items-center gap-1">
						<span
							className={cn(
								"text-sm font-medium",
								progressPercent === 100
									? "text-green-600"
									: "text-primary",
							)}
						>
							{progressPercent}%
						</span>
						{progressPercent === 100 && (
							<CheckCircle22 className="h-4 w-4 text-green-600" />
						)}
					</div>
					<div className="text-xs text-muted-foreground">
						{completedMilestones}/{totalMilestones}
					</div>
				</div>
			</div>

			{/* Milestone Toggles */}
			{visibleMilestones.length > 0 && (
				<div className="space-y-2">
					<div className="grid grid-cols-2 gap-2">
						{visibleMilestones.map((milestone) => (
							<div
								key={milestone.id}
								className="flex items-center gap-2 min-w-0"
								onClick={(e) => e.stopPropagation()}
							>
								<Switch
									checked={milestone.isCompleted}
									onCheckedChange={(checked) =>
										onMilestoneToggle?.(
											component.id,
											milestone.id,
											checked,
										)
									}
									className="scale-75"
								/>
								<span className="text-xs truncate flex-1">
									{milestone.milestoneName}
								</span>
								{milestone.isCompleted ? (
									<CheckCircle22 className="h-3 w-3 text-green-600 shrink-0" />
								) : (
									<Circle className="h-3 w-3 text-muted-foreground shrink-0" />
								)}
							</div>
						))}
					</div>

					{hasMoreMilestones && (
						<div className="text-xs text-muted-foreground text-center pt-1">
							+{(component.milestones?.length || 0) - 4} more
							milestones (tap to view all)
						</div>
					)}
				</div>
			)}

			{/* Last update indicator */}
			{component.updatedAt && (
				<div className="flex items-center gap-1 mt-2 pt-2 border-t">
					<Clock className="h-3 w-3 text-muted-foreground" />
					<span className="text-xs text-muted-foreground">
						Updated{" "}
						{new Date(component.updatedAt).toLocaleDateString()}
					</span>
				</div>
			)}
		</div>
	);
}
