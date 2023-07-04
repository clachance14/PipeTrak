"use client";

import { sidebarExpanded as sidebarExpandedAtom } from "@state/ui";
import { useAtom } from "jotai";
import { Button, Icon } from "ui";

export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const [sidebarExpanded, setSidebarExpanded] = useAtom(sidebarExpandedAtom);

  return (
    <div className="container py-6">
      <div className="">
        <div className="flex items-start justify-between ">
          <div>
            <Button
              intent="primary-outline"
              size="small"
              className="mb-4 px-4 lg:hidden"
              onClick={() => setSidebarExpanded(true)}
            >
              <span className="sr-only">Toggle sidebar</span>
              <Icon.menu className="h-4 w-4" />
            </Button>

            <div className="">
              <h2 className="text-2xl font-bold lg:text-3xl">{title}</h2>
              <p className="mt-1 opacity-50">{subtitle}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
