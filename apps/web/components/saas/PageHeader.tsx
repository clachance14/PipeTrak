"use client";

import { Button, Icon } from "@components";
import { sidebarExpanded as sidebarExpandedAtom } from "@lib/state/dashboard";
import { useAtom } from "jotai";

export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const [sidebarExpanded, setSidebarExpanded] = useAtom(sidebarExpandedAtom);

  return (
    <div className="container">
      <div className="">
        <div className="flex items-start justify-between ">
          <div>
            <Button
              variant="outline"
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
