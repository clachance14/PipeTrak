"use client";

import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { cn } from "@ui/lib";
import {
	AlertTriangle,
	CloudOff,
	RefreshCw,
	Upload,
	Wifi,
	WifiOff,
} from "lucide-react";

interface OfflineIndicatorProps {
	isOnline: boolean;
	queueCount: number;
	onSync?: () => Promise<void>;
	className?: string;
}

export function OfflineIndicator({
	isOnline,
	queueCount,
	onSync,
	className,
}: OfflineIndicatorProps) {
	if (isOnline && queueCount === 0) {
		return (
			<div className={cn("flex items-center gap-1", className)}>
				<Wifi className="h-4 w-4 text-green-600" />
				<span className="text-xs text-green-600 font-medium">
					Online
				</span>
			</div>
		);
	}

	if (!isOnline) {
		return (
			<div className={cn("flex items-center gap-2", className)}>
				<div className="flex items-center gap-1">
					<WifiOff className="h-4 w-4 text-amber-600" />
					<span className="text-xs text-amber-600 font-medium">
						Offline
					</span>
				</div>

				{queueCount > 0 && (
					<Badge
						status="info"
						className="text-xs bg-amber-50 border-amber-200"
					>
						<CloudOff className="h-3 w-3 mr-1" />
						{queueCount} queued
					</Badge>
				)}
			</div>
		);
	}

	if (isOnline && queueCount > 0) {
		return (
			<div className={cn("flex items-center gap-2", className)}>
				<div className="flex items-center gap-1">
					<AlertTriangle className="h-4 w-4 text-blue-600" />
					<span className="text-xs text-blue-600 font-medium">
						Syncing
					</span>
				</div>

				<Badge
					status="info"
					className="text-xs bg-blue-50 border-blue-200"
				>
					<Upload className="h-3 w-3 mr-1" />
					{queueCount} pending
				</Badge>

				{onSync && (
					<Button
						variant="ghost"
						size="sm"
						onClick={onSync}
						className="h-6 px-2 text-xs"
					>
						<RefreshCw className="h-3 w-3 mr-1" />
						Sync Now
					</Button>
				)}
			</div>
		);
	}

	return null;
}
