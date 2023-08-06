"use client";

import { ApiClientProvider } from "api/client/nextjs";
import { AuthProvider } from "auth-client";
import { ThemeProvider } from "next-themes";
import { PropsWithChildren } from "react";
import { ToastProvider } from "ui";

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
