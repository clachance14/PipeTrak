import { ColorModeToggle } from "common/components/ColorModeToggle";
import { useLocale } from "next-intl";
import Link from "next-intl/link";
import { Button, Logo } from "ui";

export function NavBar({
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
  const locale = useLocale();
  return (
    <nav className="absolute top-0 left-0 w-full bg-transparent py-4 dark:text-white">
      <div className="container flex items-center justify-between">
        <Link href="/" className="block hover:no-underline active:no-underline">
          <Logo />
        </Link>

        <div className="flex items-center justify-end">
          {menuItems.map((menuItem) => (
            <Link
              key={menuItem.href}
              href={menuItem.href}
              className="block px-3 py-2"
            >
              {menuItem.label}
            </Link>
          ))}

          <div className="ml-3 flex items-center justify-end gap-3">
            <ColorModeToggle />

            <Button
              as="a"
              href={`${process.env.NEXT_PUBLIC_SAAS_BASE_URL}/${locale}/auth/signin`}
              intent="primary-ghost"
              size="small"
            >
              {labels.signIn}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
