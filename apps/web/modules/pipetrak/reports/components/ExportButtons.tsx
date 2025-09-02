"use client";

import { useState } from "react";
import { Button } from "@ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@ui/components/dialog";
import { Label } from "@ui/components/label";
import { Checkbox } from "@ui/components/checkbox";
import { Input } from "@ui/components/input";
import { Textarea } from "@ui/components/textarea";
import { useToast } from "@ui/hooks/use-toast";
import {
	Download,
	FileSpreadsheet,
	FileText,
	FileImage,
	Printer,
	Mail,
	Loader2,
	Settings,
} from "lucide-react";
import type { ExportFormat, PrintOptions } from "../types";

interface ExportButtonsProps {
	reportType: string;
	projectId: string;
	data?: any;
	filters?: any;
	disabled?: boolean;
	className?: string;
}

/**
 * Export and print controls for reports
 * Supports Excel, PDF, CSV exports and print functionality
 */
export function ExportButtons({
	reportType,
	projectId,
	data,
	filters,
	disabled = false,
	className,
}: ExportButtonsProps) {
	const [isExporting, setIsExporting] = useState(false);
	const [showExportDialog, setShowExportDialog] = useState(false);
	const [showPrintDialog, setShowPrintDialog] = useState(false);
	const [showEmailDialog, setShowEmailDialog] = useState(false);
	const [exportOptions, setExportOptions] = useState<ExportFormat>({
		type: "excel",
		includeCharts: true,
		includeRawData: true,
	});
	const [printOptions, setPrintOptions] = useState<PrintOptions>({
		orientation: "landscape",
		paperSize: "a4",
		includeCharts: true,
		includeHeader: true,
		includeFooter: true,
	});
	const [emailOptions, setEmailOptions] = useState({
		recipients: "",
		subject: `${reportType} Report - ${new Date().toLocaleDateString()}`,
		message: "",
	});

	const { toast } = useToast();

	const handleQuickExport = async (format: "excel" | "pdf" | "csv") => {
		setIsExporting(true);

		try {
			// Generate filename
			const timestamp = new Date().toISOString().split("T")[0];
			const filename = `${reportType}-report-${timestamp}.${format}`;

			// Simulate API call - replace with actual export API
			await new Promise((resolve) => setTimeout(resolve, 2000));

			toast({
				title: "Export completed",
				description: `Report exported as ${filename}`,
			});

			// In real implementation, trigger download here
			// window.location.href = `/api/exports/${exportId}`;
		} catch (error) {
			toast({
				title: "Export failed",
				description: "Failed to export report. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsExporting(false);
		}
	};

	const handleCustomExport = async () => {
		setIsExporting(true);
		setShowExportDialog(false);

		try {
			const timestamp = new Date().toISOString().split("T")[0];
			const filename =
				exportOptions.filename ||
				`${reportType}-report-${timestamp}.${exportOptions.type}`;

			// Simulate API call with custom options
			await new Promise((resolve) => setTimeout(resolve, 2000));

			toast({
				title: "Custom export completed",
				description: `Report exported as ${filename}`,
			});
		} catch (error) {
			toast({
				title: "Export failed",
				description: "Failed to export report. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsExporting(false);
		}
	};

	const handlePrint = () => {
		setShowPrintDialog(false);

		// Configure print styles based on options
		const printCSS = `
      @media print {
        body { 
          font-size: 12px;
          color: black !important;
        }
        .no-print { display: none !important; }
        .print-landscape { 
          @page { size: ${printOptions.paperSize} ${printOptions.orientation}; }
        }
      }
    `;

		// Add print styles
		const styleSheet = document.createElement("style");
		styleSheet.textContent = printCSS;
		document.head.appendChild(styleSheet);

		// Print the page
		window.print();

		// Clean up
		document.head.removeChild(styleSheet);

		toast({
			title: "Print dialog opened",
			description:
				"Use your browser's print dialog to complete printing.",
		});
	};

	const handleEmailReport = async () => {
		setIsExporting(true);
		setShowEmailDialog(false);

		try {
			// Simulate email API call
			await new Promise((resolve) => setTimeout(resolve, 2000));

			toast({
				title: "Report emailed",
				description: `Report sent to ${emailOptions.recipients}`,
			});
		} catch (error) {
			toast({
				title: "Email failed",
				description:
					"Failed to send report via email. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<div className={className}>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						status="info"
						disabled={disabled || isExporting}
						className="min-w-[120px]"
					>
						{isExporting ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Exporting...
							</>
						) : (
							<>
								<Download className="mr-2 h-4 w-4" />
								Export
							</>
						)}
					</Button>
				</DropdownMenuTrigger>

				<DropdownMenuContent align="end" className="w-56">
					<DropdownMenuLabel>Quick Export</DropdownMenuLabel>
					<DropdownMenuItem
						onClick={() => handleQuickExport("excel")}
					>
						<FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
						Excel (.xlsx)
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => handleQuickExport("pdf")}>
						<FileText className="mr-2 h-4 w-4 text-red-600" />
						PDF Document
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => handleQuickExport("csv")}>
						<FileImage className="mr-2 h-4 w-4 text-blue-600" />
						CSV Data
					</DropdownMenuItem>

					<DropdownMenuSeparator />
					<DropdownMenuLabel>Actions</DropdownMenuLabel>

					<Dialog
						open={showExportDialog}
						onOpenChange={setShowExportDialog}
					>
						<DialogTrigger asChild>
							<DropdownMenuItem
								onSelect={(e) => e.preventDefault()}
							>
								<Settings className="mr-2 h-4 w-4" />
								Custom Export...
							</DropdownMenuItem>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Custom Export Options</DialogTitle>
								<DialogDescription>
									Configure your export with custom settings
								</DialogDescription>
							</DialogHeader>

							<div className="space-y-4">
								<div>
									<Label>Export Format</Label>
									<div className="flex gap-2 mt-2">
										{["excel", "pdf", "csv"].map(
											(format) => (
												<Button
													key={format}
													variant={
														exportOptions.type ===
														format
															? "default"
															: "outline"
													}
													size="sm"
													onClick={() =>
														setExportOptions(
															(prev) => ({
																...prev,
																type: format as ExportFormat["type"],
															}),
														)
													}
												>
													{format.toUpperCase()}
												</Button>
											),
										)}
									</div>
								</div>

								<div>
									<Label htmlFor="filename">
										Custom Filename (optional)
									</Label>
									<Input
										id="filename"
										placeholder="Leave empty for auto-generated name"
										value={exportOptions.filename || ""}
										onChange={(e) =>
											setExportOptions((prev) => ({
												...prev,
												filename: e.target.value,
											}))
										}
									/>
								</div>

								<div className="space-y-2">
									<div className="flex items-center space-x-2">
										<Checkbox
											id="includeCharts"
											checked={
												exportOptions.includeCharts
											}
											onCheckedChange={(checked) =>
												setExportOptions((prev) => ({
													...prev,
													includeCharts:
														checked as boolean,
												}))
											}
										/>
										<Label htmlFor="includeCharts">
											Include charts and visualizations
										</Label>
									</div>

									<div className="flex items-center space-x-2">
										<Checkbox
											id="includeRawData"
											checked={
												exportOptions.includeRawData
											}
											onCheckedChange={(checked) =>
												setExportOptions((prev) => ({
													...prev,
													includeRawData:
														checked as boolean,
												}))
											}
										/>
										<Label htmlFor="includeRawData">
											Include raw data tables
										</Label>
									</div>
								</div>

								<div className="flex justify-end gap-2">
									<Button
										variant="outline"
										onClick={() =>
											setShowExportDialog(false)
										}
									>
										Cancel
									</Button>
									<Button
										onClick={handleCustomExport}
										disabled={isExporting}
									>
										{isExporting ? (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										) : (
											<Download className="mr-2 h-4 w-4" />
										)}
										Export
									</Button>
								</div>
							</div>
						</DialogContent>
					</Dialog>

					<Dialog
						open={showPrintDialog}
						onOpenChange={setShowPrintDialog}
					>
						<DialogTrigger asChild>
							<DropdownMenuItem
								onSelect={(e) => e.preventDefault()}
							>
								<Printer className="mr-2 h-4 w-4" />
								Print Report...
							</DropdownMenuItem>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Print Options</DialogTitle>
								<DialogDescription>
									Configure print layout and options
								</DialogDescription>
							</DialogHeader>

							<div className="space-y-4">
								<div>
									<Label>Orientation</Label>
									<div className="flex gap-2 mt-2">
										{["portrait", "landscape"].map(
											(orientation) => (
												<Button
													key={orientation}
													variant={
														printOptions.orientation ===
														orientation
															? "default"
															: "outline"
													}
													size="sm"
													onClick={() =>
														setPrintOptions(
															(prev) => ({
																...prev,
																orientation:
																	orientation as PrintOptions["orientation"],
															}),
														)
													}
												>
													{orientation
														.charAt(0)
														.toUpperCase() +
														orientation.slice(1)}
												</Button>
											),
										)}
									</div>
								</div>

								<div>
									<Label>Paper Size</Label>
									<div className="flex gap-2 mt-2">
										{["a4", "letter"].map((size) => (
											<Button
												key={size}
												variant={
													printOptions.paperSize ===
													size
														? "default"
														: "outline"
												}
												size="sm"
												onClick={() =>
													setPrintOptions((prev) => ({
														...prev,
														paperSize:
															size as PrintOptions["paperSize"],
													}))
												}
											>
												{size.toUpperCase()}
											</Button>
										))}
									</div>
								</div>

								<div className="space-y-2">
									<div className="flex items-center space-x-2">
										<Checkbox
											id="printCharts"
											checked={printOptions.includeCharts}
											onCheckedChange={(checked) =>
												setPrintOptions((prev) => ({
													...prev,
													includeCharts:
														checked as boolean,
												}))
											}
										/>
										<Label htmlFor="printCharts">
											Include charts
										</Label>
									</div>

									<div className="flex items-center space-x-2">
										<Checkbox
											id="printHeader"
											checked={printOptions.includeHeader}
											onCheckedChange={(checked) =>
												setPrintOptions((prev) => ({
													...prev,
													includeHeader:
														checked as boolean,
												}))
											}
										/>
										<Label htmlFor="printHeader">
											Include header
										</Label>
									</div>

									<div className="flex items-center space-x-2">
										<Checkbox
											id="printFooter"
											checked={printOptions.includeFooter}
											onCheckedChange={(checked) =>
												setPrintOptions((prev) => ({
													...prev,
													includeFooter:
														checked as boolean,
												}))
											}
										/>
										<Label htmlFor="printFooter">
											Include footer
										</Label>
									</div>
								</div>

								<div className="flex justify-end gap-2">
									<Button
										variant="outline"
										onClick={() =>
											setShowPrintDialog(false)
										}
									>
										Cancel
									</Button>
									<Button onClick={handlePrint}>
										<Printer className="mr-2 h-4 w-4" />
										Print
									</Button>
								</div>
							</div>
						</DialogContent>
					</Dialog>

					<Dialog
						open={showEmailDialog}
						onOpenChange={setShowEmailDialog}
					>
						<DialogTrigger asChild>
							<DropdownMenuItem
								onSelect={(e) => e.preventDefault()}
							>
								<Mail className="mr-2 h-4 w-4" />
								Email Report...
							</DropdownMenuItem>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Email Report</DialogTitle>
								<DialogDescription>
									Send the report via email
								</DialogDescription>
							</DialogHeader>

							<div className="space-y-4">
								<div>
									<Label htmlFor="recipients">
										Recipients (comma-separated)
									</Label>
									<Input
										id="recipients"
										placeholder="email1@company.com, email2@company.com"
										value={emailOptions.recipients}
										onChange={(e) =>
											setEmailOptions((prev) => ({
												...prev,
												recipients: e.target.value,
											}))
										}
									/>
								</div>

								<div>
									<Label htmlFor="subject">Subject</Label>
									<Input
										id="subject"
										value={emailOptions.subject}
										onChange={(e) =>
											setEmailOptions((prev) => ({
												...prev,
												subject: e.target.value,
											}))
										}
									/>
								</div>

								<div>
									<Label htmlFor="message">
										Message (optional)
									</Label>
									<Textarea
										id="message"
										rows={3}
										placeholder="Add a custom message..."
										value={emailOptions.message}
										onChange={(e) =>
											setEmailOptions((prev) => ({
												...prev,
												message: e.target.value,
											}))
										}
									/>
								</div>

								<div className="flex justify-end gap-2">
									<Button
										variant="outline"
										onClick={() =>
											setShowEmailDialog(false)
										}
									>
										Cancel
									</Button>
									<Button
										onClick={handleEmailReport}
										disabled={
											!emailOptions.recipients.trim() ||
											isExporting
										}
									>
										{isExporting ? (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										) : (
											<Mail className="mr-2 h-4 w-4" />
										)}
										Send Report
									</Button>
								</div>
							</div>
						</DialogContent>
					</Dialog>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
