import { Suspense } from "react";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { LoadingState } from "@pipetrak/shared/components";
import { TrendReportContent } from "@pipetrak/reports/components/TrendReportContent";
export default async function TrendReportPage({ params, searchParams, }) {
    const { projectId } = await params;
    const filters = await searchParams;
    return (<div className="space-y-6">
			<PageHeader title="Trend Analysis Report" subtitle="Historical progress trends and velocity forecasting"/>

			<Suspense fallback={<LoadingState variant="card"/>}>
				<TrendReportContent projectId={projectId} initialFilters={filters}/>
			</Suspense>
		</div>);
}
