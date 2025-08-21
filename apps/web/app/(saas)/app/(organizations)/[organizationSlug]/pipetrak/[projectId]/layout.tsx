import { TabGroup } from "@saas/shared/components/TabGroup";
import { ProjectSwitcher } from "@pipetrak/projects/ProjectSwitcher";
import type { PropsWithChildren } from "react";

interface PipeTrakProjectLayoutProps extends PropsWithChildren {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function PipeTrakProjectLayout({ 
  children,
  params 
}: PipeTrakProjectLayoutProps) {
  console.log('[PipeTrak Layout] Rendering layout...');
  console.log('[PipeTrak Layout] Raw params:', params);
  const { projectId } = await params;
  console.log('[PipeTrak Layout] Project ID:', projectId);
  
  // Core tabs for mobile - Dashboard, Components, Drawings, QC
  const mobileItems = [
    {
      label: "Dashboard",
      href: `/app/pipetrak/${projectId}/dashboard`,
      segment: "dashboard",
    },
    {
      label: "Components",
      href: `/app/pipetrak/${projectId}/components`,
      segment: "components",
    },
    {
      label: "Drawings",
      href: `/app/pipetrak/${projectId}/drawings`,
      segment: "drawings",
    },
    {
      label: "QC",
      href: `/app/pipetrak/${projectId}/qc`,
      segment: "qc",
    },
  ];
  
  // Desktop includes Import and Reports
  const desktopItems = [
    ...mobileItems,
    {
      label: "Import",
      href: `/app/pipetrak/${projectId}/import`,
      segment: "import",
    },
    {
      label: "Reports",
      href: `/app/pipetrak/${projectId}/reports`,
      segment: "reports",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Project Switcher */}
      <div className="mb-4">
        <ProjectSwitcher />
      </div>
      
      {/* Mobile and Tablet tabs - hide Import and Reports */}
      <div className="block lg:hidden">
        <TabGroup items={mobileItems} />
      </div>
      
      {/* Desktop only tabs - show all (1024px and up) */}
      <div className="hidden lg:block">
        <TabGroup items={desktopItems} />
      </div>
      
      {children}
    </div>
  );
}