"use client";

import { useState } from "react";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ui/components/popover";
import { TooltipProvider } from "@ui/components/tooltip";
import {
	Zap,
	FlameKindling,
	Check,
	XCircle,
	Clock,
	AlertTriangle,
	ExternalLink,
	User,
	FileText,
} from "lucide-react";
import { format } from "date-fns";
import type { ComponentWithMilestones } from "../../types";

interface FieldWeldQuickViewProps {
	component: ComponentWithMilestones;
	children: React.ReactNode;
	organizationSlug: string;
	projectId: string;
}

interface FieldWeldData {
	id: string;
	weldIdNumber: string;
	dateWelded: string;
	weldSize: string;
	schedule: string;
	ndeResult?: string;
	pwhtRequired: boolean;
	datePwht?: string;
	comments?: string;
	welder?: {
		id: string;
		stencil: string;
		name: string;
	};
	weldType: {
		code: string;
		description: string;
	};
}

export function FieldWeldQuickView({
	component,
	children,
	organizationSlug,
	projectId,
}: FieldWeldQuickViewProps) {
	const [open, setOpen] = useState(false);

	// Only show for field welds
	if (
		component.type !== "FIELD_WELD" ||
		!component.fieldWelds ||
		component.fieldWelds.length === 0
	) {
		return <>{children}</>;
	}

	const fieldWeld = component.fieldWelds[0] as FieldWeldData;

	const getNdeResultBadge = (result?: string) => {
		if (!result) {
			return (
				<Badge status="info" className="gap-1">
					<Clock className="h-3 w-3" />
					Pending
				</Badge>
			);
		}

		switch (result.toLowerCase()) {
			case "accept":
				return (
					<Badge
						status="info"
						className="gap-1 bg-green-100 text-green-800 hover:bg-green-200"
					>
						<Check className="h-3 w-3" />
						Accept
					</Badge>
				);
			case "reject":
				return (
					<Badge status="error" className="gap-1">
						<XCircle className="h-3 w-3" />
						Reject
					</Badge>
				);
			case "repair":
				return (
					<Badge
						status="info"
						className="gap-1 bg-orange-100 text-orange-800"
					>
						<AlertTriangle className="h-3 w-3" />
						Repair
					</Badge>
				);
			default:
				return (
					<Badge status="info" className="gap-1">
						<Clock className="h-3 w-3" />
						{result}
					</Badge>
				);
		}
	};

	const getPwhtBadge = (required: boolean, date?: string) => {
		if (!required) {
			return (
				<Badge status="info" className="text-xs">
					Not Required
				</Badge>
			);
		}

		if (date) {
			return (
				<Badge
					status="info"
					className="gap-1 bg-blue-100 text-blue-800"
				>
					<FlameKindling className="h-3 w-3" />
					Complete
				</Badge>
			);
		}

		return (
			<Badge
				status="info"
				className="gap-1 bg-yellow-100 text-yellow-800"
			>
				<FlameKindling className="h-3 w-3" />
				Required
			</Badge>
		);
	};

	return (
		<TooltipProvider>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<div className="cursor-pointer">{children}</div>
				</PopoverTrigger>
				<PopoverContent className="w-80" align="start">
					<Card className="border-0 shadow-none">
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between">
								<CardTitle className="text-lg flex items-center gap-2">
									<Zap className="h-5 w-5 text-orange-500" />
									Field Weld QC
								</CardTitle>
								<Button
									variant="ghost"
									size="sm"
									className="h-8 w-8 p-0"
									onClick={() => {
										window.open(
											`/app/${organizationSlug}/pipetrak/${projectId}/qc/field-welds`,
											"_blank",
										);
									}}
								>
									<ExternalLink className="h-4 w-4" />
								</Button>
							</div>
							<div className="text-sm text-muted-foreground">
								Weld ID:{" "}
								<span className="font-mono font-medium">
									{fieldWeld.weldIdNumber}
								</span>
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Weld Details */}
							<div className="grid grid-cols-2 gap-2 text-sm">
								<div>
									<span className="text-muted-foreground">
										Size:
									</span>
									<div className="font-medium">
										{fieldWeld.weldSize}
									</div>
								</div>
								<div>
									<span className="text-muted-foreground">
										Schedule:
									</span>
									<div className="font-medium">
										{fieldWeld.schedule}
									</div>
								</div>
								<div>
									<span className="text-muted-foreground">
										Type:
									</span>
									<div className="font-medium">
										{fieldWeld.weldType.code}
									</div>
								</div>
								<div>
									<span className="text-muted-foreground">
										Date:
									</span>
									<div className="font-medium">
										{format(
											new Date(fieldWeld.dateWelded),
											"MMM dd, yyyy",
										)}
									</div>
								</div>
							</div>

							{/* QC Status */}
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<span className="text-sm text-muted-foreground">
										NDE Result:
									</span>
									{getNdeResultBadge(fieldWeld.ndeResult)}
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm text-muted-foreground">
										PWHT:
									</span>
									{getPwhtBadge(
										fieldWeld.pwhtRequired,
										fieldWeld.datePwht,
									)}
								</div>
							</div>

							{/* Welder Info */}
							{fieldWeld.welder && (
								<div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
									<User className="h-4 w-4 text-muted-foreground" />
									<div className="text-sm">
										<div className="font-medium">
											{fieldWeld.welder.stencil}
										</div>
										<div className="text-muted-foreground">
											{fieldWeld.welder.name}
										</div>
									</div>
								</div>
							)}

							{/* Comments */}
							{fieldWeld.comments && (
								<div className="space-y-1">
									<div className="flex items-center gap-1 text-sm text-muted-foreground">
										<FileText className="h-3 w-3" />
										Comments
									</div>
									<div className="text-sm bg-muted/50 p-2 rounded-md">
										{fieldWeld.comments}
									</div>
								</div>
							)}

							{/* Actions */}
							<div className="pt-2 border-t">
								<Button
									size="sm"
									className="w-full"
									onClick={() => {
										window.open(
											`/app/${organizationSlug}/pipetrak/${projectId}/qc/field-welds`,
											"_blank",
										);
										setOpen(false);
									}}
								>
									<ExternalLink className="h-4 w-4 mr-2" />
									View in QC Module
								</Button>
							</div>
						</CardContent>
					</Card>
				</PopoverContent>
			</Popover>
		</TooltipProvider>
	);
}
