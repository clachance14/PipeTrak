import Link from 'next/link';
import { Button, Logo } from 'ui';

export default function NavBar({
  labels,
  menuItems,
}: {
  labels: {
    signIn: string;
  };
  menuItems: Array<{
    label: string;
    href: string;
  }>;
}) {
  return (
    <nav className="bg-white py-4 dark:bg-zinc-900 dark:text-white">
      <div className="container flex items-center justify-between">
        <Link href="/" className="block">
          <Logo />
        </Link>

        <div className="flex items-center justify-end">
          {menuItems.map((menuItem) => (
            <Link key={menuItem.href} href={menuItem.href} className="block px-3 py-2">
              {menuItem.label}
            </Link>
          ))}

          <div className="ml-3 flex items-center justify-end gap-3">
            {/* <ColorModeToggle /> */}

            <Button as={Link} href="/signin" intent="primary-ghost" size="small">
              {labels.signIn}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
