"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@ui/components/card";
import { Progress } from "@ui/components/progress";
import { Alert, AlertDescription } from "@ui/components/alert";
import { ScrollArea } from "@ui/components/scroll-area";
import {
	Loader2,
	CheckCircle2,
	XCircle,
	AlertTriangle,
	FileSpreadsheet,
	Clock,
	TrendingUp,
} from "lucide-react";
import { useImportProgress } from "../hooks/useImportProgress";

interface ImportStatusProps {
	jobId?: string;
	projectId: string;
}

interface ImportLog {
	timestamp: string;
	message: string;
	type: "info" | "success" | "warning" | "error";
}

export function ImportStatus({ jobId, projectId }: ImportStatusProps) {
	const { progress, status, logs, isComplete, hasErrors, jobData } =
		useImportProgress(jobId, projectId);

	const [elapsedTime, setElapsedTime] = useState(0);
	const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<
		number | null
	>(null);

	useEffect(() => {
		if (!isComplete) {
			const interval = setInterval(() => {
				setElapsedTime((prev) => prev + 1);
			}, 1000);

			return () => clearInterval(interval);
		}
	}, [isComplete]);

	useEffect(() => {
		// Estimate time remaining based on progress
		if (progress > 0 && progress < 100 && elapsedTime > 0) {
			const rate = progress / elapsedTime;
			const remaining = (100 - progress) / rate;
			setEstimatedTimeRemaining(Math.ceil(remaining));
		}
	}, [progress, elapsedTime]);

	const formatTime = (seconds: number): string => {
		if (seconds < 60) return `${seconds}s`;
		const minutes = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${minutes}m ${secs}s`;
	};

	const getStatusIcon = () => {
		switch (status) {
			case "processing":
				return (
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				);
			case "completed":
				return <CheckCircle2 className="h-8 w-8 text-green-600" />;
			case "failed":
				return <XCircle className="h-8 w-8 text-red-600" />;
			case "partial":
				return <AlertTriangle className="h-8 w-8 text-orange-600" />;
			default:
				return (
					<FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
				);
		}
	};

	const getStatusMessage = () => {
		if (jobData) {
			switch (status) {
				case "processing":
					return `Importing ${jobData.processedRows || 0} of ${jobData.totalRows || 0} components...`;
				case "completed": {
					const successCount =
						(jobData.processedRows || 0) - (jobData.errorRows || 0);
					return `Successfully imported ${successCount} components!`;
				}
				case "failed":
					return `Import failed - ${jobData.errorRows || 0} errors occurred`;
				case "partial": {
					const partialSuccess =
						(jobData.processedRows || 0) - (jobData.errorRows || 0);
					return `Imported ${partialSuccess} components with ${jobData.errorRows || 0} errors`;
				}
				default:
					return "Preparing import...";
			}
		}

		switch (status) {
			case "processing":
				return "Importing components...";
			case "completed":
				return "Import completed successfully!";
			case "failed":
				return "Import failed with errors";
			case "partial":
				return "Import completed with some errors";
			default:
				return "Preparing import...";
		}
	};

	return (
		<div className="space-y-6">
			{/* Status Header */}
			<div className="text-center space-y-4">
				<div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
					{getStatusIcon()}
				</div>
				<h3 className="text-xl font-semibold">{getStatusMessage()}</h3>
				{status === "processing" && (
					<p className="text-muted-foreground">
						Please wait while we import your data. This may take a
						few minutes for large files.
					</p>
				)}
			</div>

			{/* Progress Bar */}
			<div className="space-y-2">
				<div className="flex justify-between text-sm">
					<span className="font-medium">
						{progress}% Complete
						{jobData && (
							<span className="text-muted-foreground ml-2">
								({jobData.processedRows || 0} of{" "}
								{jobData.totalRows || 0} rows)
							</span>
						)}
					</span>
					{estimatedTimeRemaining && status === "processing" && (
						<span className="text-muted-foreground">
							~{formatTime(estimatedTimeRemaining)} remaining
						</span>
					)}
				</div>
				<Progress value={progress} className="h-3" />
			</div>

			{/* Statistics */}
			<div className="grid grid-cols-4 gap-4">
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<TrendingUp className="h-5 w-5 text-green-600" />
							<div>
								<p className="text-sm text-muted-foreground">
									Processed
								</p>
								<p className="text-xl font-bold">
									{jobData
										? `${jobData.processedRows || 0}/${jobData.totalRows || 0}`
										: `${progress}%`}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<CheckCircle2 className="h-5 w-5 text-green-600" />
							<div>
								<p className="text-sm text-muted-foreground">
									Success
								</p>
								<p className="text-xl font-bold">
									{jobData
										? (jobData.processedRows || 0) -
											(jobData.errorRows || 0)
										: 0}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<XCircle className="h-5 w-5 text-red-600" />
							<div>
								<p className="text-sm text-muted-foreground">
									Errors
								</p>
								<p className="text-xl font-bold">
									{jobData?.errorRows || 0}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<Clock className="h-5 w-5 text-blue-600" />
							<div>
								<p className="text-sm text-muted-foreground">
									Elapsed
								</p>
								<p className="text-xl font-bold">
									{formatTime(elapsedTime)}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Import Logs */}
			<Card>
				<CardContent className="p-4">
					<h4 className="font-medium mb-3">Import Activity</h4>
					<ScrollArea className="h-[200px] w-full">
						<div className="space-y-2">
							{logs.length > 0 ? (
								logs.map((log, idx) => (
									<div
										key={idx}
										className="flex items-start gap-2 text-sm"
									>
										<span className="text-muted-foreground font-mono text-xs mt-0.5">
											{log.timestamp}
										</span>
										<div className="flex-1">
											{log.type === "error" && (
												<XCircle className="h-3 w-3 text-red-600 inline mr-1" />
											)}
											{log.type === "warning" && (
												<AlertTriangle className="h-3 w-3 text-orange-600 inline mr-1" />
											)}
											{log.type === "success" && (
												<CheckCircle2 className="h-3 w-3 text-green-600 inline mr-1" />
											)}
											<span
												className={
													log.type === "error"
														? "text-red-600"
														: log.type === "warning"
															? "text-orange-600"
															: log.type ===
																	"success"
																? "text-green-600"
																: ""
												}
											>
												{log.message}
											</span>
										</div>
									</div>
								))
							) : (
								<div className="text-muted-foreground text-center py-4">
									Waiting for import to start...
								</div>
							)}
						</div>
					</ScrollArea>
				</CardContent>
			</Card>

			{/* Error Alert */}
			{hasErrors && (
				<Alert status="error">
					<AlertTriangle className="h-4 w-4" />
					<AlertDescription>
						Some components could not be imported. Please review the
						error log above and download the error report for
						details.
					</AlertDescription>
				</Alert>
			)}
		</div>
	);
}
