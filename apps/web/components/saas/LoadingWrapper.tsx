"use client";

import { Logo } from "@components/base";
import { useUser } from "@lib/auth";
import { PropsWithChildren } from "react";

export function LoadingWrapper({ children }: PropsWithChildren) {
  const { user, loaded } = useUser();

  if (!user || !loaded)
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <div className="animate-pulse">
          <Logo />
        </div>
      </div>
    );

  return <div>{children}</div>;
}
