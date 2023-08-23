import { appRouter, createContext } from "@trpc";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

export const trpcApiRouteHandler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api",
    req,
    router: appRouter,
    createContext,
  });
