"use client";

import { useState, useMemo } from "react";
import { Activity, Filter, Wrench } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import { ScrollArea } from "@ui/components/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Badge } from "@ui/components/badge";
import { Avatar, AvatarFallback } from "@ui/components/avatar";
import {
	formatRelativeTime,
	formatActivityDescription,
	generateSparklinePath,
} from "../lib/utils";
import type { RecentActivity, ActivityItem } from "../types";

interface ActivityFeedProps {
	data: RecentActivity | null;
}

interface ActivityItemComponentProps {
	activity: ActivityItem;
}

function ActivityItemComponent({ activity }: ActivityItemComponentProps) {
	const userInitials = activity.userName
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	const activityIcon =
		activity.activityType === "milestone_completed" ? (
			<Wrench className="w-3 h-3" />
		) : (
			<Activity className="w-3 h-3" />
		);

	const description = formatActivityDescription(
		activity.userName,
		activity.activityType,
		activity.componentId,
		activity.milestoneName,
	);

	return (
		<div className="flex items-start gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors">
			<Avatar className="w-8 h-8 mt-0.5">
				<AvatarFallback className="text-xs bg-primary/10 text-primary">
					{userInitials}
				</AvatarFallback>
			</Avatar>

			<div className="flex-1 min-w-0 space-y-1">
				<div className="flex items-center gap-2">
					<div className="flex items-center gap-1">
						{activityIcon}
						<span className="text-sm font-medium truncate">
							{activity.userName}
						</span>
					</div>
					<span className="text-xs text-muted-foreground">
						{formatRelativeTime(activity.timestamp)}
					</span>
				</div>

				<p className="text-sm text-muted-foreground">
					{activity.activityType === "milestone_completed"
						? "completed"
						: "updated"}
					<span className="font-medium text-foreground mx-1">
						{activity.componentId}
					</span>
					{activity.milestoneName && (
						<>
							milestone:{" "}
							<span className="font-medium text-foreground">
								{activity.milestoneName}
							</span>
						</>
					)}
				</p>

				{activity.details.completionPercent !== undefined && (
					<Badge status="info" className="text-xs">
						{activity.details.completionPercent}% complete
					</Badge>
				)}
			</div>
		</div>
	);
}

function ActivitySparkline({ activities }: { activities: ActivityItem[] }) {
	// Generate daily activity counts for last 7 days
	const dailyCounts = useMemo(() => {
		const now = new Date();
		const today = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
		);

		// Create array of the last 7 days (including today)
		const days = Array.from({ length: 7 }, (_, i) => {
			const date = new Date(today);
			date.setDate(date.getDate() - (6 - i)); // 6 days ago to today
			return date.toDateString(); // Use date string for comparison
		});

		const counts = days.map((day) => {
			return activities.filter((activity) => {
				// activity.timestamp is already in milliseconds from RPC
				const activityDate = new Date(activity.timestamp);
				return activityDate.toDateString() === day;
			}).length;
		});

		return counts;
	}, [activities]);

	const sparklinePath = generateSparklinePath(dailyCounts, 100, 20, 2);

	return (
		<div className="flex items-center gap-2">
			<span className="text-xs text-muted-foreground">
				Activity trend:
			</span>
			<svg width="100" height="20" className="text-blue-500">
				<path
					d={sparklinePath}
					stroke="currentColor"
					strokeWidth="1.5"
					fill="none"
					className="opacity-75"
				/>
				{dailyCounts.map((count, index) => {
					const x =
						2 +
						(index * (100 - 4)) /
							Math.max(dailyCounts.length - 1, 1);
					const maxCount = Math.max(...dailyCounts);
					const y = 18 - 2 - (count / (maxCount || 1)) * (20 - 4);
					return (
						<circle
							key={index}
							cx={x}
							cy={y}
							r="1.5"
							fill="currentColor"
							className="opacity-75"
						/>
					);
				})}
			</svg>
		</div>
	);
}

export function ActivityFeed({ data }: ActivityFeedProps) {
	const [areaFilter, setAreaFilter] = useState<string>("all");
	const [systemFilter, setSystemFilter] = useState<string>("all");
	const [userFilter, setUserFilter] = useState<string>("all");

	const { filteredActivities, uniqueUsers, uniqueAreas, uniqueSystems } =
		useMemo(() => {
			if (!data?.activities?.length) {
				return {
					filteredActivities: [],
					uniqueUsers: [],
					uniqueAreas: [],
					uniqueSystems: [],
				};
			}

			let filtered = [...data.activities];

			// Extract unique values for filters (simplified - would need component data for area/system)
			const uniqueUsers = [
				...new Set(data.activities.map((a) => a.userName)),
			].sort();
			const uniqueAreas: string[] = []; // TODO: Would need to join with component data
			const uniqueSystems: string[] = []; // TODO: Would need to join with component data

			// Apply filters
			if (userFilter !== "all") {
				filtered = filtered.filter(
					(activity) => activity.userName === userFilter,
				);
			}

			// Sort by timestamp (most recent first)
			filtered.sort((a, b) => b.timestamp - a.timestamp);

			return {
				filteredActivities: filtered,
				uniqueUsers,
				uniqueAreas,
				uniqueSystems,
			};
		}, [data, areaFilter, systemFilter, userFilter]);

	const stats = useMemo(() => {
		if (!data?.activities?.length) {
			return { total: 0, today: 0, thisWeek: 0 };
		}

		const now = Date.now();
		const todayStart =
			Math.floor(now / (24 * 60 * 60 * 1000)) * (24 * 60 * 60 * 1000);
		const weekStart = now - 7 * 24 * 60 * 60 * 1000;

		return data.activities.reduce(
			(acc, activity) => {
				const activityTime = activity.timestamp * 1000;
				return {
					total: acc.total + 1,
					today: acc.today + (activityTime >= todayStart ? 1 : 0),
					thisWeek:
						acc.thisWeek + (activityTime >= weekStart ? 1 : 0),
				};
			},
			{ total: 0, today: 0, thisWeek: 0 },
		);
	}, [data]);

	if (!data?.activities?.length) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Recent Activity Feed</CardTitle>
					<CardDescription>
						Live feed of milestone completions, component updates,
						and project activity.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center h-64 text-muted-foreground">
						No recent activity available
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<Activity className="w-5 h-5" />
							Recent Activity Feed
							<Badge status="info" className="ml-2">
								{filteredActivities.length} items
							</Badge>
						</CardTitle>
						<CardDescription>
							{stats.today} today, {stats.thisWeek} this week
						</CardDescription>
					</div>
					<ActivitySparkline activities={data.activities} />
				</div>

				{/* Filters */}
				<div className="flex items-center gap-4 pt-4">
					<div className="flex items-center gap-2">
						<Filter className="w-4 h-4 text-muted-foreground" />
						<span className="text-sm text-muted-foreground">
							Filter by:
						</span>
					</div>

					<Select value={userFilter} onValueChange={setUserFilter}>
						<SelectTrigger className="w-[140px] h-8">
							<SelectValue placeholder="User" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Users</SelectItem>
							{uniqueUsers.map((user) => (
								<SelectItem key={user} value={user}>
									{user}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					{/* TODO: Enable when area/system data is available */}
					{/*
          <Select value={areaFilter} onValueChange={setAreaFilter} disabled>
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue placeholder="Area" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={systemFilter} onValueChange={setSystemFilter} disabled>
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue placeholder="System" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Systems</SelectItem>
            </SelectContent>
          </Select>
          */}
				</div>
			</CardHeader>
			<CardContent>
				<ScrollArea className="h-[400px] w-full">
					<div className="space-y-1 pr-4">
						{filteredActivities.length > 0 ? (
							filteredActivities.map((activity, index) => (
								<ActivityItemComponent
									key={`${activity.componentId}-${activity.timestamp}-${index}`}
									activity={activity}
								/>
							))
						) : (
							<div className="flex items-center justify-center h-32 text-muted-foreground">
								No activities match the current filters
							</div>
						)}
					</div>
				</ScrollArea>

				{/* Summary */}
				<div className="flex items-center justify-between text-sm text-muted-foreground mt-4 pt-4 border-t">
					<div>
						Showing {filteredActivities.length} of {stats.total}{" "}
						activities
					</div>
					<div>Last {data.limit || 50} activities</div>
				</div>
			</CardContent>
		</Card>
	);
}
