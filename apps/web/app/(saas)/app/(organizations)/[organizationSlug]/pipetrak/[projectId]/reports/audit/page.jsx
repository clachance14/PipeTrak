import { Suspense } from "react";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { LoadingState } from "@pipetrak/shared/components";
import { AuditReportContent } from "@pipetrak/reports/components/AuditReportContent";
export default async function AuditReportPage({ params, searchParams, }) {
    const { projectId } = await params;
    const filters = await searchParams;
    return (<div className="space-y-6">
			<PageHeader title="Audit Trail Report" subtitle="Complete audit log of system changes and user actions"/>

			<Suspense fallback={<LoadingState variant="table"/>}>
				<AuditReportContent projectId={projectId} initialFilters={filters}/>
			</Suspense>
		</div>);
}
