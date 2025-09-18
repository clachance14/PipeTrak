"use client";

import { Alert, AlertDescription } from "@ui/components/alert";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Progress } from "@ui/components/progress";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import {
	AlertCircle,
	ArrowUpDown,
	ChevronLeft,
	ChevronRight,
	Filter,
	RefreshCw,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useComponentReportGeneration } from "../hooks"; // useReportFilters removed - hook not found
import { transformers } from "../lib/report-utils";
import type { ComponentDetailsResponse, ReportSorting } from "../types";
// import { ReportFilters } from "./ReportFilters"; // Component not found
import { ExportButtons } from "./ExportButtons";
import { PrintLayout } from "./PrintLayout";
import { ReportHeader } from "./ReportHeader";

interface ComponentReportContentProps {
	projectId: string;
	initialFilters?: Record<string, string>;
}

/**
 * Main content component for detailed component reports
 * Handles data fetching, filtering, pagination, and table display
 */
export function ComponentReportContent({
	projectId,
	initialFilters = {},
}: ComponentReportContentProps) {
	const [reportData, setReportData] =
		useState<ComponentDetailsResponse | null>(null);
	const [isInitialLoad, setIsInitialLoad] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize] = useState(50); // TODO: Implement pagination controls
	const [sorting, setSorting] = useState<ReportSorting>({
		field: "componentId",
		direction: "asc",
	});

	// Report generation and filtering hooks
	const {
		mutate: generateReport,
		isPending: isGenerating,
		error,
	} = useComponentReportGeneration();
	// Temporarily replace useReportFilters hook with basic state until hook is implemented
	const filters = initialFilters;
	// const updateFilters = () => {}; // TODO: implement filtering - removed unused
	const clearFilters = () => {}; // TODO: implement clearing
	// const searchQuery = ""; // TODO: implement search - removed unused
	// const updateSearchQuery = () => {}; // TODO: implement search - removed unused
	const activeFilterCount = 0;
	// const filterOptions = null; // TODO: implement filter options - removed unused
	// const isLoadingOptions = false; // TODO: implement filter options - removed unused
	// const toComponentDetailsFilters = () => ({ projectId }); // removed unused function

	// Generate report on changes
	useEffect(() => {
		const generateComponentReport = () => {
			generateReport(
				{
					projectId,
					filters: { projectId } as any, // TODO: Fix type mismatch with ComponentDetailsFileFilters
					pagination: {
						limit: pageSize,
						offset: (currentPage - 1) * pageSize,
					},
					sorting,
				},
				{
					onSuccess: (data) => {
						setReportData(data);
						setIsInitialLoad(false);
					},
				},
			);
		};

		generateComponentReport();
	}, [
		projectId,
		filters,
		// searchQuery, // removed unused variable
		currentPage,
		pageSize,
		sorting,
		generateReport,
		// toComponentDetailsFilters, // removed unused function
	]);

	// Transform data for display
	const tableData = useMemo(() => {
		if (!reportData?.data.components) return [];
		return transformers.toTableData(reportData.data.components);
	}, [reportData]);

	// Pagination calculations
	const totalPages = reportData?.data.pagination
		? Math.ceil(reportData.data.pagination.totalCount / pageSize)
		: 0;

	// Sorting handler
	const handleSort = (field: ReportSorting["field"]) => {
		setSorting((prev) => ({
			field,
			direction:
				prev.field === field && prev.direction === "asc"
					? "desc"
					: "asc",
		}));
	};

	// Manual refresh handler
	const handleRefresh = () => {
		generateReport(
			{
				projectId,
				filters: { projectId } as any, // TODO: Fix type mismatch with ComponentDetailsFileFilters
				pagination: {
					limit: pageSize,
					offset: (currentPage - 1) * pageSize,
				},
				sorting,
			},
			{
				onSuccess: (data) => {
					setReportData(data);
				},
			},
		);
	};

	// Get status badge variant
	const getStatusVariant = (
		completion: number,
	): "default" | "secondary" | "destructive" | "outline" => {
		if (completion === 100) return "default";
		if (completion >= 75) return "secondary";
		if (completion >= 25) return "outline";
		return "destructive";
	};

	return (
		<PrintLayout
			title="Component Details Report"
			projectInfo={
				reportData?.data
					? {
							jobNumber: projectId,
							jobName: "Project",
							organization: "Organization",
						}
					: undefined
			}
			includeHeader={true}
			includeFooter={true}
			orientation="landscape"
		>
			<div className="space-y-6">
				{/* Report Header */}
				<ReportHeader
					title="Component Details Report"
					description="Detailed component-level analysis with milestone tracking"
					reportType="Component Details"
					isLoading={isInitialLoad && isGenerating}
				/>

				{/* Error Display */}
				{error && (
					<Alert variant="error">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							Failed to generate component report: {error.message}
						</AlertDescription>
					</Alert>
				)}

				{/* Search and Filters */}
				<div className="flex flex-col lg:flex-row gap-4 no-print">
					<div className="flex-1">
						{/* <ReportFilters
							filters={filters}
							onFiltersChange={updateFilters}
							searchQuery={searchQuery}
							onSearchChange={updateSearchQuery}
							filterOptions={filterOptions}
							isLoading={isLoadingOptions}
							showAdvanced={true}
						/> */}
						<div className="text-sm text-muted-foreground">
							Report filters temporarily disabled - component
							implementation needed
						</div>
					</div>
					<div className="lg:w-auto">
						<div className="flex flex-col gap-2">
							<Button
								variant="outline"
								onClick={handleRefresh}
								disabled={isGenerating}
								className="w-full lg:w-auto"
							>
								<RefreshCw
									className={`mr-2 h-4 w-4 ${isGenerating ? "animate-spin" : ""}`}
								/>
								Refresh
							</Button>
							{reportData && (
								<ExportButtons
									reportType="component-details"
									projectId={projectId}
									data={reportData.data}
									filters={filters}
									className="w-full lg:w-auto"
								/>
							)}
						</div>
					</div>
				</div>

				{/* Summary Stats */}
				{reportData && (
					<Card className="no-print">
						<CardContent className="p-6">
							<div className="grid gap-4 md:grid-cols-4">
								<div className="text-center">
									<div className="text-2xl font-bold text-gray-900">
										{reportData.data.summary.totalComponents.toLocaleString()}
									</div>
									<div className="text-sm text-muted-foreground">
										Total Components
									</div>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold text-green-600">
										{reportData.data.summary.completedComponents.toLocaleString()}
									</div>
									<div className="text-sm text-muted-foreground">
										Completed
									</div>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold text-blue-600">
										{reportData.data.summary.averageCompletion.toFixed(
											1,
										)}
										%
									</div>
									<div className="text-sm text-muted-foreground">
										Average Completion
									</div>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold text-orange-600">
										{
											reportData.data.summary
												.stalledComponents
										}
									</div>
									<div className="text-sm text-muted-foreground">
										Stalled Components
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Main Data Table */}
				{isGenerating && isInitialLoad ? (
					<Card className="animate-pulse">
						<CardContent className="p-6">
							<div className="space-y-4">
								<div className="h-6 bg-gray-300 rounded w-1/4" />
								{[1, 2, 3, 4, 5].map((i) => (
									<div
										key={i}
										className="h-12 bg-gray-200 rounded"
									/>
								))}
							</div>
						</CardContent>
					</Card>
				) : reportData && tableData.length > 0 ? (
					<Card>
						<CardHeader className="pb-4">
							<div className="flex items-center justify-between">
								<CardTitle>Component Details</CardTitle>
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<Filter className="h-4 w-4" />
									{reportData.data.pagination.totalCount.toLocaleString()}{" "}
									components
									{activeFilterCount > 0 &&
										` (${activeFilterCount} filters applied)`}
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="w-[200px]">
												<Button
													variant="ghost"
													onClick={() =>
														handleSort(
															"componentId",
														)
													}
													className="h-auto p-0 font-semibold"
												>
													Component ID
													<ArrowUpDown className="ml-1 h-3 w-3" />
												</Button>
											</TableHead>
											<TableHead>
												<Button
													variant="ghost"
													onClick={() =>
														handleSort("type")
													}
													className="h-auto p-0 font-semibold"
												>
													Type
													<ArrowUpDown className="ml-1 h-3 w-3" />
												</Button>
											</TableHead>
											<TableHead>
												<Button
													variant="ghost"
													onClick={() =>
														handleSort("area")
													}
													className="h-auto p-0 font-semibold"
												>
													Area
													<ArrowUpDown className="ml-1 h-3 w-3" />
												</Button>
											</TableHead>
											<TableHead>
												<Button
													variant="ghost"
													onClick={() =>
														handleSort("system")
													}
													className="h-auto p-0 font-semibold"
												>
													System
													<ArrowUpDown className="ml-1 h-3 w-3" />
												</Button>
											</TableHead>
											<TableHead className="w-[150px]">
												<Button
													variant="ghost"
													onClick={() =>
														handleSort(
															"completionPercent",
														)
													}
													className="h-auto p-0 font-semibold"
												>
													Completion
													<ArrowUpDown className="ml-1 h-3 w-3" />
												</Button>
											</TableHead>
											<TableHead>
												<Button
													variant="ghost"
													onClick={() =>
														handleSort("status")
													}
													className="h-auto p-0 font-semibold"
												>
													Status
													<ArrowUpDown className="ml-1 h-3 w-3" />
												</Button>
											</TableHead>
											<TableHead>
												<Button
													variant="ghost"
													onClick={() =>
														handleSort("updatedAt")
													}
													className="h-auto p-0 font-semibold"
												>
													Last Updated
													<ArrowUpDown className="ml-1 h-3 w-3" />
												</Button>
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{tableData.map((component) => (
											<TableRow
												key={component.componentId}
											>
												<TableCell className="font-medium">
													{component.componentId}
												</TableCell>
												<TableCell>
													{component.type}
												</TableCell>
												<TableCell>
													{component.area || "—"}
												</TableCell>
												<TableCell>
													{component.system || "—"}
												</TableCell>
												<TableCell>
													<div className="space-y-1">
														<div className="flex items-center justify-between text-xs">
															<span>
																{
																	component.formattedCompletion
																}
															</span>
															<span
																className={
																	component.statusColor
																}
															>
																{
																	component.statusIcon
																}
															</span>
														</div>
														<Progress
															value={
																component.completionPercent
															}
															className="h-1"
														/>
													</div>
												</TableCell>
												<TableCell>
													<Badge
														variant={getStatusVariant(
															component.completionPercent,
														)}
													>
														{component.status}
													</Badge>
												</TableCell>
												<TableCell className="text-sm text-muted-foreground">
													{component.formattedUpdated}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>

							{/* Pagination */}
							{totalPages > 1 && (
								<div className="flex items-center justify-between mt-6 no-print">
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<span>
											Showing{" "}
											{(currentPage - 1) * pageSize + 1}{" "}
											to{" "}
											{Math.min(
												currentPage * pageSize,
												reportData.data.pagination
													.totalCount,
											)}{" "}
											of{" "}
											{reportData.data.pagination.totalCount.toLocaleString()}{" "}
											components
										</span>
									</div>
									<div className="flex items-center gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												setCurrentPage((prev) =>
													Math.max(1, prev - 1),
												)
											}
											disabled={
												currentPage === 1 ||
												isGenerating
											}
										>
											<ChevronLeft className="h-4 w-4" />
											Previous
										</Button>
										<div className="flex items-center gap-1">
											{Array.from(
												{
													length: Math.min(
														5,
														totalPages,
													),
												},
												(_, i) => {
													const page = i + 1;
													return (
														<Button
															key={page}
															variant={
																currentPage ===
																page
																	? "default"
																	: "outline"
															}
															size="sm"
															onClick={() =>
																setCurrentPage(
																	page,
																)
															}
															disabled={
																isGenerating
															}
															className="w-8"
														>
															{page}
														</Button>
													);
												},
											)}
											{totalPages > 5 && (
												<>
													<span className="px-2">
														...
													</span>
													<Button
														variant={
															currentPage ===
															totalPages
																? "default"
																: "outline"
														}
														size="sm"
														onClick={() =>
															setCurrentPage(
																totalPages,
															)
														}
														disabled={isGenerating}
														className="w-8"
													>
														{totalPages}
													</Button>
												</>
											)}
										</div>
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												setCurrentPage((prev) =>
													Math.min(
														totalPages,
														prev + 1,
													),
												)
											}
											disabled={
												currentPage === totalPages ||
												isGenerating
											}
										>
											Next
											<ChevronRight className="h-4 w-4" />
										</Button>
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				) : (
					<Card>
						<CardContent className="flex items-center justify-center py-12">
							<div className="text-center text-muted-foreground">
								<AlertCircle className="h-8 w-8 mx-auto mb-2" />
								<p>
									No components found matching the current
									filters
								</p>
								<Button
									variant="outline"
									onClick={clearFilters}
									className="mt-4"
								>
									Clear Filters
								</Button>
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</PrintLayout>
	);
}
