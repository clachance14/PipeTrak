"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Button } from "@ui/components/button";
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
import { Badge } from "@ui/components/badge";
import { Alert, AlertDescription } from "@ui/components/alert";
import { Checkbox } from "@ui/components/checkbox";
import {
	Calendar,
	RefreshCw,
	AlertCircle,
	CheckCircle22,
	Clock,
	FileText,
	Sheet,
	FileImage,
	Printer,
} from "lucide-react";
import { format, addDays, startOfWeek } from "date-fns";
import { cn } from "@ui/lib";

interface ProgressSummaryReportContentProps {
	projectId: string;
}

interface ReportData {
	reportInfo: {
		projectId: string;
		projectName: string;
		jobNumber: string;
		organization: string;
		weekEnding: string;
		reportStatus: "FINAL" | "PRELIMINARY";
		generatedAt: string;
		groupBy: string;
	};
	data: Array<{
		area?: string;
		system?: string;
		test_package?: string;
		component_count: number;
		received_percent: number;
		installed_percent: number;
		punched_percent: number;
		tested_percent: number;
		restored_percent: number;
		overall_percent: number;
	}>;
	deltas?: Record<
		string,
		{
			received: number;
			installed: number;
			punched: number;
			tested: number;
			restored: number;
			overall: number;
		}
	>;
	summary: {
		totalComponents: number;
		overallProgress: number;
	};
}

export function ProgressSummaryReportContent({
	projectId,
}: ProgressSummaryReportContentProps) {
	// State
	const [reportData, setReportData] = useState<ReportData | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Report configuration
	const [weekEnding, setWeekEnding] = useState<Date>(() => {
		// Default to last Sunday
		const today = new Date();
		const lastSunday = startOfWeek(today, { weekStartsOn: 1 }); // Monday start, so Sunday is end
		return addDays(lastSunday, -1);
	});
	const [groupBy, setGroupBy] = useState<"area" | "system" | "testPackage">(
		"area",
	);
	const [showDeltas, setShowDeltas] = useState(true);
	const [includeZeroProgress, setIncludeZeroProgress] = useState(true);
	const [includeSubtotals, setIncludeSubtotals] = useState(true);
	const [includeGrandTotal, setIncludeGrandTotal] = useState(true);

	// Export states
	const [isExporting, setIsExporting] = useState<string | null>(null);

	// Calculate Tuesday 9 AM cutoff for current week
	const tuesday9AM = new Date(weekEnding);
	tuesday9AM.setDate(tuesday9AM.getDate() + 2); // Tuesday after Sunday
	tuesday9AM.setHours(9, 0, 0, 0);
	const isAfterCutoff = new Date() > tuesday9AM;
	const isFinal = isAfterCutoff;

	// Generate report
	const generateReport = async () => {
		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch(
				"/api/pipetrak/reports/progress-summary",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						projectId,
						weekEnding: format(weekEnding, "yyyy-MM-dd"),
						groupBy,
						options: {
							showDeltas,
							includeZeroProgress,
							includeSubtotals,
							includeGrandTotal,
						},
					}),
				},
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to generate report");
			}

			const result = await response.json();
			setReportData(result.data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
		} finally {
			setIsLoading(false);
		}
	};

	// Print function
	const handlePrint = () => {
		// Build URL with current configuration
		const printUrl = new URL(window.location.origin + window.location.pathname + '/print');
		printUrl.searchParams.set('weekEnding', format(weekEnding, 'yyyy-MM-dd'));
		printUrl.searchParams.set('groupBy', groupBy);
		printUrl.searchParams.set('showDeltas', showDeltas.toString());
		printUrl.searchParams.set('includeZeroProgress', includeZeroProgress.toString());
		printUrl.searchParams.set('includeGrandTotal', includeGrandTotal.toString());

		// Open in new window for printing
		window.open(printUrl.toString(), '_blank');
	};

	// Export functions
	const handleExport = async (format: "csv" | "excel" | "pdf") => {
		setIsExporting(format);

		try {
			const response = await fetch(
				"/api/pipetrak/exports/progress-summary",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						projectId,
						weekEnding: format(weekEnding, "yyyy-MM-dd"),
						groupBy,
						format,
						options: {
							showDeltas,
							includeZeroProgress,
							includeSubtotals,
							includeGrandTotal,
						},
					}),
				},
			);

			if (!response.ok) {
				throw new Error("Export failed");
			}

			// Download the file
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `PipeTrak_Progress_${reportData?.reportInfo.jobNumber}_WE_${format(weekEnding, "yyyy-MM-dd")}_${isFinal ? "FINAL" : "PRELIMINARY"}.${format === "excel" ? "xlsx" : format}`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Export failed");
		} finally {
			setIsExporting(null);
		}
	};

	// Load report on component mount and when configuration changes
	useEffect(() => {
		generateReport();
	}, [projectId, weekEnding, groupBy]);

	// Helper function to format delta values
	const formatDelta = (delta: number | undefined): string => {
		if (!delta || delta === 0) return "(0%)";
		const sign = delta > 0 ? "+" : "";
		return `(${sign}${Math.round(delta)}%)`;
	};

	// Get group key from row
	const getGroupKey = (row: ReportData["data"][0]): string => {
		return row.area || row.system || row.test_package || "Unknown";
	};

	// Get group column name
	const getGroupColumnName = (): string => {
		return groupBy === "testPackage"
			? "Test Package"
			: groupBy === "system"
				? "System"
				: "Area";
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="text-2xl">
								Progress Summary Report
							</CardTitle>
							<p className="text-muted-foreground mt-1">
								Weekly progress report for P6 schedule updates
								with Tuesday 9 AM cutoff
							</p>
						</div>
						<div className="flex items-center gap-2">
							<Badge
								variant={isFinal ? "default" : "secondary"}
								className="text-sm"
							>
								{isFinal ? (
									<>
										<CheckCircle22 className="w-3 h-3 mr-1" />
										FINAL
									</>
								) : (
									<>
										<Clock className="w-3 h-3 mr-1" />
										PRELIMINARY
									</>
								)}
							</Badge>
							{reportData && (
								<Badge status="info" className="text-xs">
									Generated:{" "}
									{format(
										new Date(
											reportData.reportInfo.generatedAt,
										),
										"MMM d, h:mm a",
									)}
								</Badge>
							)}
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{/* Status Alert */}
					<Alert
						className={cn(
							"mb-4",
							isFinal
								? "border-green-200 bg-green-50"
								: "border-yellow-200 bg-yellow-50",
						)}
					>
						<AlertCircle
							className={cn(
								"h-4 w-4",
								isFinal ? "text-green-600" : "text-yellow-600",
							)}
						/>
						<AlertDescription
							className={cn(
								isFinal ? "text-green-800" : "text-yellow-800",
							)}
						>
							{isFinal
								? `Data is locked for the week ending ${format(weekEnding, "MMM d, yyyy")}. Report marked as FINAL after Tuesday 9:00 AM cutoff.`
								: `Data can still be updated until ${format(tuesday9AM, "EEE MMM d, h:mm a")}. Report will be marked FINAL after cutoff.`}
						</AlertDescription>
					</Alert>

					{/* Report Configuration */}
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						{/* Week Selection */}
						<div className="space-y-2">
							<label className="text-sm font-medium">
								Week Ending (Sunday)
							</label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										status="info"
										className="w-full justify-start text-left font-normal"
									>
										<Calendar className="mr-2 h-4 w-4" />
										{format(weekEnding, "PPP")}
									</Button>
								</PopoverTrigger>
								<PopoverContent
									className="w-auto p-0"
									align="start"
								>
									<Calendar
										mode="single"
										selected={weekEnding}
										onSelect={(date) =>
											date && setWeekEnding(date)
										}
										initialFocus
									/>
								</PopoverContent>
							</Popover>
						</div>

						{/* Group By Selection */}
						<div className="space-y-2">
							<label className="text-sm font-medium">
								Group By
							</label>
							<Select
								value={groupBy}
								onValueChange={(value: any) =>
									setGroupBy(value)
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="area">
										Area/Sub-Area
									</SelectItem>
									<SelectItem value="system">
										System
									</SelectItem>
									<SelectItem value="testPackage">
										Test Package
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Options */}
						<div className="space-y-2">
							<label className="text-sm font-medium">
								Report Options
							</label>
							<div className="space-y-2">
								<div className="flex items-center space-x-2">
									<Checkbox
										id="showDeltas"
										checked={showDeltas}
										onCheckedChange={setShowDeltas}
									/>
									<label
										htmlFor="showDeltas"
										className="text-sm"
									>
										Show week-over-week delta
									</label>
								</div>
								<div className="flex items-center space-x-2">
									<Checkbox
										id="includeGrandTotal"
										checked={includeGrandTotal}
										onCheckedChange={setIncludeGrandTotal}
									/>
									<label
										htmlFor="includeGrandTotal"
										className="text-sm"
									>
										Show grand total
									</label>
								</div>
							</div>
						</div>

						{/* Actions */}
						<div className="space-y-2">
							<label className="text-sm font-medium">
								Actions
							</label>
							<div className="flex flex-col gap-2">
								<Button
									status="info"
									onClick={generateReport}
									disabled={isLoading}
									className="w-full"
								>
									<RefreshCw
										className={cn(
											"mr-2 h-4 w-4",
											isLoading && "animate-spin",
										)}
									/>
									{isLoading
										? "Generating..."
										: "Generate Report"}
								</Button>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Error Display */}
			{error && (
				<Alert variant="error">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{/* Report Content */}
			{reportData && (
				<div className="space-y-6">
					{/* Export Buttons */}
					<Card>
						<CardContent className="pt-6">
							<div className="flex items-center justify-between">
								<div>
									<h3 className="text-lg font-semibold">
										Export Report
									</h3>
									<p className="text-sm text-muted-foreground">
										Download the report in various formats
										for distribution and P6 updates
									</p>
								</div>
								<div className="flex gap-2">
									<Button
										status="info"
										size="sm"
										onClick={handlePrint}
										disabled={isExporting !== null}
									>
										<Printer className="mr-2 h-4 w-4" />
										Print/PDF
									</Button>
									<Button
										status="info"
										size="sm"
										onClick={() => handleExport("pdf")}
										disabled={isExporting !== null}
									>
										<FileText className="mr-2 h-4 w-4" />
										{isExporting === "pdf"
											? "Exporting..."
											: "PDF"}
									</Button>
									<Button
										status="info"
										size="sm"
										onClick={() => handleExport("excel")}
										disabled={isExporting !== null}
									>
										<Sheet className="mr-2 h-4 w-4" />
										{isExporting === "excel"
											? "Exporting..."
											: "Excel"}
									</Button>
									<Button
										status="info"
										size="sm"
										onClick={() => handleExport("csv")}
										disabled={isExporting !== null}
									>
										<FileImage className="mr-2 h-4 w-4" />
										{isExporting === "csv"
											? "Exporting..."
											: "CSV"}
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Progress Summary Table */}
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle>
										Progress by {getGroupColumnName()}
									</CardTitle>
									<p className="text-sm text-muted-foreground">
										Week ending {format(weekEnding, "PPPP")}{" "}
										•{" "}
										{reportData.summary.totalComponents.toLocaleString()}{" "}
										total components
									</p>
								</div>
								<Badge
									status="info"
									className="text-sm font-mono"
								>
									{Math.round(
										reportData.summary.overallProgress,
									)}
									% Overall
								</Badge>
							</div>
						</CardHeader>
						<CardContent>
							<div className="overflow-x-auto">
								<table className="w-full border-collapse border border-gray-300 text-sm">
									<thead>
										<tr className="bg-gray-50">
											<th className="border border-gray-300 px-3 py-2 text-left font-semibold">
												{getGroupColumnName()}
											</th>
											<th className="border border-gray-300 px-3 py-2 text-center font-semibold">
												Budget
											</th>
											<th className="border border-gray-300 px-3 py-2 text-center font-semibold">
												Received
											</th>
											<th className="border border-gray-300 px-3 py-2 text-center font-semibold">
												Installed
											</th>
											<th className="border border-gray-300 px-3 py-2 text-center font-semibold">
												Punched
											</th>
											<th className="border border-gray-300 px-3 py-2 text-center font-semibold">
												Tested
											</th>
											<th className="border border-gray-300 px-3 py-2 text-center font-semibold">
												Restored
											</th>
											<th className="border border-gray-300 px-3 py-2 text-center font-semibold">
												Total
											</th>
										</tr>
									</thead>
									<tbody>
										{reportData.data.map((row, index) => {
											const key = getGroupKey(row);
											const delta =
												reportData.deltas?.[key];

											return (
												<React.Fragment key={key}>
													<tr
														className={
															index % 2 === 0
																? "bg-white"
																: "bg-gray-50"
														}
													>
														<td className="border border-gray-300 px-3 py-2 font-medium">
															{key}
														</td>
														<td className="border border-gray-300 px-3 py-2 text-center">
															{
																row.component_count
															}
														</td>
														<td className="border border-gray-300 px-3 py-2 text-center font-semibold">
															{Math.round(
																row.received_percent,
															)}
															%
														</td>
														<td className="border border-gray-300 px-3 py-2 text-center font-semibold">
															{Math.round(
																row.installed_percent,
															)}
															%
														</td>
														<td className="border border-gray-300 px-3 py-2 text-center font-semibold">
															{Math.round(
																row.punched_percent,
															)}
															%
														</td>
														<td className="border border-gray-300 px-3 py-2 text-center font-semibold">
															{Math.round(
																row.tested_percent,
															)}
															%
														</td>
														<td className="border border-gray-300 px-3 py-2 text-center font-semibold">
															{Math.round(
																row.restored_percent,
															)}
															%
														</td>
														<td className="border border-gray-300 px-3 py-2 text-center font-semibold">
															{Math.round(
																row.overall_percent,
															)}
															%
														</td>
													</tr>
													{showDeltas && delta && (
														<tr className="text-xs text-muted-foreground">
															<td className="border border-gray-300 px-3 py-1" />
															<td className="border border-gray-300 px-3 py-1" />
															<td className="border border-gray-300 px-3 py-1 text-center">
																<span
																	className={cn(
																		delta.received >
																			0
																			? "text-green-600"
																			: delta.received <
																					0
																				? "text-red-600"
																				: "text-gray-500",
																	)}
																>
																	{formatDelta(
																		delta.received,
																	)}
																</span>
															</td>
															<td className="border border-gray-300 px-3 py-1 text-center">
																<span
																	className={cn(
																		delta.installed >
																			0
																			? "text-green-600"
																			: delta.installed <
																					0
																				? "text-red-600"
																				: "text-gray-500",
																	)}
																>
																	{formatDelta(
																		delta.installed,
																	)}
																</span>
															</td>
															<td className="border border-gray-300 px-3 py-1 text-center">
																<span
																	className={cn(
																		delta.punched >
																			0
																			? "text-green-600"
																			: delta.punched <
																					0
																				? "text-red-600"
																				: "text-gray-500",
																	)}
																>
																	{formatDelta(
																		delta.punched,
																	)}
																</span>
															</td>
															<td className="border border-gray-300 px-3 py-1 text-center">
																<span
																	className={cn(
																		delta.tested >
																			0
																			? "text-green-600"
																			: delta.tested <
																					0
																				? "text-red-600"
																				: "text-gray-500",
																	)}
																>
																	{formatDelta(
																		delta.tested,
																	)}
																</span>
															</td>
															<td className="border border-gray-300 px-3 py-1 text-center">
																<span
																	className={cn(
																		delta.restored >
																			0
																			? "text-green-600"
																			: delta.restored <
																					0
																				? "text-red-600"
																				: "text-gray-500",
																	)}
																>
																	{formatDelta(
																		delta.restored,
																	)}
																</span>
															</td>
															<td className="border border-gray-300 px-3 py-1 text-center">
																<span
																	className={cn(
																		delta.overall >
																			0
																			? "text-green-600"
																			: delta.overall <
																					0
																				? "text-red-600"
																				: "text-gray-500",
																	)}
																>
																	{formatDelta(
																		delta.overall,
																	)}
																</span>
															</td>
														</tr>
													)}
												</React.Fragment>
											);
										})}
									</tbody>
								</table>
							</div>

							{reportData.data.length === 0 && (
								<div className="text-center py-8 text-muted-foreground">
									No data available for the selected week and
									grouping.
								</div>
							)}
						</CardContent>
					</Card>

					{/* Report Metadata */}
					<Card>
						<CardContent className="pt-6">
							<div className="grid gap-4 md:grid-cols-3">
								<div>
									<h4 className="font-semibold mb-2">
										Project Information
									</h4>
									<div className="text-sm space-y-1">
										<div>
											<span className="font-medium">
												Project:
											</span>{" "}
											{reportData.reportInfo.projectName}
										</div>
										<div>
											<span className="font-medium">
												Job Number:
											</span>{" "}
											{reportData.reportInfo.jobNumber}
										</div>
										<div>
											<span className="font-medium">
												Organization:
											</span>{" "}
											{reportData.reportInfo.organization}
										</div>
									</div>
								</div>
								<div>
									<h4 className="font-semibold mb-2">
										Report Configuration
									</h4>
									<div className="text-sm space-y-1">
										<div>
											<span className="font-medium">
												Week Ending:
											</span>{" "}
											{format(weekEnding, "PPP")}
										</div>
										<div>
											<span className="font-medium">
												Grouped By:
											</span>{" "}
											{getGroupColumnName()}
										</div>
										<div>
											<span className="font-medium">
												Show Deltas:
											</span>{" "}
											{showDeltas ? "Yes" : "No"}
										</div>
									</div>
								</div>
								<div>
									<h4 className="font-semibold mb-2">
										Report Status
									</h4>
									<div className="text-sm space-y-1">
										<div>
											<span className="font-medium">
												Status:
											</span>{" "}
											{reportData.reportInfo.reportStatus}
										</div>
										<div>
											<span className="font-medium">
												Data Cutoff:
											</span>{" "}
											{format(tuesday9AM, "PPP p")}
										</div>
										<div>
											<span className="font-medium">
												Generated:
											</span>{" "}
											{format(
												new Date(
													reportData.reportInfo
														.generatedAt,
												),
												"PPP p",
											)}
										</div>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	);
}
