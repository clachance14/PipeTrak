import { AppWrapper } from "@saas/shared/components/AppWrapper";
import type { PropsWithChildren } from "react";

export default function PipeTrakLayout({ children }: PropsWithChildren) {
  return (
    <AppWrapper>
      {children}
    </AppWrapper>
  );
}