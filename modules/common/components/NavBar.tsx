import ColorModeToggle from '@common/components/ColorModeToggle';
import UserButton from '@common/components/UserButton';
import { Link, useTranslations } from 'next-intl';
import Logo from './Logo';

export default function NavBar() {
  const t = useTranslations('common');
  // const session = await getServerSession(getAuthOptions())
  const session = null;

  return (
    <nav className="bg-white py-4 dark:bg-zinc-900 dark:text-white">
      <div className="container flex items-center justify-between">
        <Logo />

        <div className="flex items-center justify-end">
          <Link href="/#" className="block px-3 py-2">
            Home
          </Link>

          <Link href="/#features" className="block px-3 py-2">
            Features
          </Link>

          <Link href="/#pricing" className="block px-3 py-2">
            Pricing
          </Link>

          <Link href="/blog" className="block px-3 py-2">
            Blog
          </Link>

          <div className="ml-3 flex items-center justify-end gap-3">
            <ColorModeToggle />

            <UserButton labels={{ dashboard: t('menu.dashboard'), signIn: t('menu.signIn') }} />
          </div>
        </div>
      </div>
    </nav>
  );
}
