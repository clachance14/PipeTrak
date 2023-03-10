'use client';

import Button from '@common/components/primitives/Button';
import { User } from 'next-auth';
import { useSelectedLayoutSegment } from 'next/navigation';
import { PropsWithChildren, useEffect, useState } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';
import AppSidebar from './AppSidebar';

export default function AppLayout({
  children,
  user,
  workspaces,
  selectedWorkspace,
}: PropsWithChildren<{ user: User; workspaces: { id: string; name: string }[]; selectedWorkspace: string }>) {
  const selectedSegment = useSelectedLayoutSegment();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  useEffect(() => {
    const handleResize = () => window.innerWidth <= 1024 && setSidebarExpanded(false);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => setSidebarExpanded(false), [selectedSegment]);

  return (
    <div className="flex">
      <AppSidebar
        isExpanded={sidebarExpanded}
        workspaces={workspaces}
        selectedWorkspace={selectedWorkspace}
        user={user}
      />
      <main className="min-h-screen flex-1 bg-white transition-all duration-300 ease-in-out dark:bg-zinc-900 lg:pl-[280px]">
        <div className="flex h-16 w-full justify-between border-b py-3 px-6 dark:border-zinc-800 lg:hidden">
          <Button
            intent="primary-outline"
            size="small"
            className="px-4 lg:hidden"
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
          >
            <span className="sr-only">Toggle sidebar</span>
            {sidebarExpanded ? <FiX /> : <FiMenu />}
          </Button>
        </div>

        <div className="container py-6">{children}</div>
      </main>
    </div>
  );
}
