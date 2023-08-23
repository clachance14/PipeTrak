"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AppRouter } from "@trpc";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { PropsWithChildren, useState } from "react";
import superjson from "superjson";

export const apiClient = createTRPCReact<AppRouter>({});

export function ApiClientProvider({ children }: PropsWithChildren<{}>) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    apiClient.createClient({
      links: [
        httpBatchLink({
          url: baseUrl + "/api",
        }),
      ],
      transformer: superjson,
    }),
  );
  return (
    <apiClient.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </apiClient.Provider>
  );
}
