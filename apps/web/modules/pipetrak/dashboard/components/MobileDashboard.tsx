"use client";

import { useState, useEffect } from "react";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Badge } from "@ui/components/badge";
import { Progress } from "@ui/components/progress";
import { ScrollArea } from "@ui/components/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@ui/components/toggle-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@ui/components/select";
import {
	ChevronDown,
	Search,
	RefreshCw,
	Triangle,
	CheckCircle2,
	Circle,
	Clock,
	MapPin,
	List,
	Grid3x3,
} from "lucide-react";
import { cn } from "@ui/lib";
import { QuickStatsChips } from "./QuickStatsChips";
import { MilestoneProgressMatrix } from "./MilestoneProgressMatrix";
import { MobileBottomSheet } from "./MobileBottomSheet";
import { fetchDashboardComponentsClient } from "../lib/client-api";
import type { DashboardMetrics, TestPackageReadiness } from "../types";
import type { ComponentWithMilestones, ComponentFilters } from "../../types";

interface MobileDashboardProps {
	projectId: string;
	projectName: string;
	metrics: DashboardMetrics | null;
	testPackageReadiness: TestPackageReadiness | null;
	onProjectChange?: (projectId: string) => void;
	onRefresh?: () => void;
	availableProjects?: Array<{ id: string; jobName: string }>;
}

/**
 * Mobile Dashboard (<768px) - Ultra-simplified touch-first layout
 * Features tap interactions, bottom sheets, and minimal UI
 */
export function MobileDashboard({
	projectId,
	projectName,
	metrics,
	testPackageReadiness,
	onProjectChange,
	onRefresh,
	availableProjects = [],
}: MobileDashboardProps) {
	const [components, setComponents] = useState<ComponentWithMilestones[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedComponent, setSelectedComponent] =
		useState<ComponentWithMilestones | null>(null);
	const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [viewMode, setViewMode] = useState<"list" | "matrix">("list");

	// Load components on mount
	useEffect(() => {
		loadComponents();
	}, [projectId]);

	const loadComponents = async () => {
		setLoading(true);
		try {
			const filters: ComponentFilters = {
				search: searchQuery || undefined,
			};

			const result = await fetchDashboardComponentsClient(
				projectId,
				filters,
				50,
				0,
			); // Limit to 50 for mobile
			setComponents(result.components);
		} catch (error) {
			console.error("Error loading components:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = (query: string) => {
		setSearchQuery(query);
		// Debounce search
		const timeoutId = setTimeout(() => {
			loadComponents();
		}, 300);
		return () => clearTimeout(timeoutId);
	};

	const handleRefresh = async () => {
		setRefreshing(true);
		await Promise.all([loadComponents(), onRefresh?.()]);
		setRefreshing(false);
	};

	const handleComponentTap = (component: ComponentWithMilestones) => {
		setSelectedComponent(component);
		setBottomSheetOpen(true);
	};

	const handleMilestoneToggle = async (
		componentId: string,
		milestoneId: string,
		completed: boolean,
	) => {
		// TODO: Implement milestone toggle API call
		console.log("Toggle milestone:", {
			componentId,
			milestoneId,
			completed,
		});

		// Optimistic update
		setComponents((prev) =>
			prev.map((comp) => {
				if (comp.id === componentId) {
					const updatedMilestones = comp.milestones.map((m) =>
						m.id === milestoneId
							? { ...m, isCompleted: completed }
							: m,
					);
					return { ...comp, milestones: updatedMilestones };
				}
				return comp;
			}),
		);

		// Also update selected component if it's the same
		if (selectedComponent?.id === componentId) {
			const updatedMilestones = selectedComponent.milestones.map((m) =>
				m.id === milestoneId ? { ...m, isCompleted: completed } : m,
			);
			setSelectedComponent({
				...selectedComponent,
				milestones: updatedMilestones,
			});
		}
	};

	return (
		<div className="h-full flex flex-col bg-gray-50">
			{/* Top Header */}
			<div className="bg-white border-b">
				{/* Project selector and search */}
				<div className="px-4 py-3">
					<div className="flex items-center gap-3">
						{/* Project selector */}
						<div className="flex-1 min-w-0">
							{availableProjects.length > 1 ? (
								<Select
									value={projectId}
									onValueChange={onProjectChange}
								>
									<SelectTrigger className="border-none shadow-none p-0 h-auto font-semibold text-base">
										<div className="flex items-center gap-1">
											<span className="truncate">
												{projectName}
											</span>
											<ChevronDown className="h-4 w-4 shrink-0" />
										</div>
									</SelectTrigger>
									<SelectContent>
										{availableProjects.map((project) => (
											<SelectItem
												key={project.id}
												value={project.id}
											>
												{project.jobName}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							) : (
								<h1 className="font-semibold text-base truncate">
									{projectName}
								</h1>
							)}
						</div>

						{/* Refresh button */}
						<Button
							variant="ghost"
							size="sm"
							onClick={handleRefresh}
							disabled={refreshing}
							className="shrink-0 p-2"
						>
							<RefreshCw
								className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
							/>
						</Button>
					</div>
				</div>

				{/* Search */}
				<div className="px-4 pb-3">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search components..."
							value={searchQuery}
							onChange={(e) => handleSearch(e.target.value)}
							className="pl-9"
						/>
					</div>
				</div>
			</div>

			{/* Quick Stats Chips */}
			<div className="bg-white border-b px-4 py-3">
				<div className="space-y-3">
					<QuickStatsChips
						metrics={metrics}
						testPackages={testPackageReadiness}
					/>

					{/* View Toggle */}
					<ToggleGroup
						type="single"
						value={viewMode}
						onValueChange={(value) =>
							value && setViewMode(value as "list" | "matrix")
						}
						className="w-full bg-muted/50"
					>
						<ToggleGroupItem
							value="list"
							aria-label="List View"
							className="flex-1"
						>
							<List className="h-4 w-4 mr-1.5" />
							Components
						</ToggleGroupItem>
						<ToggleGroupItem
							value="matrix"
							aria-label="Matrix View"
							className="flex-1"
						>
							<Grid3x3 className="h-4 w-4 mr-1.5" />
							Milestones
						</ToggleGroupItem>
					</ToggleGroup>
				</div>
			</div>

			{/* Component List or Matrix */}
			<div className="flex-1 overflow-hidden">
				{viewMode === "list" ? (
					<ScrollArea className="h-full">
						<div className="p-4 space-y-3">
							{loading ? (
								// Loading skeleton
								<>
									{[...Array(8)].map((_, i) => (
										<div key={i} className="animate-pulse">
											<div className="bg-white rounded-lg border p-4">
												<div className="flex items-center justify-between mb-3">
													<div className="h-4 bg-gray-300 rounded w-24" />
													<div className="h-6 bg-gray-200 rounded w-12" />
												</div>
												<div className="h-3 bg-gray-200 rounded w-32 mb-2" />
												<div className="flex gap-2">
													{[...Array(3)].map(
														(_, j) => (
															<div
																key={j}
																className="h-5 w-5 bg-gray-200 rounded-full"
															/>
														),
													)}
												</div>
											</div>
										</div>
									))}
								</>
							) : components.length === 0 ? (
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
								components.map((component) => (
									<MobileComponentCard
										key={component.id}
										component={component}
										onTap={() =>
											handleComponentTap(component)
										}
									/>
								))
							)}
						</div>
					</ScrollArea>
				) : (
					<ScrollArea className="h-full">
						<div className="p-4">
							<MilestoneProgressMatrix
								components={components}
								showSystems={false}
								showTestPackages={false}
							/>
						</div>
					</ScrollArea>
				)}
			</div>

			{/* Bottom Sheet */}
			<MobileBottomSheet
				component={selectedComponent}
				open={bottomSheetOpen}
				onOpenChange={setBottomSheetOpen}
				onMilestoneToggle={handleMilestoneToggle}
				onEdit={(component) => {
					console.log("Edit component:", component);
					// TODO: Navigate to edit screen
				}}
				onViewHistory={(component) => {
					console.log("View history:", component);
					// TODO: Navigate to history screen
				}}
			/>
		</div>
	);
}

interface MobileComponentCardProps {
	component: ComponentWithMilestones;
	onTap: () => void;
}

function MobileComponentCard({ component, onTap }: MobileComponentCardProps) {
	const completedMilestones =
		component.milestones?.filter((m) => m.isCompleted).length || 0;
	const totalMilestones = component.milestones?.length || 0;
	const progressPercent =
		totalMilestones > 0
			? Math.round((completedMilestones / totalMilestones) * 100)
			: 0;

	// Check if component is stalled
	const isStalled = component.updatedAt
		? Math.floor(
				(Date.now() - new Date(component.updatedAt).getTime()) /
					(1000 * 60 * 60 * 24),
			) >= 7
		: false;

	// Show first 3 milestones as checkboxes
	const visibleMilestones = component.milestones?.slice(0, 3) || [];
	const hasMoreMilestones = (component.milestones?.length || 0) > 3;

	return (
		<div
			className="bg-white rounded-lg border p-4 active:bg-gray-50 transition-colors cursor-pointer"
			onClick={onTap}
			style={{ minHeight: "88px" }} // Minimum touch target
		>
			{/* Header */}
			<div className="flex items-start justify-between mb-3">
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-1">
						<h3 className="font-medium text-sm truncate">
							{component.componentId}
						</h3>
						{isStalled && (
							<Triangle className="h-3 w-3 text-orange-500 fill-orange-100 shrink-0" />
						)}
					</div>

					{component.description && (
						<p className="text-xs text-muted-foreground truncate">
							{component.description}
						</p>
					)}

					<div className="flex items-center gap-2 mt-1">
						{component.area && (
							<Badge
								status="info"
								className="text-xs px-1 py-0 gap-1"
							>
								<MapPin className="h-2 w-2" />
								{component.area}
							</Badge>
						)}
						{component.updatedAt && (
							<div className="flex items-center gap-1 text-xs text-muted-foreground">
								<Clock className="h-2 w-2" />
								{new Date(
									component.updatedAt,
								).toLocaleDateString()}
							</div>
						)}
					</div>
				</div>

				{/* Progress indicator */}
				<div className="text-right shrink-0 ml-3">
					<div
						className={cn(
							"text-lg font-bold",
							progressPercent === 100
								? "text-green-600"
								: "text-primary",
						)}
					>
						{progressPercent}%
					</div>
					{progressPercent === 100 && (
						<CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />
					)}
				</div>
			</div>

			{/* Progress bar */}
			<div className="mb-3">
				<Progress value={progressPercent} className="h-1.5" />
				<div className="flex justify-between mt-1 text-xs text-muted-foreground">
					<span>
						{completedMilestones}/{totalMilestones} milestones
					</span>
					{hasMoreMilestones && <span>Tap for all milestones</span>}
				</div>
			</div>

			{/* Quick milestone checkboxes */}
			{visibleMilestones.length > 0 && (
				<div className="flex items-center gap-2 overflow-x-auto">
					{visibleMilestones.map((milestone) => (
						<div
							key={milestone.id}
							className="flex items-center gap-1 shrink-0"
							onClick={(e) => e.stopPropagation()}
						>
							{milestone.isCompleted ? (
								<CheckCircle2 className="h-4 w-4 text-green-600" />
							) : (
								<Circle className="h-4 w-4 text-muted-foreground" />
							)}
							<span className="text-xs truncate max-w-[80px]">
								{milestone.milestoneName}
							</span>
						</div>
					))}
					{hasMoreMilestones && (
						<div className="text-xs text-muted-foreground shrink-0">
							+{(component.milestones?.length || 0) - 3}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
