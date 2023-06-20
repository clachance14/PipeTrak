import { authRouter } from "../router/auth";
import { router } from "../util/trpc";

export const appRouter = router({
  ...authRouter,
});

export type AppRouter = typeof appRouter;
