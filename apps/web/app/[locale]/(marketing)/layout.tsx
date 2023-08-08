import { useTranslations } from "next-intl";
import { PropsWithChildren } from "react";
import { Footer } from "./_components/Footer";
import { NavBar } from "./_components/NavBar";

export default function MarketingLayout({ children }: PropsWithChildren) {
  const t = useTranslations("common");

  return (
    <div>
      <NavBar
        menuItems={[
          {
            label: t("menu.pricing"),
            href: "/pricing",
          },
          {
            label: t("menu.blog"),
            href: "/blog",
          },
        ]}
        labels={{ signIn: "Sign in", dashboard: "Dashboard" }}
      />
      <main className="bg-white pt-32 dark:bg-zinc-900">{children}</main>
      <Footer />
    </div>
  );
}
