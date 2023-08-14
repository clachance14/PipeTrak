"use client";

import { sidebarExpanded as sidebarExpandedAtom } from "@app/[locale]/[teamSlug]/dashboard/state";
import {
  Button,
  ColorModeToggle,
  Icon,
  LocaleSwitch,
  Logo,
  UserMenu,
} from "@components";
import { appConfig } from "@config";
import { useUser } from "@lib/auth";
import { useAtom } from "jotai";
import { useLocale, useTranslations } from "next-intl";
import Link from "next-intl/link";
import {
  useParams,
  usePathname,
  useSelectedLayoutSegment,
} from "next/navigation";
import { PropsWithChildren, useCallback, useEffect } from "react";

export function Sidebar({}: PropsWithChildren<{}>) {
  const { user } = useUser();
  const locale = useLocale();
  const t = useTranslations("dashboard");
  const pathname = usePathname();
  const { teamSlug } = useParams();

  const [sidebarExpanded, setSidebarExpanded] = useAtom(sidebarExpandedAtom);
  const selectedSegment = useSelectedLayoutSegment();
  const positionClass = sidebarExpanded ? "left-0" : "-left-[280px] lg:left-0";

  const menuItems = [
    {
      label: t("menu.dashboard"),
      href: `/${teamSlug}/dashboard`,
      icon: Icon.grid,
    },
    {
      label: t("menu.settings"),
      href: `/${teamSlug}/settings`,
      icon: Icon.settings,
    },
  ];

  // Close sidebar on resize
  useEffect(() => {
    const handleResize = () => {
      setSidebarExpanded(false);
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Close sidebar on route change
  useEffect(() => setSidebarExpanded(false), [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const isActiveMenuItem = useCallback(
    (href: string | null) => {
      return pathname.startsWith(href);
    },
    [pathname],
  );

  return (
    <nav
      className={`fixed top-0 ${positionClass} z-40 h-screen w-[300px] transition-all duration-300 ease-in-out`}
    >
      <div className="flex justify-end px-8 py-2 lg:hidden">
        <Button variant="outline" onClick={() => setSidebarExpanded(false)}>
          <span className="sr-only">Toggle sidebar</span>
          <Icon.close className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-8">
        <Link href="/" className="!no-underline">
          <Logo />
        </Link>
      </div>

      <ul className="mt-4 list-none px-8">
        {menuItems.map((menuItem) => (
          <li key={menuItem.href}>
            <Link
              href={menuItem.href}
              className={`hover:bg-accent hover:text-accent-foreground flex items-center gap-3 py-3 ${
                isActiveMenuItem(menuItem.href)
                  ? "bg-accent text-accent-foreground font-bold"
                  : ""
              }`}
            >
              <menuItem.icon
                className={`h-4 w-4 ${
                  isActiveMenuItem(menuItem.href) ? "text-primary" : ""
                }`}
              />
              <span>{menuItem.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      {user && (
        <div className="absolute bottom-0 w-full p-8">
          <div className="mb-4 flex justify-end gap-4">
            <LocaleSwitch
              locales={appConfig.i18n.locales}
              currentLocale={locale}
            />
            <ColorModeToggle />
          </div>
          <UserMenu {...user} />
        </div>
      )}
    </nav>
  );
}
