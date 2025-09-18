import { Card, CardContent, CardHeader } from "@ui/components/card";
import { Skeleton } from "@ui/components/skeleton";

/**
 * Dashboard loading skeleton
 * Matches the exact layout of the dashboard page
 */
export default function DashboardLoading() {
	return (
		<div className="space-y-6">
			{/* Top Bar Skeleton */}
			<div className="flex items-center justify-between gap-4 py-4">
				{/* Left - Project selector */}
				<Skeleton className="h-10 w-[280px]" />

				{/* Right - Action buttons */}
				<div className="flex items-center gap-2">
					<Skeleton className="h-8 w-20" />
					<Skeleton className="h-8 w-20" />
					<Skeleton className="h-8 w-24" />
					<Skeleton className="h-8 w-16" />
				</div>
			</div>

			{/* Title and Last Updated */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<Skeleton className="h-8 w-64" />
					<Skeleton className="h-4 w-32" />
				</div>

				{/* KPI Hero Bar Skeleton */}
				<div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
					{/* Overall % Card */}
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<Skeleton className="h-4 w-16" />
							<Skeleton className="h-4 w-4 rounded" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-12 mb-2" />
							<Skeleton className="h-3 w-24" />
						</CardContent>
					</Card>

					{/* Components Card */}
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<Skeleton className="h-4 w-20" />
							<Skeleton className="h-4 w-4 rounded" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-24 mb-2" />
							<Skeleton className="h-3 w-20" />
						</CardContent>
					</Card>

					{/* Active Drawings Card */}
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-4 rounded" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-8 mb-2" />
							<Skeleton className="h-3 w-28" />
						</CardContent>
					</Card>

					{/* Test Packages Card */}
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<Skeleton className="h-4 w-18" />
							<Skeleton className="h-4 w-4 rounded" />
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-1 mb-2">
								<Skeleton className="h-8 w-16" />
								<Skeleton className="h-4 w-4 rounded" />
							</div>
							<Skeleton className="h-3 w-24" />
						</CardContent>
					</Card>

					{/* Stalled Card - Smaller and muted styling */}
					<Card className="border-orange-200 bg-orange-50/50">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<Skeleton className="h-4 w-12" />
							<Skeleton className="h-4 w-4 rounded" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-6 w-8 mb-2" />
							<div className="space-y-1">
								<Skeleton className="h-3 w-10" />
								<Skeleton className="h-3 w-12" />
								<Skeleton className="h-3 w-12" />
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Phase 3 Placeholder Sections */}
			<div className="space-y-6">
				{/* Area × System Grid3x3 Placeholder */}
				<Card className="border-dashed border-2 border-gray-300">
					<CardHeader>
						<div className="flex items-center gap-2">
							<Skeleton className="h-5 w-5 rounded" />
							<Skeleton className="h-5 w-48" />
						</div>
						<Skeleton className="h-4 w-96 mt-2" />
					</CardHeader>
					<CardContent>
						<Skeleton className="h-64 w-full rounded-lg" />
					</CardContent>
				</Card>

				{/* Two-column layout skeleton */}
				<div className="grid gap-6 lg:grid-cols-2">
					{/* Drawing Hierarchy Placeholder */}
					<Card className="border-dashed border-2 border-gray-300">
						<CardHeader>
							<div className="flex items-center gap-2">
								<Skeleton className="h-5 w-5 rounded" />
								<Skeleton className="h-5 w-32" />
							</div>
							<Skeleton className="h-4 w-72 mt-2" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-64 w-full rounded-lg" />
						</CardContent>
					</Card>

					{/* Test Package Readiness Placeholder */}
					<Card className="border-dashed border-2 border-gray-300">
						<CardHeader>
							<div className="flex items-center gap-2">
								<Skeleton className="h-5 w-5 rounded" />
								<Skeleton className="h-5 w-40" />
							</div>
							<Skeleton className="h-4 w-80 mt-2" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-64 w-full rounded-lg" />
						</CardContent>
					</Card>
				</div>

				{/* Activity Feed Placeholder */}
				<Card className="border-dashed border-2 border-gray-300">
					<CardHeader>
						<div className="flex items-center gap-2">
							<Skeleton className="h-5 w-5 rounded" />
							<Skeleton className="h-5 w-44" />
						</div>
						<Skeleton className="h-4 w-88 mt-2" />
					</CardHeader>
					<CardContent>
						<Skeleton className="h-64 w-full rounded-lg" />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
