"use client";

import { QCToolbar } from "./QCToolbar";
import { QCActivityFeed } from "./QCActivityFeed";
import { useState, useTransition } from "react";
import type { QCActivityItem } from "@pipetrak/qc/lib/activity-loader";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";

// TODO: Uncomment when date range functionality is re-enabled
// Custom DateRange type since react-day-picker v9+ doesn't export it
// interface DateRange {
// 	from?: Date;
// 	to?: Date;
// }

interface QCDashboardClientProps {
	projectId: string;
	initialActivities: QCActivityItem[];
}

export function QCDashboardClient({
	projectId,
	initialActivities,
}: QCDashboardClientProps) {
	const [activities, setActivities] = useState<QCActivityItem[]>(initialActivities);
	const [isPending, startTransition] = useTransition();

	// TODO: Uncomment when date range functionality is re-enabled
	// Function to fetch filtered activities
	const fetchFilteredActivities = async (/* dateRange?: DateRange */) => {
		try {
			const params = new URLSearchParams();
			params.set("projectId", projectId);

			// TODO: Uncomment when date range functionality is re-enabled
			// if (dateRange?.from) {
			// 	params.set("from", dateRange.from.toISOString());
			// 	if (dateRange.to) {
			// 		params.set("to", dateRange.to.toISOString());
			// 	}
			// }

			const response = await fetch(`/api/pipetrak/qc/activity?${params.toString()}`);
			if (response.ok) {
				const data = await response.json();
				setActivities(data.activities || []);
			}
		} catch (error) {
			console.error("Failed to fetch filtered activities:", error);
		}
	};

	// TODO: Uncomment when date range functionality is re-enabled
	// Handle date range changes
	// const handleDateRangeChange = (range: DateRange | undefined) => {
	// 	startTransition(() => {
	// 		fetchFilteredActivities(range);
	// 	});
	// };

	// Handle refresh
	const handleRefresh = () => {
		startTransition(() => {
			fetchFilteredActivities();
		});
	};

	// Handle export
	const handleExport = () => {
		// TODO: Implement export functionality
		console.log("Export clicked");
	};

	return (
		<div className="space-y-6">
			<QCToolbar
				// onDateRangeChange={handleDateRangeChange} // Disabled for now - will be implemented in future
				onRefresh={handleRefresh}
				onExport={handleExport}
			/>
			
			{isPending ? (
				<QCActivitySkeleton />
			) : (
				<QCActivityFeed activities={activities} />
			)}
		</div>
	);
}

// Loading skeleton for activity feed
function QCActivitySkeleton() {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">Recent Activity</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{[1, 2, 3].map((i) => (
					<div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/30 animate-pulse">
						<div className="h-9 w-9 rounded-full bg-muted" />
						<div className="flex-1 space-y-2">
							<div className="h-4 bg-muted rounded w-3/4" />
							<div className="h-3 bg-muted rounded w-1/4" />
						</div>
					</div>
				))}
			</CardContent>
		</Card>
	);
}