import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { Avatar, AvatarFallback } from "@ui/components/avatar";
import { cn } from "@ui/lib";
import type { QCActivityItem } from "@pipetrak/qc/lib/activity-loader";

interface QCActivityFeedProps {
	activities?: QCActivityItem[];
	className?: string;
}

const activityTypeConfig = {
	added: {
		badgeVariant: "default" as const,
		badgeText: "Added",
		bgColor: "bg-green-50",
	},
	completed: {
		badgeVariant: "secondary" as const,
		badgeText: "Completed",
		bgColor: "bg-blue-50",
	},
	updated: {
		badgeVariant: "outline" as const,
		badgeText: "Updated",
		bgColor: "bg-orange-50",
	},
	report: {
		badgeVariant: "outline" as const,
		badgeText: "Report",
		bgColor: "bg-purple-50",
	},
	import: {
		badgeVariant: "outline" as const,
		badgeText: "Import",
		bgColor: "bg-indigo-50",
	},
};

const filterOptions = [
	{ label: "All", value: "all", active: true },
	{ label: "Welds", value: "welds", active: false },
	{ label: "Welders", value: "welders", active: false },
	{ label: "Reports", value: "reports", active: false },
];

export function QCActivityFeed({
	activities = [],
	className,
}: QCActivityFeedProps) {
	if (activities.length === 0) {
		return (
			<Card className={cn("", className)}>
				<CardHeader>
					<CardTitle className="text-lg">Recent Activity</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-center py-12">
						<div className="text-muted-foreground">
							<svg
								className="mx-auto h-12 w-12 text-gray-400 mb-4"
								stroke="currentColor"
								fill="none"
								viewBox="0 0 48 48"
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.712-3.714M14 40v-4a9.971 9.971 0 01.712-3.714"
								/>
							</svg>
							<p className="text-sm font-medium">No QC activity yet</p>
							<p className="text-sm">
								Start by adding welders or importing field weld data
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className={cn("", className)}>
			<CardHeader className="pb-4">
				<div className="flex items-center justify-between">
					<CardTitle className="text-lg">Recent Activity</CardTitle>
					<div className="flex gap-2">
						{filterOptions.map((filter) => (
							<button
								key={filter.value}
								className={cn(
									"text-xs px-3 py-1.5 rounded-full font-medium transition-colors",
									filter.active
										? "bg-primary/10 text-primary"
										: "bg-muted text-muted-foreground hover:bg-muted/80",
								)}
							>
								{filter.label}
							</button>
						))}
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{activities.map((activity) => {
					const config = activityTypeConfig[activity.type];
					
					return (
						<div
							key={activity.id}
							className={cn(
								"flex gap-3 p-3 rounded-lg transition-colors",
								config.bgColor,
							)}
						>
							<Avatar className="h-9 w-9">
								<AvatarFallback className="text-xs font-medium">
									{activity.user.initials}
								</AvatarFallback>
							</Avatar>
							<div className="flex-1 space-y-1">
								<div className="flex items-center gap-2">
									<p className="text-sm">
										<span className="font-medium">
											{activity.user.name}
										</span>{" "}
										{activity.action}{" "}
										{activity.target && (
											<span className="font-mono text-xs bg-background px-1.5 py-0.5 rounded">
												{activity.target}
											</span>
										)}
									</p>
									<Badge
										variant={config.badgeVariant}
										className="text-xs"
									>
										{config.badgeText}
									</Badge>
								</div>
								<p className="text-xs text-muted-foreground">
									{activity.timestamp}
								</p>
							</div>
						</div>
					);
				})}
			</CardContent>
		</Card>
	);
}