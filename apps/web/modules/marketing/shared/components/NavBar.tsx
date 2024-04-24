"use client";

import { Link } from "@i18n";
import { useUser } from "@saas/auth/hooks/use-user";
import { ColorModeToggle } from "@shared/components/ColorModeToggle";
import { LocaleSwitch } from "@shared/components/LocaleSwitch";
import { Logo } from "@shared/components/Logo";
import { Button } from "@ui/components/button";
import { Sheet, SheetContent, SheetTrigger } from "@ui/components/sheet";
import { cn } from "@ui/lib";
import { MenuIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useDebounceCallback, useIsClient } from "usehooks-ts";
import { Banner } from "./Banner";

export function NavBar() {
  const t = useTranslations();
  const { user, loaded: userLoaded } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isClient = useIsClient();
  const [isTop, setIsTop] = useState(true);

  const debouncedScrollHandler = useDebounceCallback(
    () => {
      setIsTop(window.scrollY <= 10);
    },
    150,
    {
      maxWait: 150,
    },
  );

  useEffect(() => {
    window.addEventListener("scroll", debouncedScrollHandler);
    debouncedScrollHandler();
    return () => {
      window.removeEventListener("scroll", debouncedScrollHandler);
    };
  }, [debouncedScrollHandler]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const menuItems: {
    label: string;
    href: string;
  }[] = [
    {
      label: t("common.menu.pricing"),
      href: "/pricing",
    },
    {
      label: t("common.menu.blog"),
      href: "/blog",
    },
    {
      label: t("common.menu.faq"),
      href: "/faq",
    },
    {
      label: t("common.menu.changelog"),
      href: "/changelog",
    },
    {
      label: t("common.menu.docs"),
      href: "/docs",
    },
  ];

  const isMenuItemActive = (href: string) => {
    console.log(pathname, href);
    return pathname === href;
  };

  return (
    <nav
      className={`fixed left-0 top-0 z-20 w-full bg-background/80 backdrop-blur-lg ${isTop ? "shadow-none" : "shadow-sm"} transition-shadow duration-200`}
      data-test="navigation"
    >
      <Banner />

      <div className="container">
        <div
          className={`flex items-center justify-stretch gap-6 ${isTop ? "py-8" : "py-4"} transition-[padding] duration-200`}
        >
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
                className={cn(
                  "block px-3 py-2 text-lg",
                  isMenuItemActive(menuItem.href) ? "font-bold" : "",
                )}
              >
                {menuItem.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-1 items-center justify-end gap-3">
            <ColorModeToggle />
            <LocaleSwitch />

            <Sheet
              open={mobileMenuOpen}
              onOpenChange={(open) => setMobileMenuOpen(open)}
            >
              <SheetTrigger asChild>
                <Button
                  className="md:hidden"
                  size="icon"
                  variant="outline"
                  aria-label="Menu"
                >
                  <MenuIcon className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[250px]" side="right">
                <div className="flex flex-col items-start justify-center">
                  {menuItems.map((menuItem) => (
                    <Link
                      key={menuItem.href}
                      href={menuItem.href}
                      className={cn(
                        "block px-3 py-2 text-lg",
                        isMenuItemActive(menuItem.href) ? "font-bold" : "",
                      )}
                    >
                      {menuItem.label}
                    </Link>
                  ))}

                  <Link
                    key={user ? "dashboard" : "login"}
                    href={user ? "/app" : "/auth/login"}
                    className="block px-3 py-2 text-lg"
                    prefetch={!user}
                  >
                    {user ? t("common.menu.dashboard") : t("common.menu.login")}
                  </Link>
                </div>
              </SheetContent>
            </Sheet>

            {isClient && userLoaded && (
              <>
                {user ? (
                  <Button
                    key="dashboard"
                    className="hidden md:block"
                    asChild
                    variant="ghost"
                  >
                    <Link href="/app">{t("common.menu.dashboard")}</Link>
                  </Button>
                ) : (
                  <Button
                    key="login"
                    className="hidden md:block"
                    asChild
                    variant="ghost"
                  >
                    <Link href="/auth/login">{t("common.menu.login")}</Link>
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
