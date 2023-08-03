import type {} from "@prisma/client";
import { router } from "../trpc";
import { authRouter } from "./auth";
import { billingRouter } from "./billing";

export const appRouter = router({
  ...authRouter,
  ...billingRouter,
});

export type AppRouter = typeof appRouter;
