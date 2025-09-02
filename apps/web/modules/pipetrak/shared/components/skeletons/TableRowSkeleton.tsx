"use client";

import { Skeleton } from "@ui/components/skeleton";

interface TableRowSkeletonProps {
	columns?: number;
	height?: number;
	className?: string;
}

export function TableRowSkeleton({
	columns = 6,
	height = 65,
	className,
}: TableRowSkeletonProps) {
	return (
		<tr className={className} style={{ height: `${height}px` }}>
			{Array.from({ length: columns }, (_, i) => (
				<td key={i} className="px-3 py-2">
					<Skeleton className="h-4 w-full max-w-32" />
				</td>
			))}
		</tr>
	);
}

export function TableRowSkeletonShimmer({
	columns = 6,
	height = 65,
	className,
}: TableRowSkeletonProps) {
	return (
		<tr className={className} style={{ height: `${height}px` }}>
			{Array.from({ length: columns }, (_, i) => (
				<td key={i} className="px-3 py-2 relative">
					<div className="relative overflow-hidden">
						<Skeleton className="h-4 w-full max-w-32" />
						<div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
					</div>
				</td>
			))}
		</tr>
	);
}

export function TableSkeleton({
	rows = 10,
	columns = 6,
	showShimmer = true,
}: {
	rows?: number;
	columns?: number;
	showShimmer?: boolean;
}) {
	const RowComponent = showShimmer
		? TableRowSkeletonShimmer
		: TableRowSkeleton;

	return (
		<div className="space-y-3">
			{/* Header skeleton */}
			<div className="flex gap-4 px-4 py-2 border-b">
				{Array.from({ length: columns }, (_, i) => (
					<Skeleton key={i} className="h-5 w-20" />
				))}
			</div>

			{/* Row skeletons */}
			<table className="w-full">
				<tbody>
					{Array.from({ length: rows }, (_, i) => (
						<RowComponent key={i} columns={columns} />
					))}
				</tbody>
			</table>
		</div>
	);
}
