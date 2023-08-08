"use client";

import { ApiClientProvider } from "@supastarter/frontend/shared/api";
import { AuthProvider } from "@supastarter/frontend/web/auth";
import { ToastProvider } from "@supastarter/frontend/web/ui";
import { ThemeProvider } from "next-themes";
import { PropsWithChildren } from "react";

export default function ClientProviders({ children }: PropsWithChildren) {
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
