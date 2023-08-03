import { Footer, NavBar } from "@components";
import { useTranslations } from "next-intl";
import { PropsWithChildren } from "react";

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
        labels={{ signIn: "Sign in" }}
      />
      {children}
      <Footer />
    </div>
  );
}
