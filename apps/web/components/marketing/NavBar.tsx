"use client";

import {
  Button,
  ColorModeToggle,
  Icon,
  LocaleSwitch,
  Logo,
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@components";
import { useUser } from "@lib/auth";
import { appConfig } from "config";
import { useLocale, useTranslations } from "next-intl";
import Link from "next-intl/link";
import Banner from "./Banner";

export function NavBar() {
  const t = useTranslations("common");
  const { user, teams, activeTeam, loaded: userLoaded } = useUser();
  const locale = useLocale();

  const menuItems: {
    label: string;
    href: string;
  }[] = [
    {
      label: t("menu.pricing"),
      href: `/pricing`,
    },
    {
      label: t("menu.blog"),
      href: "/blog",
    },
  ];

  const hasUser = userLoaded && user;

  return (
    <nav
      className={`bg-background/80 fixed left-0 top-0 z-20 w-full backdrop-blur-lg`}
    >
      <Banner />

      <div className="flex items-center justify-stretch gap-6 p-8">
        <div className="flex flex-1 justify-start">
          <Link
            href="/"
            className="block hover:no-underline active:no-underline"
          >
            <Logo />
          </Link>
        </div>

        <div className="hidden flex-1 items-center justify-center md:flex">
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

          <Sheet>
            <SheetTrigger asChild>
              <Button className="md:hidden" size="icon" variant="outline">
                <Icon.menu />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[250px]" side="right">
              <div className="flex flex-col items-center justify-center">
                {menuItems.map((menuItem) => (
                  <Link
                    key={menuItem.href}
                    href={menuItem.href}
                    className="block px-3 py-2 text-lg"
                  >
                    {menuItem.label}
                  </Link>
                ))}
                <Link href="/dashboard" className="block px-3 py-2 text-lg">
                  {t("menu.dashboard")}
                </Link>
              </div>
            </SheetContent>
          </Sheet>

          <Button className="hidden md:block" asChild variant="ghost">
            <Link
              href={
                hasUser && activeTeam
                  ? `/${activeTeam.slug}/dashboard`
                  : "/auth/login"
              }
            >
              {hasUser ? t("menu.dashboard") : t("menu.login")}
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
