import { TrendReportContent } from "@pipetrak/reports/components/TrendReportContent";
import { LoadingState } from "@pipetrak/shared/components";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { Suspense } from "react";

interface TrendReportPageProps {
	params: Promise<{
		projectId: string;
	}>;
	searchParams: Promise<{
		days?: string;
		granularity?: string;
		includeForecasting?: string;
		includeVelocity?: string;
		includeMilestones?: string;
	}>;
}

export default async function TrendReportPage({
	params,
	searchParams,
}: TrendReportPageProps) {
	const { projectId } = await params;
	const filters = await searchParams;

	return (
		<div className="space-y-6">
			<PageHeader
				title="Trend Analysis Report"
				subtitle="Historical progress trends and velocity forecasting"
			/>

			<Suspense fallback={<LoadingState variant="card" />}>
				<TrendReportContent
					projectId={projectId}
					initialFilters={filters}
				/>
			</Suspense>
		</div>
	);
}
