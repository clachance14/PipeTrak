'use client';

import ColorModeToggle from '@common/components/ColorModeToggle';
import Button from '@common/components/primitives/Button';
import { isSidebarExpanded } from '@common/state';
import { useAtom } from 'jotai';
import { FiMenu } from 'react-icons/fi';

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const [sidebarExpanded, setSidebarExpanded] = useAtom(isSidebarExpanded);

  return (
    <div className="w-full border-b  dark:border-zinc-800">
      <div className="container flex items-start justify-between py-6">
        <div>
          <Button
            intent="primary-outline"
            size="small"
            className="mb-4 px-4 lg:hidden"
            onClick={() => setSidebarExpanded(true)}
          >
            <span className="sr-only">Toggle sidebar</span>
            <FiMenu />
          </Button>

          <div className="">
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="mt-1 opacity-75">{subtitle}</p>
          </div>
        </div>

        <div className="flex">
          <ColorModeToggle />
        </div>
      </div>
    </div>
  );
}
