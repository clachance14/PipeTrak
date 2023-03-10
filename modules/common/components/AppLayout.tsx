'use client';

import { User } from 'next-auth';
import { useSelectedLayoutSegment } from 'next/navigation';
import { PropsWithChildren, useEffect, useState } from 'react';
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
        onClose={() => setSidebarExpanded(false)}
      />
      <main className="min-h-screen flex-1 bg-white transition-all duration-300 ease-in-out dark:bg-zinc-900 lg:pl-[280px]">
        {children}
      </main>
    </div>
  );
}
