import { Button } from "@ui/components/button";
import { Card } from "@ui/components/card";
import { cn } from "@ui/lib";
import { CheckCircle2, Download, FileCheck, Upload } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SuccessStateProps {
	title: string;
	description?: string;
	icon?: LucideIcon;
	actionLabel?: string;
	onAction?: () => void;
	secondaryActionLabel?: string;
	onSecondaryAction?: () => void;
	variant?: "default" | "import" | "export" | "upload";
	className?: string;
}

export function SuccessState({
	title,
	description,
	icon,
	actionLabel,
	onAction,
	secondaryActionLabel,
	onSecondaryAction,
	variant = "default",
	className,
}: SuccessStateProps) {
	const getDefaultIcon = () => {
		switch (variant) {
			case "import":
				return FileCheck;
			case "export":
				return Download;
			case "upload":
				return Upload;
			default:
				return CheckCircle2;
		}
	};

	const IconComponent = icon || getDefaultIcon();

	return (
		<Card className={cn("p-8", className)}>
			<div className="flex flex-col items-center justify-center text-center space-y-4">
				<div className="rounded-full p-4 bg-green-100 text-green-600">
					<IconComponent className="h-8 w-8" />
				</div>

				<div className="space-y-2">
					<h3 className="text-lg font-semibold text-green-900">
						{title}
					</h3>
					{description && (
						<p className="text-muted-foreground max-w-md">
							{description}
						</p>
					)}
				</div>

				{(actionLabel || secondaryActionLabel) && (
					<div className="flex flex-col sm:flex-row gap-2">
						{actionLabel && onAction && (
							<Button
								onClick={onAction}
								className="bg-green-600 hover:bg-green-700"
							>
								{actionLabel}
							</Button>
						)}
						{secondaryActionLabel && onSecondaryAction && (
							<Button variant="outline">
								{secondaryActionLabel}
							</Button>
						)}
					</div>
				)}
			</div>
		</Card>
	);
}

// Specific success state variants for common scenarios
export function ImportSuccessState({
	totalRows,
	successRows,
	onViewComponents,
	onImportMore,
}: {
	totalRows: number;
	successRows: number;
	onViewComponents?: () => void;
	onImportMore?: () => void;
}) {
	return (
		<SuccessState
			variant="import"
			title="Import completed successfully"
			description={`Successfully imported ${successRows} of ${totalRows} components.`}
			actionLabel="View Components"
			onAction={onViewComponents}
			secondaryActionLabel="Import More"
			onSecondaryAction={onImportMore}
		/>
	);
}

export function ExportSuccessState({
	fileName,
	recordCount,
	onDownload,
	onExportMore,
}: {
	fileName: string;
	recordCount: number;
	onDownload?: () => void;
	onExportMore?: () => void;
}) {
	return (
		<SuccessState
			variant="export"
			title="Export completed"
			description={`Successfully exported ${recordCount} records to ${fileName}.`}
			actionLabel="Download File"
			onAction={onDownload}
			secondaryActionLabel="Export More"
			onSecondaryAction={onExportMore}
		/>
	);
}

export function BulkUpdateSuccessState({
	updatedCount,
	onViewComponents,
	onMakeMoreChanges,
}: {
	updatedCount: number;
	onViewComponents?: () => void;
	onMakeMoreChanges?: () => void;
}) {
	return (
		<SuccessState
			title="Bulk update completed"
			description={`Successfully updated ${updatedCount} components.`}
			actionLabel="View Updated Components"
			onAction={onViewComponents}
			secondaryActionLabel="Make More Changes"
			onSecondaryAction={onMakeMoreChanges}
		/>
	);
}
