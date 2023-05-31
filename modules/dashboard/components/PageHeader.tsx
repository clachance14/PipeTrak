'use client';

import ColorModeToggle from '@common/components/ColorModeToggle';
import { isSidebarExpanded } from '@common/state';
import { Button, Icon } from '@ui/components';
import { useAtom } from 'jotai';

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const [sidebarExpanded, setSidebarExpanded] = useAtom(isSidebarExpanded);

  return (
    <div className="w-full border-b border-zinc-100 dark:border-zinc-800">
      <div className="container flex items-start justify-between py-6">
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

        <div className="flex">
          <ColorModeToggle />
        </div>
      </div>
    </div>
  );
}
