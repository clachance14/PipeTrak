"use client";

import { ToastProvider } from "@/components/base/Toast";
import { AuthProvider } from "@/lib/auth";
import { ApiClientProvider } from "api/client";
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
