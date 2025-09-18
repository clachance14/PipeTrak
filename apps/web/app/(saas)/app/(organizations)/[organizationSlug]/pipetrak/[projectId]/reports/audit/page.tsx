import { AuditReportContent } from "@pipetrak/reports/components/AuditReportContent";
import { LoadingState } from "@pipetrak/shared/components";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { Suspense } from "react";

interface AuditReportPageProps {
	params: Promise<{
		projectId: string;
	}>;
	searchParams: Promise<{
		entityTypes?: string;
		users?: string;
		actions?: string;
		startDate?: string;
		endDate?: string;
		page?: string;
		limit?: string;
	}>;
}

export default async function AuditReportPage({
	params,
	searchParams,
}: AuditReportPageProps) {
	const { projectId } = await params;
	const filters = await searchParams;

	return (
		<div className="space-y-6">
			<PageHeader
				title="Audit Trail Report"
				subtitle="Complete audit log of system changes and user actions"
			/>

			<Suspense fallback={<LoadingState variant="table" />}>
				<AuditReportContent
					projectId={projectId}
					initialFilters={filters}
				/>
			</Suspense>
		</div>
	);
}
