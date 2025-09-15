import { Suspense } from "react";
import { getSession } from "@saas/auth/lib/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { LoadingState } from "@pipetrak/shared/components";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Upload, FileSpreadsheet, AlertTriangle } from "lucide-react";
import { FieldWeldUploadWrapper } from "../../../../../../../../../modules/pipetrak/qc/import/FieldWeldUploadWrapper";
export const metadata = {
    title: "Field Weld Import | PipeTrak",
    description: "Import field weld data from Excel files for quality control tracking",
};
export default async function QCImportPage({ params }) {
    const { organizationSlug, projectId } = await params;
    return (<div className="space-y-6">
			<PageHeader title="Field Weld Import" subtitle="Import field weld data from Excel files for quality control tracking"/>

			<Suspense fallback={<LoadingState variant="table"/>}>
				<QCImportContent projectId={projectId} organizationSlug={organizationSlug}/>
			</Suspense>
		</div>);
}
// Server component for authentication check
async function QCImportContent({ projectId, organizationSlug, }) {
    // Check authentication
    const session = await getSession();
    if (!session) {
        redirect("/login");
    }
    return (<div className="max-w-4xl mx-auto space-y-6">
			{/* Navigation Breadcrumbs */}
			<nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
				<a href={`/app/${organizationSlug}/pipetrak/${projectId}`} className="hover:text-foreground transition-colors">
					Project
				</a>
				<span>/</span>
				<a href={`/app/${organizationSlug}/pipetrak/${projectId}/qc`} className="hover:text-foreground transition-colors">
					QC
				</a>
				<span>/</span>
				<span className="text-foreground font-medium">Import</span>
			</nav>

			{/* Import Type Tabs */}
			<Tabs defaultValue="field-welds" className="w-full">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="field-welds" className="flex items-center gap-2">
						<FileSpreadsheet className="h-4 w-4"/>
						Field Welds
					</TabsTrigger>
					<TabsTrigger value="other-qc" disabled className="flex items-center gap-2 opacity-50">
						<Upload className="h-4 w-4"/>
						Other QC Data
						<span className="text-xs bg-muted px-1.5 py-0.5 rounded">
							Coming Soon
						</span>
					</TabsTrigger>
				</TabsList>

				{/* Field Welds Import Tab */}
				<TabsContent value="field-welds" className="mt-6">
					<div className="space-y-6">
						{/* Import Instructions */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<AlertTriangle className="h-5 w-5 text-amber-500"/>
									Before You Begin
								</CardTitle>
								<CardDescription>
									Important information about field weld data
									import
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div className="space-y-2">
											<h4 className="font-semibold text-sm">
												Required Columns:
											</h4>
											<ul className="text-sm text-muted-foreground space-y-1">
												<li>
													• Weld ID Number (Column A)
												</li>
												<li>
													• Drawing/Isometric Number
													(Column D)
												</li>
											</ul>
										</div>
										<div className="space-y-2">
											<h4 className="font-semibold text-sm">
												Optional Columns:
											</h4>
											<ul className="text-sm text-muted-foreground space-y-1">
												<li>
													• Welder Stencil (Column B)
												</li>
												<li>
													• Test Package (Column F)
												</li>
												<li>• SPEC Code (Column J)</li>
												<li>• X-Ray % (Column K)</li>
												<li>• Weld Size (Column L)</li>
												<li>• Schedule (Column M)</li>
												<li>
													• PWHT Required (Column S)
												</li>
												<li>• Comments (Column AA)</li>
											</ul>
										</div>
									</div>

									<div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
										<div className="flex items-start gap-2">
											<AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0"/>
											<div className="text-sm">
												<p className="font-medium text-amber-800">
													Data Validation
												</p>
												<p className="text-amber-700 mt-1">
													Field weld data will be
													validated against existing
													drawings in your project.
													Ensure drawing numbers exist
													in your drawings database,
													or they will be
													auto-created.
												</p>
											</div>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* File Upload Placeholder */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Upload className="h-5 w-5"/>
									Upload Field Weld Data
								</CardTitle>
								<CardDescription>
									Select an Excel file containing field weld
									information
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{/* Field Weld Upload Component */}
									<FieldWeldUploadWrapper projectId={projectId} organizationSlug={organizationSlug}/>

									{/* Template Download */}
									<div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
										<div className="flex items-center gap-3">
											<FileSpreadsheet className="h-5 w-5 text-muted-foreground"/>
											<div>
												<div className="font-medium">
													Field Weld Import Template
												</div>
												<div className="text-sm text-muted-foreground">
													Download the Excel template
													with required columns
												</div>
											</div>
										</div>
										<Button variant="outline" disabled>
											Download Template
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Quick Actions */}
						<Card>
							<CardHeader>
								<CardTitle>Alternative Options</CardTitle>
								<CardDescription>
									Other ways to manage field weld data
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="p-4 border rounded-lg space-y-2">
										<h4 className="font-semibold">
											Manual Entry
										</h4>
										<p className="text-sm text-muted-foreground">
											Add field welds one by one through
											the field welds interface
										</p>
										<Button asChild variant="outline" className="w-full mt-2">
											<a href={`/app/${organizationSlug}/pipetrak/${projectId}/qc/field-welds`}>
												Go to Field Welds
											</a>
										</Button>
									</div>
									<div className="p-4 border rounded-lg space-y-2">
										<h4 className="font-semibold">
											Welder Management
										</h4>
										<p className="text-sm text-muted-foreground">
											Manage welder information and
											qualifications first
										</p>
										<Button asChild variant="outline" className="w-full mt-2">
											<a href={`/app/${organizationSlug}/pipetrak/${projectId}/qc/welders`}>
												Manage Welders
											</a>
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				{/* Other QC Data Tab (Placeholder) */}
				<TabsContent value="other-qc" className="mt-6">
					<Card>
						<CardContent className="pt-6">
							<div className="text-center py-12">
								<Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4"/>
								<h3 className="text-lg font-semibold mb-2">
									Other QC Data Import
								</h3>
								<p className="text-muted-foreground max-w-md mx-auto">
									Support for importing other quality control
									data types (NDE results, PWHT records, etc.)
									will be added in future releases.
								</p>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>);
}
