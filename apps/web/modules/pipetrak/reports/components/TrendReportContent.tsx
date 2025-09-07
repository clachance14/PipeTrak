"use client";

import { Card, CardContent } from "@ui/components/card";
import { ReportHeader } from "./ReportHeader";

interface TrendReportContentProps {
	projectId: string;
	initialFilters?: Record<string, string>;
}

/**
 * Trend Analysis Report Content Component
 * Shows historical progress trends and velocity forecasting
 */
export function TrendReportContent({
	projectId,
	initialFilters: _initialFilters = {},
}: TrendReportContentProps) {
	return (
		<div className="space-y-6">
			<ReportHeader
				title="Trend Analysis Report"
				description="Historical progress trends and velocity forecasting"
				reportType="Trend Analysis"
				isLoading={false}
			/>

			<Card>
				<CardContent className="flex items-center justify-center py-12">
					<div className="text-center text-muted-foreground">
						<p className="text-lg font-medium">
							Trend Analysis Report
						</p>
						<p>Implementation coming soon</p>
						<p className="text-sm mt-2">Project ID: {projectId}</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
