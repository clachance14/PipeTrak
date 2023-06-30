"use client";

import { ColorModeToggle, LocaleSwitch } from "common/components";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next-intl/client";
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
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("common");

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
            <LocaleSwitch
              localeOptions={[
                {
                  value: "en",
                  label: t("locales.en"),
                },
                {
                  value: "de",
                  label: t("locales.de"),
                },
              ]}
              currentLocale={locale}
              onChange={(locale) => router.replace(`/${locale}/${pathname}`)}
            />

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
