"use client";

import { sidebarExpanded as sidebarExpandedAtom } from "@app/[locale]/dashboard/state";
import UserMenu from "@components/UserMenu";
import { appConfig } from "@config";
import { useUser } from "auth-client";
import { ColorModeToggle, LocaleSwitch } from "common/components";
import { useAtom } from "jotai";
import { useLocale, useTranslations } from "next-intl";
import Link from "next-intl/link";
import { usePathname, useSelectedLayoutSegment } from "next/navigation";
import { PropsWithChildren, useCallback, useEffect } from "react";
import { Button, Icon, Logo } from "ui";

const menuItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    segment: null,
    icon: Icon.grid,
  },
  {
    label: "Settings",
    href: "/dashboard/settings/account",
    segment: "settings",
    icon: Icon.settings,
  },
];

export function Sidebar({}: PropsWithChildren<{}>) {
  const user = useUser();
  const locale = useLocale();
  const t = useTranslations("common");
  const pathname = usePathname();

  const [sidebarExpanded, setSidebarExpanded] = useAtom(sidebarExpandedAtom);
  const selectedSegment = useSelectedLayoutSegment();
  const positionClass = sidebarExpanded ? "left-0" : "-left-[280px] lg:left-0";

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
    (segment: string | null) => selectedSegment === segment,
    [selectedSegment],
  );

  return (
    <nav
      className={`fixed top-0 ${positionClass} z-40 h-screen w-[300px] transition-all duration-300 ease-in-out`}
    >
      <div className="flex justify-end px-8 py-2 lg:hidden">
        <Button
          intent="primary-outline"
          size="small"
          onClick={() => setSidebarExpanded(false)}
        >
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
              className={`flex items-center gap-3 py-3 hover:text-zinc-950 hover:no-underline focus:no-underline dark:hover:text-white ${
                isActiveMenuItem(menuItem.segment)
                  ? "font-bold text-zinc-950 dark:text-white"
                  : ""
              }`}
            >
              <menuItem.icon
                className={`h-6 w-6 transform ${
                  isActiveMenuItem(menuItem.segment)
                    ? "text-primary-500"
                    : "text-zinc-950/50 dark:text-white/50"
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
