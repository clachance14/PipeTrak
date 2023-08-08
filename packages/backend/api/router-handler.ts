import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createContext } from "./src/context";
import { appRouter } from "./src/router";

export const trpcApiRouteHandler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/trpc",
    req,
    router: appRouter,
    createContext,
  });
