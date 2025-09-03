"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Calendar } from "@ui/components/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ui/components/popover";
import { Separator } from "@ui/components/separator";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	Filter,
	X,
	Calendar as CalendarIcon,
	ChevronDown,
	ChevronUp,
	Search,
	RotateCcw,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@ui/lib";
import type { ReportFilters, FilterOptionsResponse } from "../types";

interface ReportFiltersProps {
	filters: ReportFilters;
	onFiltersChange: (filters: ReportFilters) => void;
	filterOptions?: FilterOptionsResponse["data"];
	isLoading?: boolean;
	showAdvanced?: boolean;
	searchQuery?: string;
	onSearchChange?: (query: string) => void;
}

/**
 * Advanced filter component for reports
 * Supports date ranges, multi-select dropdowns, search, and filter management
 */
export function ReportFilters({
	filters,
	onFiltersChange,
	filterOptions,
	isLoading = false,
	showAdvanced = false,
	searchQuery = "",
	onSearchChange,
}: ReportFiltersProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [dateRange, setDateRange] = useState<{
		from?: Date;
		to?: Date;
	}>({
		from: filters.dateRange?.start
			? new Date(filters.dateRange.start)
			: undefined,
		to: filters.dateRange?.end
			? new Date(filters.dateRange.end)
			: undefined,
	});

	const handleMultiSelectChange = (
		key: keyof ReportFilters,
		value: string,
		isSelected: boolean,
	) => {
		const currentValues = (filters[key] as string[]) || [];
		const newValues = isSelected
			? [...currentValues, value]
			: currentValues.filter((v) => v !== value);

		onFiltersChange({
			...filters,
			[key]: newValues.length > 0 ? newValues : undefined,
		});
	};

	const handleDateRangeChange = (from?: Date, to?: Date) => {
		setDateRange({ from, to });

		if (from || to) {
			onFiltersChange({
				...filters,
				dateRange: {
					start: from ? format(from, "yyyy-MM-dd") : "",
					end: to ? format(to, "yyyy-MM-dd") : "",
				},
			});
		} else {
			const { dateRange, ...filtersWithoutDate } = filters;
			onFiltersChange(filtersWithoutDate);
		}
	};

	const handleCompletionRangeChange = (min?: number, max?: number) => {
		if (min !== undefined || max !== undefined) {
			onFiltersChange({
				...filters,
				completionRange: {
					min: min ?? 0,
					max: max ?? 100,
				},
			});
		} else {
			const { completionRange, ...filtersWithoutCompletion } = filters;
			onFiltersChange(filtersWithoutCompletion);
		}
	};

	const clearAllFilters = () => {
		onFiltersChange({});
		setDateRange({ from: undefined, to: undefined });
	};

	const getActiveFilterCount = () => {
		let count = 0;
		if (filters.areas?.length) count++;
		if (filters.systems?.length) count++;
		if (filters.testPackages?.length) count++;
		if (filters.componentTypes?.length) count++;
		if (filters.statuses?.length) count++;
		if (filters.dateRange) count++;
		if (filters.completionRange) count++;
		return count;
	};

	const activeFilterCount = getActiveFilterCount();

	if (isLoading) {
		return (
			<Card className="animate-pulse">
				<CardContent className="p-4">
					<div className="flex items-center justify-between mb-4">
						<div className="h-6 bg-gray-300 rounded w-32" />
						<div className="h-8 bg-gray-200 rounded w-20" />
					</div>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="h-10 bg-gray-200 rounded" />
						<div className="h-10 bg-gray-200 rounded" />
						<div className="h-10 bg-gray-200 rounded" />
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader className="pb-4">
				<div className="flex items-center justify-between">
					<CardTitle className="text-lg font-semibold flex items-center gap-2">
						<Filter className="h-5 w-5" />
						Filters
						{activeFilterCount > 0 && (
							<Badge status="info">{activeFilterCount}</Badge>
						)}
					</CardTitle>
					<div className="flex items-center gap-2">
						{activeFilterCount > 0 && (
							<Button
								variant="ghost"
								size="sm"
								onClick={clearAllFilters}
								className="text-muted-foreground hover:text-destructive"
							>
								<RotateCcw className="h-4 w-4 mr-1" />
								Clear
							</Button>
						)}
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setIsExpanded(!isExpanded)}
						>
							{isExpanded ? (
								<ChevronUp className="h-4 w-4" />
							) : (
								<ChevronDown className="h-4 w-4" />
							)}
						</Button>
					</div>
				</div>
			</CardHeader>

			<CardContent className="space-y-4">
				{/* Search Input */}
				{onSearchChange && (
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search components..."
							value={searchQuery}
							onChange={(e) => onSearchChange(e.target.value)}
							className="pl-9"
						/>
					</div>
				)}

				{/* Primary Filters - Always Visible */}
				<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
					{/* Areas Filter */}
					<div className="space-y-2">
						<Label className="text-sm font-medium">Areas</Label>
						<Select>
							<SelectTrigger>
								<SelectValue placeholder="Select areas" />
							</SelectTrigger>
							<SelectContent>
								{filterOptions?.areas?.map((area) => {
									const isSelected =
										filters.areas?.includes(area) || false;
									return (
										<SelectItem
											key={area}
											value={area}
											onClick={(e) => {
												e.preventDefault();
												handleMultiSelectChange(
													"areas",
													area,
													!isSelected,
												);
											}}
											className="cursor-pointer"
										>
											<div className="flex items-center gap-2">
												<div
													className={cn(
														"w-4 h-4 border rounded",
														isSelected
															? "bg-primary border-primary"
															: "border-muted-foreground",
													)}
												/>
												{area}
											</div>
										</SelectItem>
									);
								})}
							</SelectContent>
						</Select>
						{filters.areas?.length && (
							<div className="flex flex-wrap gap-1">
								{filters.areas.map((area) => (
									<Badge
										key={area}
										status="info"
										className="text-xs"
									>
										{area}
										<Button
											variant="ghost"
											size="sm"
											className="h-auto p-0 ml-1"
											onClick={() =>
												handleMultiSelectChange(
													"areas",
													area,
													false,
												)
											}
										>
											<X className="h-3 w-3" />
										</Button>
									</Badge>
								))}
							</div>
						)}
					</div>

					{/* Systems Filter */}
					<div className="space-y-2">
						<Label className="text-sm font-medium">Systems</Label>
						<Select>
							<SelectTrigger>
								<SelectValue placeholder="Select systems" />
							</SelectTrigger>
							<SelectContent>
								{filterOptions?.systems?.map((system) => {
									const isSelected =
										filters.systems?.includes(system) ||
										false;
									return (
										<SelectItem
											key={system}
											value={system}
											onClick={(e) => {
												e.preventDefault();
												handleMultiSelectChange(
													"systems",
													system,
													!isSelected,
												);
											}}
											className="cursor-pointer"
										>
											<div className="flex items-center gap-2">
												<div
													className={cn(
														"w-4 h-4 border rounded",
														isSelected
															? "bg-primary border-primary"
															: "border-muted-foreground",
													)}
												/>
												{system}
											</div>
										</SelectItem>
									);
								})}
							</SelectContent>
						</Select>
						{filters.systems?.length && (
							<div className="flex flex-wrap gap-1">
								{filters.systems.map((system) => (
									<Badge
										key={system}
										status="info"
										className="text-xs"
									>
										{system}
										<Button
											variant="ghost"
											size="sm"
											className="h-auto p-0 ml-1"
											onClick={() =>
												handleMultiSelectChange(
													"systems",
													system,
													false,
												)
											}
										>
											<X className="h-3 w-3" />
										</Button>
									</Badge>
								))}
							</div>
						)}
					</div>

					{/* Date Range Filter */}
					<div className="space-y-2">
						<Label className="text-sm font-medium">
							Date Range
						</Label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									status="info"
									className={cn(
										"w-full justify-start text-left font-normal",
										!dateRange.from &&
											"text-muted-foreground",
									)}
								>
									<CalendarIcon className="mr-2 h-4 w-4" />
									{dateRange.from ? (
										dateRange.to ? (
											<>
												{format(
													dateRange.from,
													"LLL dd, y",
												)}{" "}
												-{" "}
												{format(
													dateRange.to,
													"LLL dd, y",
												)}
											</>
										) : (
											format(dateRange.from, "LLL dd, y")
										)
									) : (
										<span>Pick a date range</span>
									)}
								</Button>
							</PopoverTrigger>
							<PopoverContent
								className="w-auto p-0"
								align="start"
							>
								<Calendar
									initialFocus
									mode="range"
									defaultMonth={dateRange.from}
									selected={{
										from: dateRange.from,
										to: dateRange.to,
									}}
									onSelect={(range) => {
										handleDateRangeChange(
											range?.from,
											range?.to,
										);
									}}
									numberOfMonths={2}
								/>
							</PopoverContent>
						</Popover>
					</div>
				</div>

				{/* Advanced Filters - Collapsible */}
				{(isExpanded || showAdvanced) && (
					<>
						<Separator />
						<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
							{/* Test Packages Filter */}
							{filterOptions?.testPackages?.length && (
								<div className="space-y-2">
									<Label className="text-sm font-medium">
										Test Packages
									</Label>
									<Select>
										<SelectTrigger>
											<SelectValue placeholder="Select test packages" />
										</SelectTrigger>
										<SelectContent>
											{filterOptions.testPackages.map(
												(pkg) => {
													const isSelected =
														filters.testPackages?.includes(
															pkg,
														) || false;
													return (
														<SelectItem
															key={pkg}
															value={pkg}
															onClick={(e) => {
																e.preventDefault();
																handleMultiSelectChange(
																	"testPackages",
																	pkg,
																	!isSelected,
																);
															}}
															className="cursor-pointer"
														>
															<div className="flex items-center gap-2">
																<div
																	className={cn(
																		"w-4 h-4 border rounded",
																		isSelected
																			? "bg-primary border-primary"
																			: "border-muted-foreground",
																	)}
																/>
																{pkg}
															</div>
														</SelectItem>
													);
												},
											)}
										</SelectContent>
									</Select>
								</div>
							)}

							{/* Component Types Filter */}
							{filterOptions?.componentTypes?.length && (
								<div className="space-y-2">
									<Label className="text-sm font-medium">
										Component Types
									</Label>
									<Select>
										<SelectTrigger>
											<SelectValue placeholder="Select types" />
										</SelectTrigger>
										<SelectContent>
											{filterOptions.componentTypes.map(
												(type) => {
													const isSelected =
														filters.componentTypes?.includes(
															type,
														) || false;
													return (
														<SelectItem
															key={type}
															value={type}
															onClick={(e) => {
																e.preventDefault();
																handleMultiSelectChange(
																	"componentTypes",
																	type,
																	!isSelected,
																);
															}}
															className="cursor-pointer"
														>
															<div className="flex items-center gap-2">
																<div
																	className={cn(
																		"w-4 h-4 border rounded",
																		isSelected
																			? "bg-primary border-primary"
																			: "border-muted-foreground",
																	)}
																/>
																{type}
															</div>
														</SelectItem>
													);
												},
											)}
										</SelectContent>
									</Select>
								</div>
							)}

							{/* Statuses Filter */}
							{filterOptions?.statuses?.length && (
								<div className="space-y-2">
									<Label className="text-sm font-medium">
										Statuses
									</Label>
									<Select>
										<SelectTrigger>
											<SelectValue placeholder="Select statuses" />
										</SelectTrigger>
										<SelectContent>
											{filterOptions.statuses.map(
												(status) => {
													const isSelected =
														filters.statuses?.includes(
															status,
														) || false;
													return (
														<SelectItem
															key={status}
															value={status}
															onClick={(e) => {
																e.preventDefault();
																handleMultiSelectChange(
																	"statuses",
																	status,
																	!isSelected,
																);
															}}
															className="cursor-pointer"
														>
															<div className="flex items-center gap-2">
																<div
																	className={cn(
																		"w-4 h-4 border rounded",
																		isSelected
																			? "bg-primary border-primary"
																			: "border-muted-foreground",
																	)}
																/>
																{status}
															</div>
														</SelectItem>
													);
												},
											)}
										</SelectContent>
									</Select>
								</div>
							)}

							{/* Completion Range Filter */}
							<div className="space-y-2 md:col-span-2">
								<Label className="text-sm font-medium">
									Completion Range (%)
								</Label>
								<div className="flex items-center gap-2">
									<Input
										type="number"
										min="0"
										max="100"
										placeholder="Min %"
										value={
											filters.completionRange?.min ?? ""
										}
										onChange={(e) => {
											const value = e.target.value
												? Number.parseInt(
														e.target.value,
													)
												: undefined;
											handleCompletionRangeChange(
												value,
												filters.completionRange?.max,
											);
										}}
										className="w-20"
									/>
									<span className="text-muted-foreground">
										to
									</span>
									<Input
										type="number"
										min="0"
										max="100"
										placeholder="Max %"
										value={
											filters.completionRange?.max ?? ""
										}
										onChange={(e) => {
											const value = e.target.value
												? Number.parseInt(
														e.target.value,
													)
												: undefined;
											handleCompletionRangeChange(
												filters.completionRange?.min,
												value,
											);
										}}
										className="w-20"
									/>
								</div>
							</div>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}
