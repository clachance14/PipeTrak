'use client';

import ColorModeToggle from '@common/components/ColorModeToggle';
import Button from '@common/components/primitives/Button';
import { FiMenu } from 'react-icons/fi';

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="w-full border-b py-4 px-6 dark:border-zinc-800">
      <div className="container flex items-start justify-between">
        <div>
          <Button
            intent="primary-outline"
            size="small"
            className="px-4 lg:hidden"
            // onClick={() => setSidebarExpanded(!sidebarExpanded)}
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
