"use client";

import UserMenu from "@components/UserMenu";
import { appConfig } from "@config";
import { sidebarExpanded as sidebarExpandedAtom } from "@state/ui";
import { useUser } from "auth-client";
import { ColorModeToggle, LocaleSwitch } from "common/components";
import { useAtom } from "jotai";
import { useLocale, useTranslations } from "next-intl";
import Link from "next-intl/link";
import {
  usePathname,
  useRouter,
  useSelectedLayoutSegment,
} from "next/navigation";
import { PropsWithChildren, useCallback } from "react";
import { Button, Icon, Logo } from "ui";

const menuItems = [
  {
    label: "Dashboard",
    href: "/",
    segment: null,
    icon: Icon.grid,
  },
  {
    label: "Settings",
    href: "/settings/account",
    segment: "settings",
    icon: Icon.settings,
  },
];

export function Sidebar({}: PropsWithChildren<{}>) {
  const user = useUser();
  const locale = useLocale();
  const t = useTranslations("common");
  const pathname = usePathname();
  const router = useRouter();

  const [sidebarExpanded, setSidebarExpanded] = useAtom(sidebarExpandedAtom);
  const selectedSegment = useSelectedLayoutSegment();
  const positionClass = sidebarExpanded ? "left-0" : "-left-[280px] lg:left-0";

  const isActiveMenuItem = useCallback(
    (segment: string | null) => selectedSegment === segment,
    [selectedSegment],
  );

  return (
    <nav
      className={`dark:bg-zinc-950 fixed top-0 bg-white ${positionClass} z-40 h-screen w-[280px] shadow-[0_0_16px_rgba(0,0,0,0.025)] transition-all duration-300 ease-in-out`}
    >
      <div className="flex justify-end px-6 py-2 lg:hidden">
        <Button
          intent="primary-outline"
          size="small"
          onClick={() => setSidebarExpanded(false)}
        >
          <span className="sr-only">Toggle sidebar</span>
          <Icon.close className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-6">
        <Logo />
      </div>

      {/* <div className="px-6">
        <WorkspacesSelect workspaces={workspaces} selectedWorkspace={selectedWorkspace} />
      </div> */}

      <ul className="mt-4 list-none px-6">
        {menuItems.map((menuItem) => (
          <li key={menuItem.href}>
            <Link
              href={menuItem.href}
              className={`hover:text-zinc-950 flex items-center gap-3 rounded-xl px-4 py-3 hover:no-underline focus:no-underline dark:hover:text-white ${
                isActiveMenuItem(menuItem.segment)
                  ? "bg-primary-500/10 text-zinc-950 font-bold dark:text-white"
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
        <div className="absolute bottom-0 w-full p-6">
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
