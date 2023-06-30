"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { getBaseUrl } from "common/util";
import { PropsWithChildren, useState } from "react";
import superjson from "superjson";
import { config } from "../config";
import { trpc } from "./trpc-client";

export function TrpcProvider({ children }: PropsWithChildren<{}>) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: getBaseUrl() + config.apiPath,
        }),
      ],
      transformer: superjson,
    }),
  );
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
