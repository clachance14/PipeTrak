import { PropsWithChildren } from 'react';
import { FiX } from 'react-icons/fi';
import { Button } from './Button';
import { ColorModeToggle } from './ColorModeToggle';
import { Logo } from './Logo';

export function AppSidebar({ isExpanded, onClose }: PropsWithChildren<{ isExpanded?: boolean; onClose: () => void }>) {
  const positionClass = isExpanded ? 'left-0' : '-left-[300px] lg:left-0';

  return (
    <nav
      className={`fixed top-0 ${positionClass} z-40 h-screen w-[300px] border-r bg-white transition-all duration-300 ease-in-out dark:border-zinc-800 dark:bg-zinc-900`}
    >
      <div className="flex justify-between px-6 py-4">
        <Logo />

        <Button intent="primary-outline" size="small" className="lg:hidden" onClick={() => onClose()}>
          <span className="sr-only">Toggle sidebar</span>
          <FiX />
        </Button>
      </div>

      <div className="absolute bottom-0 p-6">
        <ColorModeToggle />
      </div>
    </nav>
  );
}
