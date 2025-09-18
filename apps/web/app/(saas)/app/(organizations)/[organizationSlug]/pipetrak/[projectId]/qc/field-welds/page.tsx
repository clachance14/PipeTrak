import { FieldWeldTable } from "@pipetrak/qc/components/FieldWeldTable";
import type { Metadata } from "next";

interface FieldWeldsPageProps {
	params: Promise<{
		organizationSlug: string;
		projectId: string;
	}>;
}

export const metadata: Metadata = {
	title: "Field Welds | QC | PipeTrak",
	description: "Manage and track field weld quality control data",
};

export default async function FieldWeldsPage({ params }: FieldWeldsPageProps) {
	const { organizationSlug, projectId } = await params;

	return (
		<div className="space-y-6">
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
			<FieldWeldTable
				projectId={projectId}
				organizationSlug={organizationSlug}
			/>
		</div>
	);
}
