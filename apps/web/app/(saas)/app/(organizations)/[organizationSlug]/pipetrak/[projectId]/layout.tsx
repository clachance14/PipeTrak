import { ProjectSwitcher } from "@pipetrak/projects/ProjectSwitcher";
import { TabGroup } from "@saas/shared/components/TabGroup";
import type { PropsWithChildren } from "react";

interface PipeTrakProjectLayoutProps extends PropsWithChildren {
	params: Promise<{
		organizationSlug: string;
		projectId: string;
	}>;
}

export default async function PipeTrakProjectLayout({
	children,
	params,
}: PipeTrakProjectLayoutProps) {
	console.log("[PipeTrak Layout] Rendering layout...");
	console.log("[PipeTrak Layout] Raw params:", params);
	const { organizationSlug, projectId } = await params;
	console.log("[PipeTrak Layout] Organization Slug:", organizationSlug);
	console.log("[PipeTrak Layout] Project ID:", projectId);

	// Core tabs for mobile - Dashboard, Components, QC
	const mobileItems = [
		{
			label: "Dashboard",
			href: `/app/${organizationSlug}/pipetrak/${projectId}/dashboard`,
			segment: "dashboard",
		},
		{
			label: "Components",
			href: `/app/${organizationSlug}/pipetrak/${projectId}/components`,
			segment: "components",
		},
		{
			label: "QC",
			href: `/app/${organizationSlug}/pipetrak/${projectId}/qc`,
			segment: "qc",
		},
	];

	// Desktop includes Import and Reports
	const desktopItems = [
		...mobileItems,
		{
			label: "Import",
			href: `/app/${organizationSlug}/pipetrak/${projectId}/import`,
			segment: "import",
		},
		{
			label: "Reports",
			href: `/app/${organizationSlug}/pipetrak/${projectId}/reports`,
			segment: "reports",
		},
	];

	return (
		<div className="space-y-4">
			{/* Project Switcher */}
			<div className="mb-4 pt-4 px-6 lg:px-8">
				<ProjectSwitcher />
			</div>

			{/* Mobile and Tablet tabs - hide Import and Reports */}
			<div className="block lg:hidden px-6 lg:px-8">
				<TabGroup items={mobileItems} />
			</div>

			{/* Desktop only tabs - show all (1024px and up) */}
			<div className="hidden lg:block px-6 lg:px-8">
				<TabGroup items={desktopItems} />
			</div>

			{children}
		</div>
	);
}
