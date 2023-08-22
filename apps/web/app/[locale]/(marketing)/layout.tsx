import { Footer, NavBar } from "@marketing/shared/components";
import { PropsWithChildren } from "react";

export default function MarketingLayout({ children }: PropsWithChildren) {
  return (
    <div>
      <NavBar />
      <main className="pt-32">{children}</main>
      <Footer />
    </div>
  );
}
