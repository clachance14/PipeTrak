"use client";

import { AuthProvider } from "@saas/auth";
import { ToastProvider } from "@ui/components";
import { ApiClientProvider } from "api/client";
import { ThemeProvider } from "next-themes";
import { PropsWithChildren } from "react";

export function ClientProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider attribute="class">
      <AuthProvider>
        <ApiClientProvider>
          <ToastProvider>{children}</ToastProvider>
        </ApiClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
