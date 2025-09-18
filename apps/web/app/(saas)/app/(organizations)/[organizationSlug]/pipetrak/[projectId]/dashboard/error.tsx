"use client";

import { Alert, AlertDescription } from "@ui/components/alert";
import { Button } from "@ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import { Bug, Home, RefreshCw, Shield } from "lucide-react";
import { useEffect } from "react";

interface DashboardErrorProps {
	error: Error & { digest?: string };
	reset: () => void;
}

/**
 * Dashboard error boundary component
 * Provides user-friendly error handling with recovery options
 */
export default function DashboardError({ error, reset }: DashboardErrorProps) {
	useEffect(() => {
		// Log the error to monitoring service
		console.error("Dashboard error:", error);
	}, [error]);

	// Determine error type and provide appropriate messaging
	const getErrorInfo = () => {
		const message = error.message.toLowerCase();

		if (message.includes("not found") || message.includes("404")) {
			return {
				title: "Project Not Found",
				description:
					"The project you're trying to access doesn't exist or you don't have permission to view it.",
				icon: Shield,
				canRetry: false,
			};
		}

		if (message.includes("network") || message.includes("fetch")) {
			return {
				title: "Connection Problem",
				description:
					"Unable to connect to the server. Please check your internet connection and try again.",
				icon: RefreshCw,
				canRetry: true,
			};
		}

		if (message.includes("timeout")) {
			return {
				title: "Request Timeout",
				description:
					"The request took too long to complete. The server might be busy.",
				icon: RefreshCw,
				canRetry: true,
			};
		}

		if (
			message.includes("permission") ||
			message.includes("unauthorized")
		) {
			return {
				title: "Access Denied",
				description:
					"You don't have permission to access this dashboard. Please contact your administrator.",
				icon: Shield,
				canRetry: false,
			};
		}

		// Generic error
		return {
			title: "Something went wrong",
			description:
				"An unexpected error occurred while loading the dashboard.",
			icon: Bug,
			canRetry: true,
		};
	};

	const errorInfo = getErrorInfo();
	const ErrorIcon = errorInfo.icon;

	return (
		<div className="min-h-[60vh] flex items-center justify-center p-4">
			<Card className="max-w-lg w-full">
				<CardHeader className="text-center">
					<div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
						<ErrorIcon className="h-6 w-6 text-red-600" />
					</div>
					<CardTitle className="text-xl">{errorInfo.title}</CardTitle>
					<CardDescription className="text-center">
						{errorInfo.description}
					</CardDescription>
				</CardHeader>

				<CardContent className="space-y-4">
					{/* Error details (only in development) */}
					{process.env.NODE_ENV === "development" && (
						<Alert>
							<Bug className="h-4 w-4" />
							<AlertDescription className="font-mono text-xs break-all">
								{error.message}
								{error.digest && (
									<div className="mt-2 text-muted-foreground">
										Error ID: {error.digest}
									</div>
								)}
							</AlertDescription>
						</Alert>
					)}

					{/* Action buttons */}
					<div className="flex flex-col sm:flex-row gap-2 justify-center">
						{errorInfo.canRetry && (
							<Button onClick={reset} className="gap-2">
								<RefreshCw className="h-4 w-4" />
								Try Again
							</Button>
						)}

						<Button
							variant="outline"
							onClick={() => {
								window.location.href = "/app";
							}}
							className="gap-2"
						>
							<Home className="h-4 w-4" />
							Go to Dashboard
						</Button>
					</div>

					{/* Additional help text */}
					<div className="text-center text-sm text-muted-foreground">
						<p>If this problem persists, please contact support.</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
