"use client";

import React, { useState, useEffect } from "react";
import { format, addDays, startOfWeek } from "date-fns";
import { PrintLayout } from "./PrintLayout";
import { Badge } from "@ui/components/badge";
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@ui/lib";

interface PrintableProgressReportProps {
	projectId: string;
	weekEnding?: string;
	groupBy?: "area" | "system" | "testPackage";
	options?: {
		showDeltas?: boolean;
		includeZeroProgress?: boolean;
		includeGrandTotal?: boolean;
	};
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

export function PrintableProgressReport({
	projectId,
	weekEnding,
	groupBy = "area",
	options = {
		showDeltas: true,
		includeZeroProgress: true,
		includeGrandTotal: true,
	},
}: PrintableProgressReportProps) {
	const [reportData, setReportData] = useState<ReportData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Parse weekEnding or default to last Sunday
	const weekEndingDate = weekEnding
		? new Date(weekEnding)
		: (() => {
				const today = new Date();
				const lastSunday = startOfWeek(today, { weekStartsOn: 1 });
				return addDays(lastSunday, -1);
			})();

	// Calculate Tuesday 9 AM cutoff
	const tuesday9AM = new Date(weekEndingDate);
	tuesday9AM.setDate(tuesday9AM.getDate() + 2);
	tuesday9AM.setHours(9, 0, 0, 0);
	const isFinal = new Date() > tuesday9AM;

	// Load report data
	useEffect(() => {
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
							weekEnding: format(weekEndingDate, "yyyy-MM-dd"),
							groupBy,
							options,
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

		generateReport();
	}, [projectId, weekEnding, groupBy]);

	// Auto-trigger print dialog after data loads
	useEffect(() => {
		if (reportData && !isLoading && !error) {
			const timer = setTimeout(() => {
				if (window.confirm("Open print dialog now?")) {
					window.print();
				}
			}, 1000);
			return () => clearTimeout(timer);
		}
	}, [reportData, isLoading, error]);

	// Helper functions
	const formatDelta = (delta: number | undefined): string => {
		if (!delta || delta === 0) return "(0%)";
		const sign = delta > 0 ? "+" : "";
		return `(${sign}${Math.round(delta)}%)`;
	};

	const getGroupKey = (row: ReportData["data"][0]): string => {
		return row.area || row.system || row.test_package || "Unknown";
	};

	const getGroupColumnName = (): string => {
		return groupBy === "testPackage"
			? "Test Package"
			: groupBy === "system"
				? "System"
				: "Area";
	};

	if (isLoading) {
		return (
			<PrintLayout
				title="Progress Summary Report - Loading"
				orientation="landscape"
				includeHeader={false}
				includeFooter={false}
			>
				<div className="flex items-center justify-center min-h-[50vh]">
					<div className="text-center">
						<div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
						<p className="text-lg">Generating report...</p>
					</div>
				</div>
			</PrintLayout>
		);
	}

	if (error) {
		return (
			<PrintLayout
				title="Progress Summary Report - Error"
				orientation="landscape"
				includeHeader={false}
				includeFooter={false}
			>
				<div className="flex items-center justify-center min-h-[50vh]">
					<div className="text-center text-red-600">
						<AlertTriangle className="w-12 h-12 mx-auto mb-4" />
						<p className="text-lg font-semibold mb-2">Report Generation Failed</p>
						<p>{error}</p>
					</div>
				</div>
			</PrintLayout>
		);
	}

	if (!reportData) {
		return null;
	}

	return (
		<PrintLayout
			title={`Progress Summary Report - ${reportData.reportInfo.jobNumber}`}
			orientation="landscape"
			paperSize="letter"
			includeHeader={true}
			includeFooter={true}
			projectInfo={{
				jobNumber: reportData.reportInfo.jobNumber,
				jobName: reportData.reportInfo.projectName,
				organization: reportData.reportInfo.organization,
			}}
		>
			{/* Report Header */}
			<div className="mb-8 print-break-inside-avoid">
				<div className="flex justify-between items-start mb-6">
					<div>
						<h1 className="text-3xl font-bold text-gray-900 mb-2">
							Weekly Progress Summary Report
						</h1>
						<p className="text-lg text-gray-600">
							Week Ending {format(weekEndingDate, "MMMM d, yyyy")}
						</p>
					</div>
					<div className="text-right">
						<Badge
							variant={isFinal ? "default" : "secondary"}
							className="text-base px-4 py-2 mb-2"
						>
							{isFinal ? (
								<>
									<CheckCircle2 className="w-4 h-4 mr-2" />
									FINAL
								</>
							) : (
								<>
									<Clock className="w-4 h-4 mr-2" />
									PRELIMINARY
								</>
							)}
						</Badge>
						<div className="text-sm text-gray-600">
							Generated: {format(new Date(reportData.reportInfo.generatedAt), "MMM d, yyyy h:mm a")}
						</div>
					</div>
				</div>

				{/* Executive Summary */}
				<div className="bg-gray-50 p-6 rounded-lg mb-6">
					<h2 className="text-xl font-semibold mb-4">Executive Summary</h2>
					<div className="grid grid-cols-3 gap-6">
						<div>
							<div className="text-3xl font-bold text-blue-600 mb-1">
								{Math.round(reportData.summary.overallProgress)}%
							</div>
							<div className="text-sm text-gray-600">Overall Progress</div>
						</div>
						<div>
							<div className="text-3xl font-bold text-green-600 mb-1">
								{reportData.summary.totalComponents.toLocaleString()}
							</div>
							<div className="text-sm text-gray-600">Total Components</div>
						</div>
						<div>
							<div className="text-3xl font-bold text-purple-600 mb-1">
								{getGroupColumnName()}
							</div>
							<div className="text-sm text-gray-600">Grouped By</div>
						</div>
					</div>
				</div>

				{/* Status Alert */}
				<div className={cn(
					"p-4 rounded-lg border-l-4 mb-6",
					isFinal
						? "bg-green-50 border-green-400"
						: "bg-yellow-50 border-yellow-400"
				)}>
					<p className={cn(
						"text-sm",
						isFinal ? "text-green-800" : "text-yellow-800"
					)}>
						{isFinal
							? `Data is locked for the week ending ${format(weekEndingDate, "MMM d, yyyy")}. Report marked as FINAL after Tuesday 9:00 AM cutoff.`
							: `Data can still be updated until ${format(tuesday9AM, "EEE MMM d, h:mm a")}. Report will be marked FINAL after cutoff.`}
					</p>
				</div>
			</div>

			{/* Progress Table */}
			<div className="print-break-inside-avoid">
				<h2 className="text-xl font-semibold mb-4">
					Progress by {getGroupColumnName()}
				</h2>
				
				<table className="w-full border-collapse border border-gray-400 text-sm">
					<thead>
						<tr className="bg-gray-200">
							<th className="border border-gray-400 px-3 py-3 text-left font-bold">
								{getGroupColumnName()}
							</th>
							<th className="border border-gray-400 px-3 py-3 text-center font-bold">
								Budget
							</th>
							<th className="border border-gray-400 px-3 py-3 text-center font-bold">
								Received
							</th>
							<th className="border border-gray-400 px-3 py-3 text-center font-bold">
								Installed
							</th>
							<th className="border border-gray-400 px-3 py-3 text-center font-bold">
								Punched
							</th>
							<th className="border border-gray-400 px-3 py-3 text-center font-bold">
								Tested
							</th>
							<th className="border border-gray-400 px-3 py-3 text-center font-bold">
								Restored
							</th>
							<th className="border border-gray-400 px-3 py-3 text-center font-bold">
								Total
							</th>
						</tr>
					</thead>
					<tbody>
						{reportData.data.map((row, index) => {
							const key = getGroupKey(row);
							const delta = reportData.deltas?.[key];

							return (
								<React.Fragment key={key}>
									<tr className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
										<td className="border border-gray-400 px-3 py-2 font-semibold">
											{key}
										</td>
										<td className="border border-gray-400 px-3 py-2 text-center">
											{row.component_count}
										</td>
										<td className="border border-gray-400 px-3 py-2 text-center font-semibold">
											{Math.round(row.received_percent)}%
										</td>
										<td className="border border-gray-400 px-3 py-2 text-center font-semibold">
											{Math.round(row.installed_percent)}%
										</td>
										<td className="border border-gray-400 px-3 py-2 text-center font-semibold">
											{Math.round(row.punched_percent)}%
										</td>
										<td className="border border-gray-400 px-3 py-2 text-center font-semibold">
											{Math.round(row.tested_percent)}%
										</td>
										<td className="border border-gray-400 px-3 py-2 text-center font-semibold">
											{Math.round(row.restored_percent)}%
										</td>
										<td className="border border-gray-400 px-3 py-2 text-center font-semibold">
											{Math.round(row.overall_percent)}%
										</td>
									</tr>
									{options.showDeltas && delta && (
										<tr className="text-xs bg-gray-100">
											<td className="border border-gray-400 px-3 py-1 font-medium text-gray-600">
												Week-over-Week
											</td>
											<td className="border border-gray-400 px-3 py-1" />
											<td className="border border-gray-400 px-3 py-1 text-center">
												<span className={cn(
													delta.received > 0
														? "text-green-700 font-medium"
														: delta.received < 0
															? "text-red-700 font-medium"
															: "text-gray-600"
												)}>
													{formatDelta(delta.received)}
												</span>
											</td>
											<td className="border border-gray-400 px-3 py-1 text-center">
												<span className={cn(
													delta.installed > 0
														? "text-green-700 font-medium"
														: delta.installed < 0
															? "text-red-700 font-medium"
															: "text-gray-600"
												)}>
													{formatDelta(delta.installed)}
												</span>
											</td>
											<td className="border border-gray-400 px-3 py-1 text-center">
												<span className={cn(
													delta.punched > 0
														? "text-green-700 font-medium"
														: delta.punched < 0
															? "text-red-700 font-medium"
															: "text-gray-600"
												)}>
													{formatDelta(delta.punched)}
												</span>
											</td>
											<td className="border border-gray-400 px-3 py-1 text-center">
												<span className={cn(
													delta.tested > 0
														? "text-green-700 font-medium"
														: delta.tested < 0
															? "text-red-700 font-medium"
															: "text-gray-600"
												)}>
													{formatDelta(delta.tested)}
												</span>
											</td>
											<td className="border border-gray-400 px-3 py-1 text-center">
												<span className={cn(
													delta.restored > 0
														? "text-green-700 font-medium"
														: delta.restored < 0
															? "text-red-700 font-medium"
															: "text-gray-600"
												)}>
													{formatDelta(delta.restored)}
												</span>
											</td>
											<td className="border border-gray-400 px-3 py-1 text-center">
												<span className={cn(
													delta.overall > 0
														? "text-green-700 font-medium"
														: delta.overall < 0
															? "text-red-700 font-medium"
															: "text-gray-600"
												)}>
													{formatDelta(delta.overall)}
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

			{/* Report Notes */}
			<div className="mt-8 print-break-inside-avoid">
				<h3 className="text-lg font-semibold mb-3">Report Notes</h3>
				<div className="text-sm text-gray-700 space-y-2">
					<p>
						• This report reflects component progress as of the Tuesday 9:00 AM cutoff for the specified week.
					</p>
					<p>
						• Percentages are rounded to the nearest whole number for clarity.
					</p>
					{options.showDeltas && (
						<p>
							• Week-over-week changes are shown in parentheses below each percentage.
						</p>
					)}
					<p>
						• Components are grouped by {getGroupColumnName().toLowerCase()} for this report view.
					</p>
				</div>
			</div>

			{/* Report Metadata */}
			<div className="mt-8 pt-6 border-t border-gray-300 print-break-inside-avoid">
				<div className="grid grid-cols-2 gap-8 text-sm">
					<div>
						<h4 className="font-semibold mb-2">Project Information</h4>
						<div className="space-y-1">
							<div><span className="font-medium">Project:</span> {reportData.reportInfo.projectName}</div>
							<div><span className="font-medium">Job Number:</span> {reportData.reportInfo.jobNumber}</div>
							<div><span className="font-medium">Organization:</span> {reportData.reportInfo.organization}</div>
						</div>
					</div>
					<div>
						<h4 className="font-semibold mb-2">Report Configuration</h4>
						<div className="space-y-1">
							<div><span className="font-medium">Week Ending:</span> {format(weekEndingDate, "PPP")}</div>
							<div><span className="font-medium">Grouped By:</span> {getGroupColumnName()}</div>
							<div><span className="font-medium">Status:</span> {reportData.reportInfo.reportStatus}</div>
							<div><span className="font-medium">Generated:</span> {format(new Date(reportData.reportInfo.generatedAt), "PPP p")}</div>
						</div>
					</div>
				</div>
			</div>
		</PrintLayout>
	);
}