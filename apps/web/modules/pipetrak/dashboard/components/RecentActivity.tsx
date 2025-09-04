"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import { CheckCircle22, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface RecentActivityProps {
	activities: {
		id: string;
		milestoneName: string;
		completedAt: Date;
		component: {
			componentId: string;
			type?: string | null;
			area?: string | null;
			system?: string | null;
		};
	}[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
	if (activities.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Recent Activity</CardTitle>
					<CardDescription>
						Latest milestone completions
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground text-center py-8">
						No recent activity in the last 7 days
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Recent Activity</CardTitle>
				<CardDescription>Latest milestone completions</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{activities.map((activity) => (
						<div
							key={activity.id}
							className="flex items-start gap-3"
						>
							<CheckCircle22 className="h-5 w-5 text-green-600 mt-0.5" />
							<div className="flex-1 space-y-1">
								<p className="text-sm">
									<span className="font-medium">
										{activity.milestoneName}
									</span>{" "}
									completed on{" "}
									<span className="font-medium">
										{activity.component.componentId}
									</span>
								</p>
								<div className="flex items-center gap-4 text-xs text-muted-foreground">
									{activity.component.area && (
										<span>
											Area: {activity.component.area}
										</span>
									)}
									{activity.component.system && (
										<span>
											System: {activity.component.system}
										</span>
									)}
									<div className="flex items-center gap-1">
										<Clock className="h-3 w-3" />
										{formatDistanceToNow(
											new Date(activity.completedAt),
											{ addSuffix: true },
										)}
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
