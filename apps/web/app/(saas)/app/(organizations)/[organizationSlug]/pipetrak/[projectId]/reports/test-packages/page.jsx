import { Suspense } from "react";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { LoadingState } from "@pipetrak/shared/components";
import { TestPackageReportContent } from "@pipetrak/reports/components/TestPackageReportContent";
export default async function TestPackageReportPage({ params, searchParams, }) {
    const { projectId } = await params;
    const filters = await searchParams;
    return (<div className="space-y-6">
			<PageHeader title="Test Package Readiness Report" subtitle="Test package completion status and readiness forecasting"/>

			<Suspense fallback={<LoadingState variant="card"/>}>
				<TestPackageReportContent projectId={projectId} initialFilters={filters}/>
			</Suspense>
		</div>);
}
