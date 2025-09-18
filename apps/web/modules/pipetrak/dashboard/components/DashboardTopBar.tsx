"use client";

import { Button } from "@ui/components/button";
import { Filter, HelpCircle, RefreshCw, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type DashboardTopBarProps = Record<string, never>;

/**
 * Dashboard Top Bar - Client Component
 * Handles user interactions: search, filters, and manual refresh
 */
export function DashboardTopBar(_props: DashboardTopBarProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [isRefreshing, setIsRefreshing] = useState(false);

	const handleManualRefresh = () => {
		setIsRefreshing(true);
		startTransition(() => {
			router.refresh();
			// Reset refresh state after a delay to show feedback
			setTimeout(() => setIsRefreshing(false), 1000);
		});
	};

	return (
		<div className="flex items-center justify-end gap-2 py-4">
			{/* Search - Hidden on mobile, show on tablet+ */}
			<Button
				variant="secondary"
				size="sm"
				disabled
				className="gap-2 hidden md:flex"
			>
				<Search className="h-4 w-4" />
				<span className="hidden lg:inline">Search</span>
			</Button>

			{/* Filters - Hidden on mobile, show on tablet+ */}
			<Button
				variant="secondary"
				size="sm"
				disabled
				className="gap-2 hidden md:flex"
			>
				<Filter className="h-4 w-4" />
				<span className="hidden lg:inline">Filters</span>
			</Button>

			{/* Manual Refresh - Always visible but compact on mobile */}
			<Button
				variant="secondary"
				size="sm"
				onClick={handleManualRefresh}
				disabled={isPending || isRefreshing}
				className="gap-2 shrink-0"
			>
				<RefreshCw
					className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
				/>
				<span className="hidden md:inline">
					{isRefreshing ? "Refreshing..." : "Refresh"}
				</span>
			</Button>

			{/* Help - Hidden on mobile, show on desktop */}
			<Button
				variant="ghost"
				size="sm"
				disabled
				className="gap-2 hidden lg:flex"
			>
				<HelpCircle className="h-4 w-4" />
				Help
			</Button>
		</div>
	);
}
