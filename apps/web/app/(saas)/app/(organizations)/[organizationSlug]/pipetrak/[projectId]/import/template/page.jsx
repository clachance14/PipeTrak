import { PageHeader } from "@saas/shared/components/PageHeader";
import { TemplateDownload } from "@pipetrak/import/TemplateDownload";
export default async function TemplatePage({ params }) {
    const { projectId } = await params;
    return (<div className="space-y-6">
			<PageHeader title="Import Templates" subtitle="Download templates to prepare your data for import"/>

			<TemplateDownload projectId={projectId}/>
		</div>);
}
