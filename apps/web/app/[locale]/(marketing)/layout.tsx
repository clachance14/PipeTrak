import { Footer, NavBar } from "@marketing/shared/components";
import { useTranslations } from "next-intl";
import { PropsWithChildren } from "react";

export default function MarketingLayout({ children }: PropsWithChildren) {
  const t = useTranslations("common");

  return (
    <div>
      <NavBar />
      <main className="pt-32">{children}</main>
      <Footer />
    </div>
  );
}
