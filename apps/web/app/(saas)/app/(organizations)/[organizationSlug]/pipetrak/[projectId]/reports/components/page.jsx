import { Suspense } from "react";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { LoadingState } from "@pipetrak/shared/components";
import { ComponentReportContent } from "@pipetrak/reports/components/ComponentReportContent";
export default async function ComponentReportPage({ params, searchParams, }) {
    const { projectId } = await params;
    const filters = await searchParams;
    return (<div className="space-y-6">
			<PageHeader title="Detailed Component Report" subtitle="Component-level progress analysis with advanced filtering"/>

			<Suspense fallback={<LoadingState variant="table"/>}>
				<ComponentReportContent projectId={projectId} initialFilters={filters}/>
			</Suspense>
		</div>);
}
