import { ImportWizard } from "@pipetrak/import";
import { LoadingState } from "@pipetrak/shared/components";
import { getSession } from "@saas/auth/lib/server";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { redirect } from "next/navigation";
import { Suspense } from "react";

interface ImportPageProps {
	params: Promise<{
		projectId: string;
	}>;
}

export default async function ImportPage({ params }: ImportPageProps) {
	const session = await getSession();
	const { projectId } = await params;

	if (!session) {
		redirect("/auth/login");
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title="Import Components"
				subtitle="Upload Excel or CSV files to bulk import component data"
			/>

			<Suspense fallback={<LoadingState />}>
				<ImportContent projectId={projectId} />
			</Suspense>
		</div>
	);
}

// Server component for data fetching
async function ImportContent({ projectId }: { projectId: string }) {
	return <ImportWizard projectId={projectId} />;
}
