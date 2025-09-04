"use client";

import { Card, CardContent } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { Progress } from "@ui/components/progress";
import { Button } from "@ui/components/button";
import {
	ChevronRight,
	MapPin,
	Package,
	Wrench,
	FileText,
	CheckCircle2,
	Clock,
	AlertCircle,
} from "lucide-react";
import { cn } from "@ui/lib";
import type { ComponentWithMilestones } from "../../types";

interface ComponentCardProps {
	component: ComponentWithMilestones;
	onClick: () => void;
	onQuickUpdate?: (status: string) => void;
}

export function ComponentCard({
	component,
	onClick,
	onQuickUpdate,
}: ComponentCardProps) {
	const getStatusIcon = () => {
		switch (component.status) {
			case "COMPLETED":
				return <CheckCircle2 className="h-5 w-5 text-fieldComplete" />;
			case "IN_PROGRESS":
				return <Clock className="h-5 w-5 text-blue-600" />;
			default:
				return <AlertCircle className="h-5 w-5 text-fieldPending" />;
		}
	};

	const getStatusColor = () => {
		switch (component.status) {
			case "COMPLETED":
				return "bg-fieldComplete/10 text-fieldComplete border-fieldComplete/20";
			case "IN_PROGRESS":
				return "bg-blue-100 text-blue-700 border-blue-200";
			default:
				return "bg-fieldPending/10 text-fieldPending border-fieldPending/20";
		}
	};

	const formatStatus = (status: string) => {
		return status.replace(/_/g, " ");
	};

	return (
		<Card
			className="cursor-pointer hover:shadow-md transition-shadow"
			onClick={onClick}
		>
			<CardContent className="p-4 space-y-3">
				{/* Header with Component ID and Status */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<h3 className="font-semibold text-sm">
							{component.componentId}
						</h3>
						{component.type && (
							<Badge status="info" className="text-xs">
								{component.type}
							</Badge>
						)}
					</div>
					<div className="flex items-center gap-2">
						{getStatusIcon()}
						<ChevronRight className="h-4 w-4 text-muted-foreground" />
					</div>
				</div>

				{/* Description */}
				{component.description && (
					<p className="text-sm text-muted-foreground line-clamp-2">
						{component.description}
					</p>
				)}

				{/* Meta Information Grid3x3 */}
				<div className="grid grid-cols-2 gap-2 text-xs">
					{component.area && (
						<div className="flex items-center gap-1 text-muted-foreground">
							<MapPin className="h-3 w-3" />
							<span className="truncate">{component.area}</span>
						</div>
					)}
					{component.system && (
						<div className="flex items-center gap-1 text-muted-foreground">
							<Package className="h-3 w-3" />
							<span className="truncate">{component.system}</span>
						</div>
					)}
					{component.spec && (
						<div className="flex items-center gap-1 text-muted-foreground">
							<Wrench className="h-3 w-3" />
							<span className="truncate">{component.spec}</span>
						</div>
					)}
					{component.drawingNumber && (
						<div className="flex items-center gap-1 text-muted-foreground">
							<FileText className="h-3 w-3" />
							<span className="truncate">
								{component.drawingNumber}
							</span>
						</div>
					)}
				</div>

				{/* Progress Bar */}
				<div className="space-y-1">
					<div className="flex items-center justify-between">
						<span className="text-xs text-muted-foreground">
							Progress
						</span>
						<span className="text-xs font-medium">
							{component.completionPercent || 0}%
						</span>
					</div>
					<Progress
						value={component.completionPercent || 0}
						className="h-2"
					/>
				</div>

				{/* Status Badge and Quick Actions */}
				<div className="flex items-center justify-between pt-2">
					<Badge
						status="info"
						className={cn("text-xs", getStatusColor())}
					>
						{formatStatus(component.status)}
					</Badge>

					{onQuickUpdate && (
						<div className="flex gap-1">
							{component.status === "NOT_STARTED" && (
								<Button
									size="sm"
									variant="ghost"
									className="h-[52px] px-3 text-xs"
									onClick={(e: React.MouseEvent) => {
										e.stopPropagation();
										onQuickUpdate("IN_PROGRESS");
									}}
								>
									Start
								</Button>
							)}
							{component.status === "IN_PROGRESS" && (
								<Button
									size="sm"
									variant="ghost"
									className="h-[52px] px-3 text-xs"
									onClick={(e: React.MouseEvent) => {
										e.stopPropagation();
										onQuickUpdate("COMPLETED");
									}}
								>
									Complete
								</Button>
							)}
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
