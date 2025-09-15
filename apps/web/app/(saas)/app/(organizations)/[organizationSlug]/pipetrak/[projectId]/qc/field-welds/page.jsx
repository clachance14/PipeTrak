import { FieldWeldTable } from "@pipetrak/qc/components/FieldWeldTable";
export const metadata = {
    title: "Field Welds | QC | PipeTrak",
    description: "Manage and track field weld quality control data",
};
export default async function FieldWeldsPage({ params }) {
    const { organizationSlug, projectId } = await params;
    return (<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						Field Welds
					</h1>
					<p className="text-muted-foreground">
						Manage field weld data, NDE results, and PWHT tracking
					</p>
				</div>
			</div>

			{/* Field Weld Management Table */}
			<FieldWeldTable projectId={projectId} organizationSlug={organizationSlug}/>
		</div>);
}
