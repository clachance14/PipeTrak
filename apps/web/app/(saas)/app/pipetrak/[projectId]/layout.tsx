import { TabGroup } from "@saas/shared/components/TabGroup";
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
  const { projectId } = await params;
  
  const items = [
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
    <div className="space-y-6">
      <TabGroup items={items} />
      {children}
    </div>
  );
}