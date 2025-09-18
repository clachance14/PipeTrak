"use client";

import React, { useState, useEffect } from "react";
import { format, addDays, startOfWeek } from "date-fns";
import { Badge } from "@ui/components/badge";
import { AlertTriangle } from "lucide-react";

interface CompactProgressReportProps {
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

export function CompactProgressReport({
	projectId,
	weekEnding,
	groupBy = "area",
	options = {
		showDeltas: true,
		includeZeroProgress: true,
		includeGrandTotal: true,
	},
}: CompactProgressReportProps) {
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

	// Helper functions
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
			<div className="min-h-screen bg-white flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
					<p className="text-lg">Generating report...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-white flex items-center justify-center">
				<div className="text-center text-red-600">
					<AlertTriangle className="w-12 h-12 mx-auto mb-4" />
					<p className="text-lg font-semibold mb-2">Report Generation Failed</p>
					<p>{error}</p>
				</div>
			</div>
		);
	}

	if (!reportData) {
		return null;
	}

	return (
		<>
			{/* Compact Print Styles */}
			<style jsx global>{`
				@media print {
					* {
						-webkit-print-color-adjust: exact !important;
						print-color-adjust: exact !important;
						color-adjust: exact !important;
					}
					
					html {
						font-size: 11px;
					}
					
					body {
						margin: 0 !important;
						padding: 0 !important;
						background: white !important;
						color: black !important;
						font-family: 'Arial', sans-serif !important;
						font-size: 9px !important;
						line-height: 1.2 !important;
					}
					
					@page {
						size: letter landscape;
						margin: 0.25in !important;
					}
					
					.compact-report {
						width: 100% !important;
						max-width: none !important;
						margin: 0 !important;
						padding: 0 !important;
						page-break-inside: avoid !important;
						break-inside: avoid !important;
					}
					
					.compact-header {
						display: flex !important;
						justify-content: space-between !important;
						align-items: center !important;
						margin-bottom: 8px !important;
						padding: 6px 0 !important;
						border-bottom: 2px solid #000 !important;
					}
					
					.compact-title {
						font-size: 16px !important;
						font-weight: bold !important;
						margin: 0 !important;
					}
					
					.compact-subtitle {
						font-size: 10px !important;
						color: #666 !important;
						margin: 0 !important;
					}
					
					.compact-badge {
						font-size: 8px !important;
						font-weight: bold !important;
						padding: 2px 6px !important;
						border: 1px solid #000 !important;
						background: white !important;
						color: black !important;
					}
					
					.compact-summary {
						display: flex !important;
						justify-content: space-around !important;
						margin: 8px 0 !important;
						padding: 6px 0 !important;
						border: 1px solid #ccc !important;
						background: #f8f8f8 !important;
					}
					
					.compact-summary-item {
						text-align: center !important;
					}
					
					.compact-summary-value {
						font-size: 18px !important;
						font-weight: bold !important;
						color: #000 !important;
						display: block !important;
					}
					
					.compact-summary-label {
						font-size: 8px !important;
						color: #666 !important;
					}
					
					.compact-table {
						width: 100% !important;
						border-collapse: collapse !important;
						margin: 8px 0 !important;
						font-size: 8px !important;
					}
					
					.compact-table th {
						background: #e0e0e0 !important;
						color: #000 !important;
						font-weight: bold !important;
						font-size: 8px !important;
						padding: 3px 2px !important;
						border: 1px solid #666 !important;
						text-align: center !important;
					}
					
					.compact-table td {
						padding: 2px !important;
						border: 1px solid #999 !important;
						text-align: center !important;
						font-size: 8px !important;
						background: white !important;
						color: #000 !important;
					}
					
					.compact-table td:first-child {
						text-align: left !important;
						font-weight: 500 !important;
						padding-left: 4px !important;
					}
					
					.compact-footer {
						display: flex !important;
						justify-content: space-between !important;
						margin-top: 8px !important;
						padding-top: 4px !important;
						border-top: 1px solid #999 !important;
						font-size: 7px !important;
						color: #666 !important;
					}
					
					/* Hide interactive elements */
					button, .no-print, svg {
						display: none !important;
					}
				}
				
				@media screen {
					.compact-report {
						max-width: 11in;
						margin: 0 auto;
						padding: 20px;
						background: white;
						min-height: 100vh;
					}
				}
			`}</style>

			<div className="compact-report">
				{/* Compact Header */}
				<div className="compact-header">
					<div>
						<h1 className="compact-title">
							Weekly Progress Summary - {reportData.reportInfo.projectName}
						</h1>
						<div className="compact-subtitle">
							Job #{reportData.reportInfo.jobNumber} • Week Ending {format(weekEndingDate, "MMM d, yyyy")} • {reportData.reportInfo.organization}
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Badge className="compact-badge">
							{isFinal ? "FINAL" : "PRELIMINARY"}
						</Badge>
						<div className="text-xs">
							Generated: {format(new Date(reportData.reportInfo.generatedAt), "M/d/yy h:mm a")}
						</div>
					</div>
				</div>

				{/* Executive Summary Bar */}
				<div className="compact-summary">
					<div className="compact-summary-item">
						<span className="compact-summary-value">
							{Math.round(reportData.summary.overallProgress)}%
						</span>
						<span className="compact-summary-label">Overall Progress</span>
					</div>
					<div className="compact-summary-item">
						<span className="compact-summary-value">
							{reportData.summary.totalComponents.toLocaleString()}
						</span>
						<span className="compact-summary-label">Total Components</span>
					</div>
					<div className="compact-summary-item">
						<span className="compact-summary-value">
							{getGroupColumnName()}
						</span>
						<span className="compact-summary-label">Grouped By</span>
					</div>
					<div className="compact-summary-item">
						<span className="compact-summary-value">
							{format(tuesday9AM, "M/d h:mm a")}
						</span>
						<span className="compact-summary-label">
							{isFinal ? "Data Cutoff" : "Cutoff Time"}
						</span>
					</div>
				</div>

				{/* Progress Table */}
				<table className="compact-table">
					<thead>
						<tr>
							<th style={{ width: "20%" }}>{getGroupColumnName()}</th>
							<th style={{ width: "10%" }}>Budget</th>
							<th style={{ width: "12%" }}>Received</th>
							<th style={{ width: "12%" }}>Installed</th>
							<th style={{ width: "12%" }}>Punched</th>
							<th style={{ width: "12%" }}>Tested</th>
							<th style={{ width: "12%" }}>Restored</th>
							<th style={{ width: "10%" }}>Total</th>
						</tr>
					</thead>
					<tbody>
						{reportData.data.map((row, _index) => {
							const key = getGroupKey(row);
							return (
								<tr key={key}>
									<td>{key}</td>
									<td>{row.component_count}</td>
									<td>{Math.round(row.received_percent)}%</td>
									<td>{Math.round(row.installed_percent)}%</td>
									<td>{Math.round(row.punched_percent)}%</td>
									<td>{Math.round(row.tested_percent)}%</td>
									<td>{Math.round(row.restored_percent)}%</td>
									<td><strong>{Math.round(row.overall_percent)}%</strong></td>
								</tr>
							);
						})}
					</tbody>
				</table>

				{/* Compact Footer */}
				<div className="compact-footer">
					<div>
						PipeTrak Progress Summary Report • Data as of {format(tuesday9AM, "EEEE, MMMM d, yyyy 'at' h:mm a")}
					</div>
					<div>
						{reportData.reportInfo.reportStatus} Report • Page 1 of 1
					</div>
				</div>
			</div>
		</>
	);
}