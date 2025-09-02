import { PageHeader } from "@saas/shared/components/PageHeader";
import { TemplateDownload } from "@pipetrak/import/TemplateDownload";

interface TemplatePageProps {
	params: Promise<{
		projectId: string;
	}>;
}

export default async function TemplatePage({ params }: TemplatePageProps) {
	const { projectId } = await params;

	return (
		<div className="space-y-6">
			<PageHeader
				title="Import Templates"
				subtitle="Download templates to prepare your data for import"
			/>

			<TemplateDownload projectId={projectId} />
		</div>
	);
}
