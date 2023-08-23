import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, createContext } from "./modules/trpc";

export const trpcApiRouteHandler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api",
    req,
    router: appRouter,
    createContext,
  });
