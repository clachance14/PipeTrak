import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./src/router";
import { createContext } from "./src/trpc/context";

export const trpcApiRouteHandler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api",
    req,
    router: appRouter,
    createContext,
  });
