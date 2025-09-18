import type { QCActivityItem } from "@pipetrak/qc/lib/activity-loader";
import { Avatar, AvatarFallback } from "@ui/components/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { cn } from "@ui/lib";
import { format } from "date-fns";

interface QCActivityFeedProps {
	activities?: QCActivityItem[];
	className?: string;
}

export function QCActivityFeed({
	activities = [],
	className,
}: QCActivityFeedProps) {
	if (activities.length === 0) {
		return (
			<Card className={cn("", className)}>
				<CardHeader>
					<CardTitle className="text-lg">Recent Welds</CardTitle>
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
							<p className="text-sm font-medium">
								No weld activity yet
							</p>
							<p className="text-sm">
								Start by adding welders or importing field weld
								data
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
				<CardTitle className="text-lg">Recent Welds</CardTitle>
				<p className="text-sm text-muted-foreground">
					Latest weld entries with welder details and QC updates.
				</p>
			</CardHeader>
			<CardContent className="space-y-4">
				{activities.map((activity) => {
					const weldDateIso =
						activity.dateWelded ?? activity.effectiveDate;
					const weldDate = weldDateIso ? new Date(weldDateIso) : null;
					return (
						<div
							key={activity.id}
							className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between p-3 rounded-lg bg-muted/30"
						>
							<Avatar className="h-9 w-9">
								<AvatarFallback className="text-xs font-medium">
									{activity.updatedBy?.initials ?? "--"}
								</AvatarFallback>
							</Avatar>
							<div className="flex-1 space-y-1">
								<p className="text-sm font-medium">
									Weld {activity.weldNumber}
								</p>
								<p className="text-sm text-muted-foreground">
									{activity.welder.name ||
									activity.welder.stencil ? (
										<>
											{activity.welder.name ??
												"Welder not assigned"}
											{activity.welder.stencil
												? ` (${activity.welder.stencil})`
												: ""}
										</>
									) : (
										"Welder not assigned"
									)}
								</p>
								<p className="text-xs text-muted-foreground">
									{weldDate
										? `Welded ${format(weldDate, "MMM d, yyyy")}`
										: "Weld date not recorded"}
								</p>
							</div>
							<div className="text-xs text-muted-foreground text-left lg:text-right">
								{activity.updatedBy ? (
									<p>
										Marked complete by{" "}
										<span className="font-medium text-foreground">
											{activity.updatedBy.name}
										</span>
									</p>
								) : (
									<p>Marked complete (user not recorded)</p>
								)}
								<p>{activity.relativeUpdatedAt}</p>
							</div>
						</div>
					);
				})}
			</CardContent>
		</Card>
	);
}
