"use client";

import { AuthProvider } from "auth-client";
import { ThemeProvider } from "next-themes";
import { PropsWithChildren } from "react";
import { TrpcProvider } from "trpc/client/nextjs";
import { ToastProvider } from "ui";

export default function ClientProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider attribute="class">
      <AuthProvider>
        <TrpcProvider>
          <ToastProvider>{children}</ToastProvider>
        </TrpcProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
