'use client';

import Logo from '@common/components/Logo';
import Button from '@common/components/primitives/Button';
import UserMenu from '@common/components/UserMenu';
import { isSidebarExpanded } from '@common/state';
import WorkspacesSelect from '@workspaces/components/WorkspaceSelect';
import { useSetAtom } from 'jotai';
import { User } from 'next-auth';
import Link from 'next-intl/link';
import { useSelectedLayoutSegment } from 'next/navigation';
import { PropsWithChildren, useCallback } from 'react';
import { FiArchive, FiGrid, FiSettings, FiX } from 'react-icons/fi';

const menuItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    segment: null,
    icon: FiGrid,
  },
  {
    label: 'Projects',
    href: '/dashboard/projects',
    segment: 'projects',
    icon: FiArchive,
  },
  {
    label: 'Settings',
    href: '/dashboard/settings/account',
    segment: 'settings',
    icon: FiSettings,
  },
];

export default function AppSidebar({
  isExpanded,
  onClose,
  user,
  workspaces,
  selectedWorkspace,
}: PropsWithChildren<{
  isExpanded?: boolean;
  onClose?: () => void;
  user: User;
  workspaces: { id: string; name: string }[];
  selectedWorkspace: string;
}>) {
  const selectedSegment = useSelectedLayoutSegment();
  const positionClass = isExpanded ? 'left-0' : '-left-[280px] lg:left-0';
  const setSidebarExpanded = useSetAtom(isSidebarExpanded);

  const isActiveMenuItem = useCallback((segment: string | null) => selectedSegment === segment, [selectedSegment]);

  return (
    <nav
      className={`fixed top-0 ${positionClass} z-40 h-screen w-[280px] border-r bg-white transition-all duration-300 ease-in-out dark:border-zinc-800 dark:bg-zinc-900`}
    >
      <div className="flex justify-end px-6 py-2 lg:hidden">
        <Button intent="primary-outline" size="small" onClick={() => setSidebarExpanded(false)}>
          <span className="sr-only">Toggle sidebar</span>
          <FiX />
        </Button>
      </div>
      <div className="p-6">
        <Logo />
      </div>

      <div className="px-6">
        <WorkspacesSelect workspaces={workspaces} selectedWorkspace={selectedWorkspace} />
      </div>

      <ul className="mt-6 list-none px-6">
        {menuItems.map((menuItem) => (
          <li key={menuItem.href}>
            <Link
              href={menuItem.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 hover:text-black hover:no-underline focus:no-underline dark:hover:text-white ${
                isActiveMenuItem(menuItem.segment)
                  ? 'bg-zinc-100 font-bold text-black dark:bg-zinc-800 dark:text-white'
                  : ''
              }`}
            >
              <menuItem.icon className="scale-125 transform" />
              <span>{menuItem.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="absolute bottom-0 w-full p-6">
        <UserMenu user={user} />
        {/* <ColorModeToggle /> */}
      </div>
    </nav>
  );
}
