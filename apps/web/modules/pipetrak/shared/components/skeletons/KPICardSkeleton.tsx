"use client";

import { Card, CardContent } from "@ui/components/card";
import { Skeleton } from "@ui/components/skeleton";

export function KPICardSkeleton() {
	return (
		<Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
			<CardContent className="p-4">
				<div className="space-y-2">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-8 w-16" />
				</div>
			</CardContent>
		</Card>
	);
}

export function KPICardSkeletonShimmer() {
	return (
		<Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 relative overflow-hidden">
			<CardContent className="p-4">
				<div className="space-y-2">
					<div className="relative">
						<Skeleton className="h-4 w-24" />
						<div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
					</div>
					<div className="relative">
						<Skeleton className="h-8 w-16" />
						<div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
