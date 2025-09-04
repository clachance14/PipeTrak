"use client";

import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@ui/components/hover-card";
import { Badge } from "@ui/components/badge";
import { Separator } from "@ui/components/separator";
import { Button } from "@ui/components/button";
import {
	FileText,
	Package,
	Layers,
	Calendar,
	Clock,
	Edit,
} from "lucide-react";
import { cn } from "@ui/lib";
import type { ComponentWithMilestones } from "../../types";

interface ComponentHoverCardProps {
	component: ComponentWithMilestones;
	children: React.ReactNode;
	onEdit?: () => void;
	onViewHistory?: () => void;
	onAddNote?: () => void;
	className?: string;
}

export function ComponentHoverCard({
	component,
	children,
	onEdit,
	onViewHistory,
	onAddNote,
	className,
}: ComponentHoverCardProps) {
	const hasQuickActions = onEdit || onViewHistory || onAddNote;

	return (
		<HoverCard openDelay={400} closeDelay={100}>
			<HoverCardTrigger asChild>{children}</HoverCardTrigger>
			<HoverCardContent
				className={cn("w-96 p-4", className)}
				side="right"
				align="start"
				sideOffset={10}
			>
				{/* Header */}
				<div className="space-y-2">
					<div className="flex items-start justify-between">
						<div>
							<h4 className="font-mono font-bold text-sm">
								{component.componentId}
							</h4>
							{component.displayId &&
								component.displayId !==
									component.componentId && (
									<p className="text-xs text-muted-foreground">
										{component.displayId}
									</p>
								)}
						</div>
						<Badge
							status={
								component.status === "COMPLETED" ? "success" : "info"
							}
						>
							{component.status}
						</Badge>
					</div>

					{component.description && (
						<p className="text-sm text-muted-foreground">
							{component.description}
						</p>
					)}
				</div>

				<Separator className="my-3" />

				{/* Technical Specifications */}
				<div className="space-y-3">
					<h5 className="text-xs font-semibold uppercase text-muted-foreground">
						Technical Specifications
					</h5>

					<div className="grid grid-cols-2 gap-3 text-sm">
						{component.type && (
							<div className="flex items-center gap-2">
								<Package className="h-4 w-4 text-muted-foreground" />
								<div>
									<p className="text-xs text-muted-foreground">
										Type
									</p>
									<p className="font-medium">
										{component.type}
									</p>
								</div>
							</div>
						)}

						{component.size && (
							<div className="flex items-center gap-2">
								<Package className="h-4 w-4 text-muted-foreground" />
								<div>
									<p className="text-xs text-muted-foreground">
										Size
									</p>
									<p className="font-medium">
										{component.size}
									</p>
								</div>
							</div>
						)}

						{component.material && (
							<div className="flex items-center gap-2">
								<Layers className="h-4 w-4 text-muted-foreground" />
								<div>
									<p className="text-xs text-muted-foreground">
										Material
									</p>
									<p className="font-medium">
										{component.material}
									</p>
								</div>
							</div>
						)}

						{component.spec && (
							<div className="flex items-center gap-2">
								<FileText className="h-4 w-4 text-muted-foreground" />
								<div>
									<p className="text-xs text-muted-foreground">
										Spec
									</p>
									<p className="font-medium">
										{component.spec}
									</p>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Installation Context */}
				{(component.drawingNumber || component.testPackage) && (
					<>
						<Separator className="my-3" />
						<div className="space-y-3">
							<h5 className="text-xs font-semibold uppercase text-muted-foreground">
								Installation Context
							</h5>

							<div className="space-y-2 text-sm">
								{component.drawingNumber && (
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">
											Drawing:
										</span>
										<span className="font-medium">
											{component.drawingNumber}
										</span>
									</div>
								)}

								{component.testPackage && (
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">
											Test Package:
										</span>
										<Badge status="info">
											<Package className="h-3 w-3 mr-1" />
											{component.testPackage}
										</Badge>
									</div>
								)}

								{component.area && (
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">
											Area:
										</span>
										<span className="font-medium">
											{component.area}
										</span>
									</div>
								)}

								{component.system && (
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">
											System:
										</span>
										<span className="font-medium">
											{component.system}
										</span>
									</div>
								)}
							</div>
						</div>
					</>
				)}

				{/* Quantity Information */}
				{(component.totalQuantity || component.totalLength) && (
					<>
						<Separator className="my-3" />
						<div className="space-y-2">
							<h5 className="text-xs font-semibold uppercase text-muted-foreground">
								Quantities
							</h5>

							<div className="grid grid-cols-2 gap-3 text-sm">
								{component.totalQuantity && (
									<div>
										<p className="text-xs text-muted-foreground">
											Total Quantity
										</p>
										<p className="font-medium">
											{component.totalQuantity}{" "}
											{component.quantityUnit || "units"}
										</p>
									</div>
								)}

								{component.totalLength && (
									<div>
										<p className="text-xs text-muted-foreground">
											Total Length
										</p>
										<p className="font-medium">
											{component.totalLength}{" "}
											{component.lengthUnit || "ft"}
										</p>
									</div>
								)}
							</div>
						</div>
					</>
				)}

				{/* Dates */}
				{(component.createdAt || component.installationDate) && (
					<>
						<Separator className="my-3" />
						<div className="flex items-center gap-4 text-xs text-muted-foreground">
							<div className="flex items-center gap-1">
								<Calendar className="h-3 w-3" />
								<span>
									Created:{" "}
									{new Date(
										component.createdAt,
									).toLocaleDateString()}
								</span>
							</div>

							{component.installationDate && (
								<div className="flex items-center gap-1">
									<Calendar className="h-3 w-3" />
									<span>
										Installed:{" "}
										{new Date(
											component.installationDate,
										).toLocaleDateString()}
									</span>
								</div>
							)}
						</div>
					</>
				)}

				{/* Quick Actions */}
				{hasQuickActions && (
					<>
						<Separator className="my-3" />
						<div className="flex gap-2">
							{onEdit && (
								<Button
									size="sm"
									variant="outline"
									onClick={onEdit}
									className="flex-1"
								>
									<Edit className="h-3 w-3 mr-1" />
									Edit
								</Button>
							)}

							{onViewHistory && (
								<Button
									size="sm"
									variant="outline"
									onClick={onViewHistory}
									className="flex-1"
								>
									<Clock className="h-3 w-3 mr-1" />
									History
								</Button>
							)}

							{onAddNote && (
								<Button
									size="sm"
									variant="outline"
									onClick={onAddNote}
									className="flex-1"
								>
									<Edit className="h-3 w-3 mr-1" />
									Note
								</Button>
							)}
						</div>
					</>
				)}

				{/* Instance Information */}
				{component.instanceNumber &&
					component.totalInstancesOnDrawing && (
						<>
							<Separator className="my-3" />
							<div className="flex items-center justify-between text-xs">
								<span className="text-muted-foreground">
									Instance {component.instanceNumber} of{" "}
									{component.totalInstancesOnDrawing}
								</span>
								<Badge status="info" className="text-xs">
									Drawing Instance
								</Badge>
							</div>
						</>
					)}
			</HoverCardContent>
		</HoverCard>
	);
}
