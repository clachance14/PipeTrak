"use client";

// import { usePathname } from "next/navigation";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@ui/components/breadcrumb";
import { cn } from "@ui/lib";
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import type { Drawing } from "../../types";

interface DrawingBreadcrumbsProps {
	projectId: string;
	projectName?: string;
	drawing?: Drawing;
	breadcrumbPath?: { id: string; number: string; title: string }[];
	className?: string;
}

export function DrawingBreadcrumbs({
	projectId,
	projectName,
	drawing,
	breadcrumbPath = [],
	className,
}: DrawingBreadcrumbsProps) {
	// const pathname = usePathname();
	const baseUrl = `/app/pipetrak/${projectId}`;

	return (
		<Breadcrumb className={cn("mb-4", className)}>
			<BreadcrumbList>
				{/* Project Home */}
				<BreadcrumbItem>
					<BreadcrumbLink asChild>
						<Link
							href={baseUrl}
							className="flex items-center gap-1"
						>
							<Home className="h-4 w-4" />
							<span className="hidden sm:inline">
								{projectName || "Project"}
							</span>
						</Link>
					</BreadcrumbLink>
				</BreadcrumbItem>

				<BreadcrumbSeparator>
					<ChevronRight className="h-4 w-4" />
				</BreadcrumbSeparator>

				{/* Drawings Root */}
				<BreadcrumbItem>
					<BreadcrumbLink asChild>
						<Link href={`${baseUrl}/drawings`}>Drawings</Link>
					</BreadcrumbLink>
				</BreadcrumbItem>

				{/* Parent drawings in path */}
				{breadcrumbPath.map((parent) => (
					<div key={parent.id} className="flex items-center">
						<BreadcrumbSeparator>
							<ChevronRight className="h-4 w-4" />
						</BreadcrumbSeparator>
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link
									href={`${baseUrl}/drawings/${parent.id}`}
									className="max-w-[150px] truncate"
									title={`${parent.number} - ${parent.title}`}
								>
									{parent.number}
								</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
					</div>
				))}

				{/* Current drawing */}
				{drawing && (
					<>
						<BreadcrumbSeparator>
							<ChevronRight className="h-4 w-4" />
						</BreadcrumbSeparator>
						<BreadcrumbItem>
							<BreadcrumbPage className="font-medium">
								<span className="max-w-[200px] truncate inline-block">
									{drawing.number}
								</span>
								{drawing.revision && (
									<span className="text-muted-foreground ml-1">
										(Rev. {drawing.revision})
									</span>
								)}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</>
				)}
			</BreadcrumbList>
		</Breadcrumb>
	);
}

// Mobile-optimized breadcrumbs that show only current level
export function DrawingBreadcrumbsMobile({
	projectId: _projectId,
	drawing,
	onBack,
	className,
}: {
	projectId: string;
	drawing?: Drawing;
	onBack?: () => void;
	className?: string;
}) {
	// const _baseUrl = `/app/pipetrak/${projectId}`;

	return (
		<div className={cn("flex items-center gap-2 py-2", className)}>
			{onBack && (
				<button
					type="button"
					onClick={onBack}
					className="p-1 rounded-md hover:bg-accent"
					aria-label="Go back"
				>
					<ChevronRight className="h-5 w-5 rotate-180" />
				</button>
			)}

			{drawing ? (
				<div className="flex-1 min-w-0">
					<div className="font-medium text-sm truncate">
						{drawing.number}
					</div>
					<div className="text-xs text-muted-foreground truncate">
						{drawing.title}
					</div>
				</div>
			) : (
				<div className="font-medium text-sm">All Drawings</div>
			)}
		</div>
	);
}
