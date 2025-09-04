"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Separator } from "@ui/components/separator";
import { Alert, AlertDescription } from "@ui/components/alert";
import { ReportHeader } from "./ReportHeader";
import { ReportFileFilters } from "./ReportFileFilters";
import { ProgressChart } from "./ProgressChart";
import { ROCDisplay } from "./ROCDisplay";
import { ExportButtons } from "./ExportButtons";
import { PrintLayout } from "./PrintLayout";
import { useProgressReportGeneration, useReportFileFilters } from "../hooks";
import { transformers } from "../lib/report-utils";
import { RefreshCw, AlertCircle } from "lucide-react";
import type { ProgressReportResponse } from "../types";

interface ProgressReportContentProps {
	projectId: string;
	initialFileFilters?: Record<string, string>;
}

/**
 * Main content component for progress reports
 * Handles data fetching, filtering, and display of ROC-weighted progress
 */
export function ProgressReportContent({
	projectId,
	initialFileFilters = {},
}: ProgressReportContentProps) {
	const [reportData, setReportData] = useState<ProgressReportResponse | null>(
		null,
	);
	const [isInitialLoad, setIsInitialLoad] = useState(true);

	// Report generation and filtering hooks
	const {
		mutate: generateReport,
		isPending: isGenerating,
		error,
	} = useProgressReportGeneration();
	const {
		filters,
		updateFileFilters,
		clearFileFilters,
		activeFileFilterCount,
		filterOptions,
		isLoadingOptions,
	} = useReportFileFilters({
		projectId,
		initialFileFilters,
		persistToURL: true,
	});

	// Generate report on initial load and filter changes
	useEffect(() => {
		const generateProgressReport = () => {
			generateReport(
				{
					projectId,
					filters,
					options: {
						includeTrends: true,
						includeVelocity: true,
						includeForecasts: true,
						cacheTimeout: 300,
					},
				},
				{
					onSuccess: (data) => {
						setReportData(data);
						setIsInitialLoad(false);
					},
				},
			);
		};

		generateProgressReport();
	}, [projectId, filters, generateReport]);

	// Manual refresh handler
	const handleRefresh = () => {
		generateReport(
			{
				projectId,
				filters,
				options: {
					includeTrends: true,
					includeVelocity: true,
					includeForecasts: true,
					cacheTimeout: 0, // Force fresh data
				},
			},
			{
				onSuccess: (data) => {
					setReportData(data);
				},
			},
		);
	};

	// Transform data for charts
	const chartData = reportData?.data.comprehensiveReport
		? transformers.toChartData(reportData.data.comprehensiveReport)
		: undefined;

	const trendData =
		reportData?.data.comprehensiveReport.trends?.dailyProgress || [];

	return (
		<PrintLayout
			title="Progress Summary Report"
			projectInfo={reportData?.data.projectInfo}
			includeHeader={true}
			includeFooter={true}
			orientation="landscape"
		>
			<div className="space-y-6">
				{/* Report Header */}
				<ReportHeader
					title="Progress Summary Report"
					description="ROC-weighted progress analysis with completion tracking"
					projectInfo={reportData?.data.projectInfo}
					generatedAt={reportData?.data.generatedAt}
					reportType="Progress Summary"
					isLoading={isInitialLoad && isGenerating}
				/>

				{/* Error Display */}
				{error && (
					<Alert variant="error">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							Failed to generate progress report: {error.message}
						</AlertDescription>
					</Alert>
				)}

				{/* FileFilters and Controls */}
				<div className="flex flex-col lg:flex-row gap-4 no-print">
					<div className="flex-1">
						<ReportFileFilters
							filters={filters}
							onFileFiltersChange={updateFileFilters}
							filterOptions={filterOptions}
							isLoading={isLoadingOptions}
							showAdvanced={true}
						/>
					</div>
					<div className="lg:w-auto">
						<div className="flex flex-col gap-2">
							<Button
								status="info"
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
									reportType="progress-summary"
									projectId={projectId}
									data={reportData.data}
									filters={filters}
									className="w-full lg:w-auto"
								/>
							)}
						</div>
					</div>
				</div>

				{/* Main Content */}
				{isGenerating && isInitialLoad ? (
					<div className="space-y-6">
						{[1, 2, 3].map((i) => (
							<Card key={i} className="animate-pulse">
								<CardContent className="p-6">
									<div className="space-y-4">
										<div className="h-6 bg-gray-300 rounded w-1/3" />
										<div className="h-32 bg-gray-200 rounded" />
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				) : reportData ? (
					<div className="space-y-6">
						{/* ROC Display */}
						<ROCDisplay
							rocData={reportData.data.rocWeightedProgress}
							showBreakdowns={true}
							className="print-break-inside-avoid"
						/>

						<Separator className="no-print" />

						{/* Progress Charts */}
						<div className="grid gap-6 lg:grid-cols-2">
							{/* Time Series Chart */}
							{trendData.length > 0 && (
								<ProgressChart
									type="line"
									title="Progress Over Time"
									description="Daily completion progress and velocity trends"
									trendData={trendData}
									showExport={true}
									className="print-break-inside-avoid"
								/>
							)}

							{/* Distribution Chart */}
							{chartData && (
								<ProgressChart
									type="bar"
									title="Progress Distribution"
									description="Completion breakdown by area and system"
									data={chartData}
									showExport={true}
									className="print-break-inside-avoid"
								/>
							)}
						</div>

						{/* Summary Statistics */}
						<Card className="print-break-inside-avoid">
							<CardContent className="p-6">
								<h3 className="text-lg font-semibold mb-4">
									Project Summary
								</h3>
								<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
									<div className="text-center p-4 bg-gray-50 rounded-lg">
										<div className="text-2xl font-bold text-gray-900">
											{reportData.data.comprehensiveReport.overview.totalComponents.toLocaleString()}
										</div>
										<div className="text-sm text-muted-foreground">
											Total Components
										</div>
									</div>
									<div className="text-center p-4 bg-green-50 rounded-lg">
										<div className="text-2xl font-bold text-green-700">
											{reportData.data.comprehensiveReport.overview.completedComponents.toLocaleString()}
										</div>
										<div className="text-sm text-muted-foreground">
											Completed
										</div>
									</div>
									<div className="text-center p-4 bg-blue-50 rounded-lg">
										<div className="text-2xl font-bold text-blue-700">
											{
												reportData.data
													.comprehensiveReport
													.overview.activeDrawings
											}
										</div>
										<div className="text-sm text-muted-foreground">
											Active Drawings
										</div>
									</div>
									<div className="text-center p-4 bg-purple-50 rounded-lg">
										<div className="text-2xl font-bold text-purple-700">
											{
												reportData.data
													.comprehensiveReport
													.overview.testPackagesReady
											}
										</div>
										<div className="text-sm text-muted-foreground">
											Test Packages Ready
										</div>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Area and System Breakdowns */}
						<div className="grid gap-6 lg:grid-cols-2">
							{/* Top Areas */}
							<Card className="print-break-inside-avoid">
								<CardContent className="p-6">
									<h3 className="text-lg font-semibold mb-4">
										Top Areas by Progress
									</h3>
									<div className="space-y-3">
										{reportData.data.comprehensiveReport.areaBreakdowns
											.sort(
												(a, b) =>
													b.completionPercent -
													a.completionPercent,
											)
											.slice(0, 5)
											.map((area, index) => (
												<div
													key={area.area}
													className="flex items-center justify-between"
												>
													<div className="flex items-center gap-3">
														<div className="w-6 h-6 bg-blue-100 text-blue-700 rounded text-xs font-medium flex items-center justify-center">
															{index + 1}
														</div>
														<span className="font-medium">
															{area.area}
														</span>
													</div>
													<div className="text-right">
														<div className="font-semibold">
															{area.completionPercent.toFixed(
																1,
															)}
															%
														</div>
														<div className="text-xs text-muted-foreground">
															{
																area.completedComponents
															}{" "}
															/{" "}
															{
																area.totalComponents
															}
														</div>
													</div>
												</div>
											))}
									</div>
								</CardContent>
							</Card>

							{/* Top Systems */}
							<Card className="print-break-inside-avoid">
								<CardContent className="p-6">
									<h3 className="text-lg font-semibold mb-4">
										Top Systems by Progress
									</h3>
									<div className="space-y-3">
										{reportData.data.comprehensiveReport.systemBreakdowns
											.sort(
												(a, b) =>
													b.completionPercent -
													a.completionPercent,
											)
											.slice(0, 5)
											.map((system, index) => (
												<div
													key={system.system}
													className="flex items-center justify-between"
												>
													<div className="flex items-center gap-3">
														<div className="w-6 h-6 bg-green-100 text-green-700 rounded text-xs font-medium flex items-center justify-center">
															{index + 1}
														</div>
														<span className="font-medium">
															{system.system}
														</span>
													</div>
													<div className="text-right">
														<div className="font-semibold">
															{system.completionPercent.toFixed(
																1,
															)}
															%
														</div>
														<div className="text-xs text-muted-foreground">
															{
																system.completedComponents
															}{" "}
															/{" "}
															{
																system.totalComponents
															}
														</div>
													</div>
												</div>
											))}
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				) : (
					<Card>
						<CardContent className="flex items-center justify-center py-12">
							<div className="text-center text-muted-foreground">
								<AlertCircle className="h-8 w-8 mx-auto mb-2" />
								<p>No report data available</p>
								<Button
									status="info"
									onClick={handleRefresh}
									className="mt-4"
									disabled={isGenerating}
								>
									Retry Generation
								</Button>
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</PrintLayout>
	);
}
