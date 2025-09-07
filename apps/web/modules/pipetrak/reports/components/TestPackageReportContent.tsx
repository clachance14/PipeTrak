"use client";

import { Card, CardContent } from "@ui/components/card";
import { ReportHeader } from "./ReportHeader";

interface TestPackageReportContentProps {
	projectId: string;
	initialFilters?: Record<string, string>;
}

/**
 * Test Package Readiness Report Content Component
 * Shows test package completion status and readiness forecasting
 */
export function TestPackageReportContent({
	projectId,
	initialFilters: _initialFilters = {},
}: TestPackageReportContentProps) {
	return (
		<div className="space-y-6">
			<ReportHeader
				title="Test Package Readiness Report"
				description="Test package completion status and readiness forecasting"
				reportType="Test Package Readiness"
				isLoading={false}
			/>

			<Card>
				<CardContent className="flex items-center justify-center py-12">
					<div className="text-center text-muted-foreground">
						<p className="text-lg font-medium">
							Test Package Report
						</p>
						<p>Implementation coming soon</p>
						<p className="text-sm mt-2">Project ID: {projectId}</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
