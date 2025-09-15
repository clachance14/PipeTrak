"use client";

import { useState } from "react";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { cn } from "@ui/lib";
import { BarChart3, Upload, UserPlus } from "lucide-react";
import Link from "next/link";
import { AddWelderModal } from "./AddWelderModal";

interface QCQuickActionsProps {
	organizationSlug: string;
	projectId: string;
	className?: string;
}

const actions = [
	{
		id: "add-welder",
		title: "Add Welder",
		description:
			"Register a new welder for this project with qualifications",
		icon: UserPlus,
		buttonText: "Add Welder",
		action: "modal", // Will trigger modal
	},
	{
		id: "import-welds",
		title: "Import Field Welds",
		description: "Bulk import field weld data from Excel spreadsheets",
		icon: Upload,
		buttonText: "Import Welds",
		action: "link",
		href: "/qc/import",
	},
	{
		id: "generate-report",
		title: "Generate Report",
		description: "Create QC status reports and compliance summaries",
		icon: BarChart3,
		buttonText: "Generate Report",
		action: "modal", // Will trigger modal
	},
];

export function QCQuickActions({
	organizationSlug,
	projectId,
	className,
}: QCQuickActionsProps) {
	const [isAddWelderModalOpen, setIsAddWelderModalOpen] = useState(false);

	const handleActionClick = (actionId: string) => {
		switch (actionId) {
			case "add-welder":
				setIsAddWelderModalOpen(true);
				break;
			case "generate-report":
				// TODO: Implement generate report functionality
				console.log("Generate report clicked");
				break;
			default:
				break;
		}
	};

	return (
		<div className={cn("space-y-4", className)}>
			<h2 className="text-lg font-semibold">Quick Actions</h2>
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{actions.map((action) => {
					const Icon = action.icon;

					return (
						<Card
							key={action.id}
							className="transition-all duration-200 hover:shadow-md hover:border-primary/50 group"
						>
							<CardHeader className="pb-4">
								<div className="flex items-center gap-3 mb-3">
									<div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
										<Icon className="h-5 w-5 text-primary" />
									</div>
									<CardTitle className="text-base">
										{action.title}
									</CardTitle>
								</div>
								<p className="text-sm text-muted-foreground leading-relaxed">
									{action.description}
								</p>
							</CardHeader>
							<CardContent className="pt-0">
								{action.action === "link" && action.href ? (
									<Link
										href={`/app/${organizationSlug}/pipetrak/${projectId}${action.href}`}
									>
										<Button className="w-full">
											{action.buttonText}
										</Button>
									</Link>
								) : (
									<Button
										className="w-full"
										onClick={() => handleActionClick(action.id)}
										disabled={action.id === "generate-report"} // Keep generate report disabled for now
									>
										{action.buttonText}
									</Button>
								)}
							</CardContent>
						</Card>
					);
				})}
			</div>

			{/* Add Welder Modal */}
			<AddWelderModal
				open={isAddWelderModalOpen}
				onOpenChange={setIsAddWelderModalOpen}
				projectId={projectId}
			/>
		</div>
	);
}
