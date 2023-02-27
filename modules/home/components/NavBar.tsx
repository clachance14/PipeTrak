import { Button, ColorModeToggle, Logo } from '@common/client';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';

export function NavBar() {
  const { t } = useTranslation('common');
  const { data: session } = useSession();

  return (
    <nav className="bg-white py-4 dark:bg-zinc-900 dark:text-white">
      <div className="container flex items-center justify-between">
        <Logo />

        <div className="flex items-center justify-end gap-4">
          <a href="#" className="block px-3 py-2">
            Home
          </a>

          <a href="#features" className="block px-3 py-2">
            Features
          </a>

          <a href="#pricing" className="block px-3 py-2">
            Pricing
          </a>

          <Link href="/blog" className="block px-3 py-2">
            Blog
          </Link>

          <div className="flex items-center justify-end gap-3">
            <ColorModeToggle />

            <Button as={Link} href={session ? '/dashboard' : '/auth/signin'} intent="primary-ghost" size="small">
              {t(session ? 'menu.dashboard' : 'menu.signIn')}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
