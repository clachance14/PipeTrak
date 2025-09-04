"use client";

import { Card, CardContent } from "@ui/components/card";
import { Skeleton } from "@ui/components/skeleton";

interface CardSkeletonProps {
	className?: string;
	showShimmer?: boolean;
}

export function CardSkeleton({
	className,
	showShimmer = true,
}: CardSkeletonProps) {
	return (
		<Card className={className}>
			<CardContent className="p-4 space-y-3">
				{/* Header row */}
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2 flex-1">
						<div className="relative overflow-hidden">
							<Skeleton className="h-6 w-6 rounded" />
							{showShimmer && (
								<div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
							)}
						</div>
						<div className="relative overflow-hidden">
							<Skeleton className="h-5 w-24" />
							{showShimmer && (
								<div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
							)}
						</div>
					</div>
					<div className="relative overflow-hidden">
						<Skeleton className="h-8 w-8 rounded" />
						{showShimmer && (
							<div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
						)}
					</div>
				</div>

				{/* Content lines */}
				<div className="space-y-2">
					<div className="relative overflow-hidden">
						<Skeleton className="h-4 w-full" />
						{showShimmer && (
							<div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
						)}
					</div>
					<div className="relative overflow-hidden">
						<Skeleton className="h-4 w-3/4" />
						{showShimmer && (
							<div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
						)}
					</div>
				</div>

				{/* Progress section */}
				<div className="pt-2 border-t space-y-2">
					<div className="flex items-center justify-between">
						<div className="relative overflow-hidden">
							<Skeleton className="h-4 w-16" />
							{showShimmer && (
								<div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
							)}
						</div>
						<div className="relative overflow-hidden">
							<Skeleton className="h-4 w-8" />
							{showShimmer && (
								<div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
							)}
						</div>
					</div>
					<div className="relative overflow-hidden">
						<Skeleton className="h-2 w-full rounded-full" />
						{showShimmer && (
							<div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
						)}
					</div>
				</div>

				{/* Footer with button */}
				<div className="pt-2 border-t">
					<div className="relative overflow-hidden">
						<Skeleton className="h-12 w-full rounded-md" />
						{showShimmer && (
							<div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export function CardGrid3x3Skeleton({
	count = 6,
	className,
	showShimmer = true,
}: {
	count?: number;
	className?: string;
	showShimmer?: boolean;
}) {
	return (
		<div
			className={`grid gap-4 ${className || "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}
		>
			{Array.from({ length: count }, (_, i) => (
				<CardSkeleton key={i} showShimmer={showShimmer} />
			))}
		</div>
	);
}
