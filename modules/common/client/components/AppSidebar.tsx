import { UserMenu } from '@common/client/components/UserMenu';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { PropsWithChildren, useCallback } from 'react';
import { FiGrid, FiUsers, FiX } from 'react-icons/fi';
import { Button } from './Button';
import { Logo } from './Logo';

const menuItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: FiGrid,
  },
  {
    label: 'Clients',
    href: '/clients',
    icon: FiUsers,
  },
];

export function AppSidebar({ isExpanded, onClose }: PropsWithChildren<{ isExpanded?: boolean; onClose: () => void }>) {
  const positionClass = isExpanded ? 'left-0' : '-left-[280px] lg:left-0';
  const router = useRouter();

  const isActiveMenuItem = useCallback((href: string) => router.asPath.startsWith(href), [router.asPath]);

  return (
    <nav
      className={`fixed top-0 ${positionClass} z-40 h-screen w-[280px] border-r bg-white transition-all duration-300 ease-in-out dark:border-zinc-800 dark:bg-zinc-900`}
    >
      <div className="flex justify-between p-6">
        <Logo />

        <Button intent="primary-outline" size="small" className="lg:hidden" onClick={() => onClose()}>
          <span className="sr-only">Toggle sidebar</span>
          <FiX />
        </Button>
      </div>

      <ul className="mt-6 list-none px-4">
        {menuItems.map((menuItem) => (
          <li key={menuItem.href}>
            <Link
              href={menuItem.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 hover:text-black hover:no-underline dark:hover:text-white ${
                isActiveMenuItem(menuItem.href)
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
        <UserMenu />
        {/* <ColorModeToggle /> */}
      </div>
    </nav>
  );
}
