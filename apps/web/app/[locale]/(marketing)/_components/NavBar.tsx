"use client";

import { Button, Logo } from "@components";
import { useUser } from "@lib/auth";
import { appConfig } from "config";
import { useLocale } from "next-intl";
import Link from "next-intl/link";
import { useEffect, useState } from "react";
import { ColorModeToggle } from "../../_components/ColorModeToggle";
import { LocaleSwitch } from "../../_components/LocaleSwitch";
import Banner from "./Banner";

export function NavBar({
  labels,
  menuItems,
}: {
  labels: {
    signIn: string;
    dashboard: string;
  };
  menuItems: Array<{
    label: string;
    href: string;
  }>;
}) {
  const { user } = useUser();
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
  }, []);

  return (
    <nav
      className={`fixed left-0 top-0 z-20 w-full bg-white/80 backdrop-blur-lg dark:bg-zinc-900/80 dark:text-white`}
    >
      <Banner />

      <div className="flex items-center justify-stretch gap-6 px-12 py-8">
        <div className="flex flex-1 justify-start">
          <Link
            href="/"
            className="block hover:no-underline active:no-underline"
          >
            <Logo />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center">
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

        <div className="flex flex-1 items-center justify-end gap-3">
          <ColorModeToggle />
          <LocaleSwitch
            locales={appConfig.i18n.locales}
            currentLocale={locale}
          />

          <Button
            as="a"
            href={user ? "/dashboard" : "/auth/login"}
            intent="primary-ghost"
          >
            {user ? labels.dashboard : labels.signIn}
          </Button>
        </div>
      </div>
    </nav>
  );
}
