import { Badge } from "@ui/components/badge";
import { Card, CardContent } from "@ui/components/card";
import { Building2, Clock, FileText } from "lucide-react";

interface ReportHeaderProps {
	title: string;
	description?: string;
	projectInfo?: {
		id: string;
		jobNumber: string;
		jobName: string;
		organization: string;
	};
	generatedAt?: string;
	reportType: string;
	isLoading?: boolean;
}

/**
 * Common header for all report pages
 * Shows project info, generation timestamp, and report type
 */
export function ReportHeader({
	title,
	description,
	projectInfo,
	generatedAt,
	reportType,
	isLoading = false,
}: ReportHeaderProps) {
	if (isLoading) {
		return (
			<Card className="animate-pulse">
				<CardContent className="p-6">
					<div className="flex items-center justify-between">
						<div className="space-y-2">
							<div className="h-6 bg-gray-300 rounded w-48" />
							<div className="h-4 bg-gray-200 rounded w-64" />
						</div>
						<div className="h-8 bg-gray-200 rounded w-24" />
					</div>
					<div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="h-4 bg-gray-200 rounded" />
						<div className="h-4 bg-gray-200 rounded" />
						<div className="h-4 bg-gray-200 rounded" />
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="border-l-4 border-l-blue-500">
			<CardContent className="p-6">
				<div className="flex items-start justify-between mb-4">
					<div>
						<h1 className="text-2xl font-bold text-gray-900">
							{title}
						</h1>
						{description && (
							<p className="text-muted-foreground mt-1">
								{description}
							</p>
						)}
					</div>
					<Badge status="info" className="ml-4">
						{reportType}
					</Badge>
				</div>

				{projectInfo && (
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
						<div className="flex items-center gap-2 text-sm">
							<Building2 className="h-4 w-4 text-muted-foreground" />
							<div>
								<span className="font-medium">
									{projectInfo.organization}
								</span>
							</div>
						</div>

						<div className="flex items-center gap-2 text-sm">
							<FileText className="h-4 w-4 text-muted-foreground" />
							<div>
								<span className="font-medium">
									{projectInfo.jobNumber}
								</span>
								<span className="text-muted-foreground ml-1">
									- {projectInfo.jobName}
								</span>
							</div>
						</div>

						{generatedAt && (
							<div className="flex items-center gap-2 text-sm">
								<Clock className="h-4 w-4 text-muted-foreground" />
								<div>
									<span className="text-muted-foreground">
										Generated:
									</span>
									<span className="font-medium ml-1">
										{new Date(generatedAt).toLocaleString()}
									</span>
								</div>
							</div>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
