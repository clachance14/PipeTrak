import { PageHeader } from "@saas/shared/components/PageHeader";
import { Suspense } from "react";
import { LoadingState } from "@pipetrak/shared/components";
import { ImportWizard } from "@pipetrak/import";
import { getSession } from "@saas/auth/lib/server";
import { redirect } from "next/navigation";
export default async function ImportPage({ params }) {
    const session = await getSession();
    const { projectId } = await params;
    if (!session) {
        redirect("/auth/login");
    }
    return (<div className="space-y-6">
			<PageHeader title="Import Components" subtitle="Upload Excel or CSV files to bulk import component data"/>

			<Suspense fallback={<LoadingState />}>
				<ImportContent projectId={projectId}/>
			</Suspense>
		</div>);
}
// Server component for data fetching
async function ImportContent({ projectId }) {
    return <ImportWizard projectId={projectId}/>;
}
