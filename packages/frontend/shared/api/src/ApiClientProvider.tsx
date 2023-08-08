"use client";

import { getBaseUrl } from "@supastarter/frontend/web/common/util";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { PropsWithChildren, useState } from "react";
import superjson from "superjson";
import { apiClient } from "./client";

export function ApiClientProvider({ children }: PropsWithChildren<{}>) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    apiClient.createClient({
      links: [
        httpBatchLink({
          url: getBaseUrl() + "/trpc",
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
