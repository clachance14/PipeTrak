import { Button } from "@ui/components/button";
import { Card } from "@ui/components/card";
import { cn } from "@ui/lib";
import { Package, Search, FileX, AlertTriangle } from "lucide-react";
import type { Icon } from "lucide-react";

interface EmptyStateProps {
	title: string;
	description?: string;
	icon?: Icon;
	actionLabel?: string;
	onAction?: () => void;
	variant?: "default" | "search" | "error" | "no-data";
	className?: string;
}

export function EmptyState({
	title,
	description,
	icon,
	actionLabel,
	onAction,
	variant = "default",
	className,
}: EmptyStateProps) {
	const getDefaultIcon = () => {
		switch (variant) {
			case "search":
				return Search;
			case "error":
				return AlertTriangle;
			case "no-data":
				return FileX;
			default:
				return Package;
		}
	};

	const IconComponent = icon || getDefaultIcon();

	return (
		<Card className={cn("p-8", className)}>
			<div className="flex flex-col items-center justify-center text-center space-y-4">
				<div
					className={cn(
						"rounded-full p-4",
						variant === "error"
							? "bg-red-100 text-red-600"
							: "bg-muted text-muted-foreground",
					)}
				>
					<IconComponent className="h-8 w-8" />
				</div>

				<div className="space-y-2">
					<h3 className="text-lg font-semibold">{title}</h3>
					{description && (
						<p className="text-muted-foreground max-w-md">
							{description}
						</p>
					)}
				</div>

				{actionLabel && onAction && (
					<Button variant="outline">{actionLabel}</Button>
				)}
			</div>
		</Card>
	);
}

// Specific empty state variants for common scenarios
export function NoComponentsState({ onImport }: { onImport?: () => void }) {
	return (
		<EmptyState
			variant="no-data"
			title="No components found"
			description="Get started by importing components from Excel or adding them manually."
			actionLabel="Import Components"
			onAction={onImport}
		/>
	);
}

export function NoSearchResultsState({
	onClearSearch,
}: {
	onClearSearch?: () => void;
}) {
	return (
		<EmptyState
			variant="search"
			title="No results found"
			description="Try adjusting your search criteria or filters."
			actionLabel="Clear Search"
			onAction={onClearSearch}
		/>
	);
}

export function ErrorState({
	title = "Something went wrong",
	description = "Please try again or contact support if the problem persists.",
	onRetry,
}: {
	title?: string;
	description?: string;
	onRetry?: () => void;
}) {
	return (
		<EmptyState
			variant="error"
			title={title}
			description={description}
			actionLabel="Try Again"
			onAction={onRetry}
		/>
	);
}
