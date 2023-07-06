"use client";

import { appConfig } from "@config";
import { ColorModeToggle, LocaleSwitch } from "common/components";
import { useLocale } from "next-intl";
import Link from "next-intl/link";
import { useEffect, useState } from "react";
import { Button, Logo } from "ui";
import { env } from "../env.mjs";

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
  const [isTop, setIsTop] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsTop(false);
      } else {
        setIsTop(true);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  });

  return (
    <nav
      className={`fixed left-0 top-0 z-20 w-full bg-white/80 backdrop-blur-lg dark:bg-zinc-900/80 dark:text-white`}
    >
      <div className="inset-0 bottom-auto bg-blue-500/10 px-8 py-4 text-center text-sm text-blue-950/75 dark:text-blue-100/75">
        <strong>New:</strong> In this banner you can show your awesome new
        feature
      </div>
      <div className="flex items-center justify-between gap-6 px-12 py-8">
        <div className="flex justify-start">
          <Link
            href="/"
            className="block hover:no-underline active:no-underline"
          >
            <Logo />
          </Link>
        </div>

        <div className="flex items-center justify-end">
          {menuItems.map((menuItem) => (
            <Link
              key={menuItem.href}
              href={menuItem.href}
              className="block px-3 py-2 text-lg"
            >
              {menuItem.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3">
          <ColorModeToggle />
          <LocaleSwitch
            locales={appConfig.i18n.locales}
            currentLocale={locale}
          />

          <Button
            as="a"
            href={`${env.NEXT_PUBLIC_SAAS_URL}/${locale}/auth/signin`}
            intent="primary-ghost"
          >
            {labels.signIn}
          </Button>
        </div>
      </div>
    </nav>
  );
}
