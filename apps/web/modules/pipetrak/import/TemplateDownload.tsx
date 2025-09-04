"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { Alert, AlertDescription } from "@ui/components/alert";
import {
	FileSpreadsheet,
	Download,
	Check,
	Info,
	FileText,
	Table,
	List,
	AlertCircle,
	Zap,
} from "lucide-react";
import {
	generateImportTemplate,
	generateFieldWeldTemplate,
	generateCSVTemplate,
	downloadFile,
} from "../utils/templateGenerator";

interface TemplateDownloadProps {
	projectId: string;
}

export function TemplateDownload({ projectId }: TemplateDownloadProps) {
	const handleExcelDownload = () => {
		const blob = generateImportTemplate();
		const filename = `PipeTrak_Import_Template_${new Date().toISOString().split("T")[0]}.xlsx`;
		downloadFile(blob, filename);
	};

	const handleCSVDownload = () => {
		const csv = generateCSVTemplate();
		const filename = `PipeTrak_Import_Template_${new Date().toISOString().split("T")[0]}.csv`;
		downloadFile(csv, filename);
	};

	const handleFieldWeldDownload = () => {
		const blob = generateFieldWeldTemplate();
		const filename = `PipeTrak_FieldWeld_Template_${new Date().toISOString().split("T")[0]}.xlsx`;
		downloadFile(blob, filename);
	};

	return (
		<div className="space-y-6">
			{/* Quick Download Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				<Card className="relative overflow-hidden">
					<div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full -mr-16 -mt-16 opacity-20" />
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FileSpreadsheet className="h-5 w-5 text-green-600" />
							Excel Template
						</CardTitle>
						<CardDescription>
							Full-featured template with multiple sheets,
							instructions, and sample data
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex flex-wrap gap-2">
								<Badge status="info">3 Sheets</Badge>
								<Badge status="info">5 Sample Rows</Badge>
								<Badge status="info">
									Instructions Included
								</Badge>
							</div>
							<Button
								onClick={handleExcelDownload}
								className="w-full"
							>
								<Download className="h-4 w-4 mr-2" />
								Download Excel Template
							</Button>
							<p className="text-xs text-muted-foreground">
								Recommended for most users • .xlsx format
							</p>
						</div>
					</CardContent>
				</Card>

				<Card className="relative overflow-hidden">
					<div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full -mr-16 -mt-16 opacity-20" />
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FileText className="h-5 w-5 text-blue-600" />
							CSV Template
						</CardTitle>
						<CardDescription>
							Simple comma-separated format compatible with all
							spreadsheet applications
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex flex-wrap gap-2">
								<Badge status="info">Universal Format</Badge>
								<Badge status="info">1 Sample Row</Badge>
								<Badge status="info">Lightweight</Badge>
							</div>
							<Button
								variant="outline"
								onClick={handleCSVDownload}
								className="w-full"
							>
								<Download className="h-4 w-4 mr-2" />
								Download CSV Template
							</Button>
							<p className="text-xs text-muted-foreground">
								For simple imports • .csv format
							</p>
						</div>
					</CardContent>
				</Card>

				<Card className="relative overflow-hidden">
					<div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-full -mr-16 -mt-16 opacity-20" />
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FileSpreadsheet className="h-5 w-5 text-orange-600" />
							Field Weld Template
						</CardTitle>
						<CardDescription>
							Specialized template for field weld imports with QC
							data tracking
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex flex-wrap gap-2">
								<Badge status="info">QC Fields</Badge>
								<Badge status="info">3 Sample Welds</Badge>
								<Badge status="info">NDE & PWHT</Badge>
							</div>
							<Button
								onClick={handleFieldWeldDownload}
								className="w-full bg-orange-600 hover:bg-orange-700"
							>
								<Download className="h-4 w-4 mr-2" />
								Download Field Weld Template
							</Button>
							<p className="text-xs text-muted-foreground">
								For field weld QC tracking • .xlsx format
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Detailed Information */}
			<Card>
				<CardHeader>
					<CardTitle>Template Information</CardTitle>
					<CardDescription>
						Everything you need to know about preparing your import
						data
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Tabs defaultValue="fields" className="w-full">
						<TabsList className="grid w-full grid-cols-3">
							<TabsTrigger value="fields">
								Field Descriptions
							</TabsTrigger>
							<TabsTrigger value="requirements">
								Requirements
							</TabsTrigger>
							<TabsTrigger value="tips">
								Best Practices
							</TabsTrigger>
						</TabsList>

						<TabsContent value="fields" className="space-y-4">
							<div className="grid gap-3">
								<h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
									Required Fields
								</h4>
								<div className="space-y-2">
									<div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
										<Check className="h-4 w-4 text-green-600 mt-0.5" />
										<div className="flex-1">
											<p className="font-medium">
												Component ID
											</p>
											<p className="text-sm text-muted-foreground">
												Unique identifier for each
												component (e.g., VALVE-001,
												PIPE-123)
											</p>
										</div>
									</div>
									<div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
										<Check className="h-4 w-4 text-green-600 mt-0.5" />
										<div className="flex-1">
											<p className="font-medium">
												Drawing ID
											</p>
											<p className="text-sm text-muted-foreground">
												Reference to the drawing where
												the component appears (e.g.,
												P-35F11)
											</p>
										</div>
									</div>
								</div>

								<h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider mt-4">
									Optional Fields
								</h4>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
									{[
										{
											name: "Description",
											desc: "Detailed component description",
										},
										{
											name: "Area",
											desc: "Plant area or unit location",
										},
										{
											name: "System",
											desc: "System assignment",
										},
										{
											name: "Test Package",
											desc: "Test package reference",
										},
										{
											name: "Material",
											desc: "Material specification",
										},
										{
											name: "Size",
											desc: "Component dimensions",
										},
										{
											name: "Specification",
											desc: "Technical specs",
										},
										{
											name: "Line Number",
											desc: "Line/circuit number",
										},
										{
											name: "Heat Number",
											desc: "Material traceability",
										},
										{
											name: "P&ID",
											desc: "P&ID diagram reference",
										},
										{
											name: "Service",
											desc: "Service/fluid type",
										},
										{
											name: "Insulation",
											desc: "Insulation requirements",
										},
										{
											name: "NDE",
											desc: "Non-destructive examination",
										},
										{
											name: "Paint/Coating",
											desc: "Surface treatment",
										},
										{
											name: "ROC Priority",
											desc: "Completion priority",
										},
										{
											name: "ROC Class",
											desc: "Progress classification",
										},
										{
											name: "MTO Status",
											desc: "Material status",
										},
										{
											name: "Site Location",
											desc: "Physical location",
										},
										{
											name: "Comments",
											desc: "Additional notes",
										},
									].map((field) => (
										<div
											key={field.name}
											className="flex items-start gap-2 p-2"
										>
											<List className="h-3 w-3 text-muted-foreground mt-0.5" />
											<div className="flex-1">
												<p className="text-sm font-medium">
													{field.name}
												</p>
												<p className="text-xs text-muted-foreground">
													{field.desc}
												</p>
											</div>
										</div>
									))}
								</div>

								<h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider mt-4 flex items-center gap-2">
									<Zap className="h-3 w-3 text-orange-500" />
									Field Weld QC Fields
								</h4>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
									{[
										{
											name: "Weld Size",
											desc: 'Weld diameter (e.g., 6", 4")',
										},
										{
											name: "Schedule",
											desc: "Pipe schedule (e.g., Sch 40, XS)",
										},
										{
											name: "Weld Type Code",
											desc: "BW, SW, TW, etc.",
										},
										{
											name: "Base Metal",
											desc: "Material being welded",
										},
										{
											name: "X-ray Percent",
											desc: "RT percentage (0-100)",
										},
										{
											name: "PWHT Required",
											desc: "TRUE/FALSE for heat treatment",
										},
										{
											name: "NDE Types",
											desc: "RT,PT,MT,UT,VT (comma-separated)",
										},
										{
											name: "Welder Stencil",
											desc: "Welder identification",
										},
										{
											name: "Date Welded",
											desc: "YYYY-MM-DD format",
										},
										{
											name: "Tie-In Number",
											desc: "Connection reference",
										},
									].map((field) => (
										<div
											key={field.name}
											className="flex items-start gap-2 p-2"
										>
											<Zap className="h-3 w-3 text-orange-500 mt-0.5" />
											<div className="flex-1">
												<p className="text-sm font-medium">
													{field.name}
												</p>
												<p className="text-xs text-muted-foreground">
													{field.desc}
												</p>
											</div>
										</div>
									))}
								</div>
							</div>
						</TabsContent>

						<TabsContent value="requirements" className="space-y-4">
							<Alert>
								<Info className="h-4 w-4" />
								<AlertDescription>
									Follow these requirements to ensure
									successful import
								</AlertDescription>
							</Alert>

							<div className="space-y-3">
								<div className="flex items-start gap-3">
									<div className="p-1 bg-primary/10 rounded">
										<Table className="h-4 w-4 text-primary" />
									</div>
									<div>
										<p className="font-medium">
											File Format
										</p>
										<p className="text-sm text-muted-foreground">
											Excel (.xlsx, .xls) or CSV (.csv)
											format only
										</p>
									</div>
								</div>

								<div className="flex items-start gap-3">
									<div className="p-1 bg-primary/10 rounded">
										<FileSpreadsheet className="h-4 w-4 text-primary" />
									</div>
									<div>
										<p className="font-medium">File Size</p>
										<p className="text-sm text-muted-foreground">
											Maximum 50MB file size
											(approximately 100,000 rows)
										</p>
									</div>
								</div>

								<div className="flex items-start gap-3">
									<div className="p-1 bg-primary/10 rounded">
										<Check className="h-4 w-4 text-primary" />
									</div>
									<div>
										<p className="font-medium">
											Data Quality
										</p>
										<p className="text-sm text-muted-foreground">
											Component IDs must be unique within
											the project
										</p>
									</div>
								</div>

								<div className="flex items-start gap-3">
									<div className="p-1 bg-primary/10 rounded">
										<AlertCircle className="h-4 w-4 text-primary" />
									</div>
									<div>
										<p className="font-medium">
											Header Row
										</p>
										<p className="text-sm text-muted-foreground">
											First row must contain column
											headers (don't modify template
											headers)
										</p>
									</div>
								</div>
							</div>
						</TabsContent>

						<TabsContent value="tips" className="space-y-4">
							<div className="space-y-3">
								<Card className="p-4 bg-green-50 border-green-200">
									<h4 className="font-medium mb-2 flex items-center gap-2">
										<Check className="h-4 w-4 text-green-600" />
										Do's
									</h4>
									<ul className="space-y-1 text-sm">
										<li>
											• Use consistent naming conventions
											for areas and systems
										</li>
										<li>
											• Keep component IDs unique and
											meaningful
										</li>
										<li>
											• Fill in as many optional fields as
											possible
										</li>
										<li>
											• Validate your data before
											importing
										</li>
										<li>
											• Start with a small test import
											first
										</li>
										<li>
											• Use the provided template as a
											starting point
										</li>
										<li>
											• For field welds: Use unique weld
											IDs with project prefixes (e.g.,
											"FW-001-2024")
										</li>
										<li>
											• Format dates as YYYY-MM-DD for
											consistent parsing
										</li>
										<li>
											• Use comma-separated values for
											multiple NDE types (e.g.,
											"RT,PT,VT")
										</li>
										<li>
											• Verify PWHT requirements match
											your material/size specifications
										</li>
									</ul>
								</Card>

								<Card className="p-4 bg-red-50 border-red-200">
									<h4 className="font-medium mb-2 flex items-center gap-2">
										<AlertCircle className="h-4 w-4 text-red-600" />
										Don'ts
									</h4>
									<ul className="space-y-1 text-sm">
										<li>
											• Don't modify the header row in the
											template
										</li>
										<li>
											• Don't use special characters in
											component IDs
										</li>
										<li>
											• Don't leave required fields empty
										</li>
										<li>
											• Don't exceed 100,000 rows in a
											single import
										</li>
										<li>
											• Don't mix different component
											types randomly
										</li>
										<li>
											• Don't import without reviewing
											validation results
										</li>
										<li>
											• For field welds: Don't use
											duplicate weld IDs within the same
											project
										</li>
										<li>
											• Don't enter X-ray percentages
											outside 0-100 range
										</li>
										<li>
											• Don't use invalid date formats
											(use YYYY-MM-DD only)
										</li>
										<li>
											• Don't mark PWHT as required for
											materials that don't need it
										</li>
									</ul>
								</Card>

								<Alert>
									<Info className="h-4 w-4" />
									<AlertDescription>
										<strong>Pro Tip:</strong> The import
										wizard will help map your columns even
										if they don't match exactly. It uses
										smart detection to identify common field
										names automatically.
									</AlertDescription>
								</Alert>
							</div>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>

			{/* Sample Data Preview */}
			<Card>
				<CardHeader>
					<CardTitle>Sample Data Format</CardTitle>
					<CardDescription>
						Example of how your data should be structured
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b">
									<th className="text-left p-2 font-medium">
										Component ID
									</th>
									<th className="text-left p-2 font-medium">
										Drawing ID
									</th>
									<th className="text-left p-2 font-medium">
										Description
									</th>
									<th className="text-left p-2 font-medium">
										Area
									</th>
									<th className="text-left p-2 font-medium">
										System
									</th>
								</tr>
							</thead>
							<tbody>
								<tr className="border-b">
									<td className="p-2 font-mono">VALVE-001</td>
									<td className="p-2 font-mono">P-35F11</td>
									<td className="p-2">Gate Valve 6" CS</td>
									<td className="p-2">Unit 1</td>
									<td className="p-2">Cooling Water</td>
								</tr>
								<tr className="border-b">
									<td className="p-2 font-mono">PIPE-001</td>
									<td className="p-2 font-mono">P-35F12</td>
									<td className="p-2">Pipe Spool 10"</td>
									<td className="p-2">Unit 2</td>
									<td className="p-2">Feed Water</td>
								</tr>
								<tr>
									<td className="p-2 font-mono">
										GASKET-001
									</td>
									<td className="p-2 font-mono">P-35F13</td>
									<td className="p-2">Spiral Wound 8"</td>
									<td className="p-2">Unit 1</td>
									<td className="p-2">Process Steam</td>
								</tr>
							</tbody>
						</table>
					</div>
					<p className="text-xs text-muted-foreground mt-4">
						Showing first 5 columns only. Download template for all
						fields.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
