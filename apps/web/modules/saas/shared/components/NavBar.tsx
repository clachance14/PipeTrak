"use client";

import { appConfig } from "@config";
import { UserMenu } from "@marketing/shared/components";
import { ColorModeToggle, LocaleSwitch, Logo } from "@shared/components";
import { Button, Icon } from "@ui/components";
import { ApiOutput } from "api";
import { useLocale, useTranslations } from "next-intl";
import Link from "next-intl/link";
import { useParams, usePathname } from "next/navigation";
import { PropsWithChildren, useCallback } from "react";
import { TeamSelect } from "./TeamSelect";

type Teams = ApiOutput["user"]["teams"];
type User = Required<ApiOutput["user"]["me"]>;

export function NavBar({
  teams,
  user,
}: PropsWithChildren<{ teams: Teams; user: User }>) {
  const locale = useLocale();
  const t = useTranslations();
  const pathname = usePathname();
  const { teamSlug } = useParams();

  const menuItems = [
    {
      label: t("dashboard.menu.dashboard"),
      href: `/${teamSlug}/dashboard`,
      icon: Icon.grid,
    },
    {
      label: t("dashboard.menu.settings"),
      href: `/${teamSlug}/settings`,
      icon: Icon.settings,
    },
  ];

  const isActiveMenuItem = useCallback(
    (href: string | null) => {
      return pathname.includes(href);
    },
    [pathname],
  );

  return (
    <nav className="border-border bg-card w-full border-b">
      <div className="container max-w-5xl pb-2 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="block">
              <Logo withLabel={false} />
            </Link>

            <span className="block opacity-30">/</span>

            <TeamSelect teams={teams} />
          </div>

          {user && (
            <div className="flex justify-end gap-4">
              <LocaleSwitch
                locales={appConfig.i18n.locales}
                currentLocale={locale}
              />
              <ColorModeToggle />

              <UserMenu user={user} />

              <Button
                className="lg:hidden"
                variant="outline"
                onClick={() => {}}
              >
                <Icon.close className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <ul className="mt-4 flex list-none items-center justify-start gap-4">
          {menuItems.map((menuItem) => (
            <li key={menuItem.href}>
              <Link
                href={menuItem.href}
                className={`flex items-center gap-3 py-3 ${
                  isActiveMenuItem(menuItem.href) ? "font-bold" : ""
                }`}
              >
                <menuItem.icon
                  className={`h-4 w-4 shrink-0 ${
                    isActiveMenuItem(menuItem.href) ? "text-primary" : ""
                  }`}
                />
                <span>{menuItem.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
