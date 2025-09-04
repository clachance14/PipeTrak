"use client";

import { useState, useEffect, useMemo } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import { Input } from "@ui/components/input";
import { FileFilter, X, Search, RotateCcw } from "lucide-react";
import { cn } from "@ui/lib";
import type { ComponentWithMilestones } from "../../types";

export interface FileFilterState {
	area: string;
	testPackage: string;
	system: string;
	type: string;
	status: string;
	search: string;
}

interface FileFilterBarProps {
	components: ComponentWithMilestones[];
	onFileFilterChange: (filters: FileFilterState) => void;
	filteredCount: number;
	totalCount: number;
	className?: string;
}

const DEFAULT_FILTERS: FileFilterState = {
	area: "all",
	testPackage: "all",
	system: "all",
	type: "all",
	status: "all",
	search: "",
};

const STATUS_OPTIONS = [
	{ value: "all", label: "All Statuses" },
	{ value: "NOT_STARTED", label: "Not Started" },
	{ value: "IN_PROGRESS", label: "In Progress" },
	{ value: "COMPLETED", label: "Completed" },
] as const;

export function FileFilterBar({
	components,
	onFileFilterChange,
	filteredCount,
	totalCount,
	className,
}: FileFilterBarProps) {
	const [filters, setFileFilters] = useState<FileFilterState>(DEFAULT_FILTERS);

	// Load saved filters from localStorage on mount
	useEffect(() => {
		try {
			const saved = localStorage.getItem("pipetrak-component-filters");
			if (saved) {
				const savedFileFilters = JSON.parse(saved);
				setFileFilters(savedFileFilters);
				onFileFilterChange(savedFileFilters);
			}
		} catch (error) {
			console.error("Failed to load saved filters:", error);
		}
	}, [onFileFilterChange]);

	// Extract unique values from components for filter options
	const filterOptions = useMemo(() => {
		const areas = new Set<string>();
		const testPackages = new Set<string>();
		const systems = new Set<string>();
		const types = new Set<string>();

		components.forEach((component) => {
			if (component.area) areas.add(component.area);
			if (component.testPackage) testPackages.add(component.testPackage);
			if (component.system) systems.add(component.system);
			if (component.type) types.add(component.type);
		});

		return {
			areas: Array.from(areas).sort(),
			testPackages: Array.from(testPackages).sort(),
			systems: Array.from(systems).sort(),
			types: Array.from(types).sort(),
		};
	}, [components]);

	// Save to localStorage and notify parent when filters change
	const handleFileFilterChange = (key: keyof FileFilterState, value: string) => {
		const newFileFilters = { ...filters, [key]: value };
		setFileFilters(newFileFilters);

		// Save to localStorage
		try {
			localStorage.setItem(
				"pipetrak-component-filters",
				JSON.stringify(newFileFilters),
			);
		} catch (error) {
			console.error("Failed to save filters:", error);
		}

		onFileFilterChange(newFileFilters);
	};

	// Clear all filters
	const clearAllFileFilters = () => {
		setFileFilters(DEFAULT_FILTERS);
		try {
			localStorage.removeItem("pipetrak-component-filters");
		} catch (error) {
			console.error("Failed to clear saved filters:", error);
		}
		onFileFilterChange(DEFAULT_FILTERS);
	};

	// Check if any filters are active
	const hasActiveFileFilters = Object.entries(filters).some(([key, value]) => {
		if (key === "search") return value !== "";
		return value !== "all";
	});

	// Count active filters for badge
	const activeFileFilterCount = Object.entries(filters).filter(([key, value]) => {
		if (key === "search") return value !== "";
		return value !== "all";
	}).length;

	return (
		<div
			className={cn(
				"space-y-4 p-4 bg-gray-50 rounded-lg border",
				className,
			)}
		>
			{/* FileFilter Controls */}
			<div className="flex flex-col gap-4">
				{/* Top Row - Search and Primary FileFilters */}
				<div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
					{/* Search */}
					<div className="relative flex-1 sm:max-w-xs">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search components..."
							value={filters.search}
							onChange={(e) =>
								handleFileFilterChange("search", e.target.value)
							}
							className="pl-10"
						/>
					</div>

					{/* Clear FileFilters Button */}
					{hasActiveFileFilters && (
						<Button
							size="sm"
							onClick={clearAllFileFilters}
							className="shrink-0"
						>
							<RotateCcw className="h-4 w-4 mr-2" />
							Clear All
							{activeFileFilterCount > 0 && (
								<Badge
											className="ml-2 text-xs"
								>
									{activeFileFilterCount}
								</Badge>
							)}
						</Button>
					)}
				</div>

				{/* Bottom Row - Priority FileFilters */}
				<div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
					{/* Area FileFilter */}
					<Select
						value={filters.area}
						onValueChange={(value) =>
							handleFileFilterChange("area", value)
						}
					>
						<SelectTrigger>
							<SelectValue placeholder="Area" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Areas</SelectItem>
							{filterOptions.areas.map((area) => (
								<SelectItem key={area} value={area}>
									{area}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					{/* Test Package FileFilter */}
					<Select
						value={filters.testPackage}
						onValueChange={(value) =>
							handleFileFilterChange("testPackage", value)
						}
					>
						<SelectTrigger>
							<SelectValue placeholder="Test Package" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">
								All Test Packages
							</SelectItem>
							{filterOptions.testPackages.map((testPackage) => (
								<SelectItem
									key={testPackage}
									value={testPackage}
								>
									{testPackage}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					{/* System FileFilter */}
					<Select
						value={filters.system}
						onValueChange={(value) =>
							handleFileFilterChange("system", value)
						}
					>
						<SelectTrigger>
							<SelectValue placeholder="System" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Systems</SelectItem>
							{filterOptions.systems.map((system) => (
								<SelectItem key={system} value={system}>
									{system}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					{/* Type FileFilter */}
					<Select
						value={filters.type}
						onValueChange={(value) =>
							handleFileFilterChange("type", value)
						}
					>
						<SelectTrigger>
							<SelectValue placeholder="Type" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Types</SelectItem>
							{filterOptions.types.map((type) => (
								<SelectItem key={type} value={type}>
									{type}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					{/* Status FileFilter */}
					<Select
						value={filters.status}
						onValueChange={(value) =>
							handleFileFilterChange("status", value)
						}
					>
						<SelectTrigger>
							<SelectValue placeholder="Status" />
						</SelectTrigger>
						<SelectContent>
							{STATUS_OPTIONS.map((option) => (
								<SelectItem
									key={option.value}
									value={option.value}
								>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Results Summary */}
			<div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-3">
				<div className="flex items-center gap-2">
					<FileFilter className="h-4 w-4" />
					<span>
						Showing <strong>{filteredCount}</strong> of{" "}
						<strong>{totalCount}</strong> components
					</span>
					{hasActiveFileFilters && (
						<Badge status="info" className="text-xs">
							{activeFileFilterCount} filter
							{activeFileFilterCount !== 1 ? "s" : ""} active
						</Badge>
					)}
				</div>

				{/* Active FileFilter Tags */}
				{hasActiveFileFilters && (
					<div className="flex flex-wrap gap-1">
						{filters.search && (
							<Badge status="info" className="text-xs">
								Search: {filters.search}
								<Button
									variant="ghost"
									size="sm"
									className="h-auto p-0 ml-1 text-muted-foreground hover:text-foreground"
									onClick={() =>
										handleFileFilterChange("search", "")
									}
								>
									<X className="h-3 w-3" />
								</Button>
							</Badge>
						)}
						{filters.area !== "all" && (
							<Badge status="info" className="text-xs">
								Area: {filters.area}
								<Button
									variant="ghost"
									size="sm"
									className="h-auto p-0 ml-1 text-muted-foreground hover:text-foreground"
									onClick={() =>
										handleFileFilterChange("area", "all")
									}
								>
									<X className="h-3 w-3" />
								</Button>
							</Badge>
						)}
						{filters.testPackage !== "all" && (
							<Badge status="info" className="text-xs">
								Test: {filters.testPackage}
								<Button
									variant="ghost"
									size="sm"
									className="h-auto p-0 ml-1 text-muted-foreground hover:text-foreground"
									onClick={() =>
										handleFileFilterChange("testPackage", "all")
									}
								>
									<X className="h-3 w-3" />
								</Button>
							</Badge>
						)}
						{filters.system !== "all" && (
							<Badge status="info" className="text-xs">
								System: {filters.system}
								<Button
									variant="ghost"
									size="sm"
									className="h-auto p-0 ml-1 text-muted-foreground hover:text-foreground"
									onClick={() =>
										handleFileFilterChange("system", "all")
									}
								>
									<X className="h-3 w-3" />
								</Button>
							</Badge>
						)}
						{filters.type !== "all" && (
							<Badge status="info" className="text-xs">
								Type: {filters.type}
								<Button
									variant="ghost"
									size="sm"
									className="h-auto p-0 ml-1 text-muted-foreground hover:text-foreground"
									onClick={() =>
										handleFileFilterChange("type", "all")
									}
								>
									<X className="h-3 w-3" />
								</Button>
							</Badge>
						)}
						{filters.status !== "all" && (
							<Badge status="info" className="text-xs">
								Status:{" "}
								{
									STATUS_OPTIONS.find(
										(s) => s.value === filters.status,
									)?.label
								}
								<Button
									variant="ghost"
									size="sm"
									className="h-auto p-0 ml-1 text-muted-foreground hover:text-foreground"
									onClick={() =>
										handleFileFilterChange("status", "all")
									}
								>
									<X className="h-3 w-3" />
								</Button>
							</Badge>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
