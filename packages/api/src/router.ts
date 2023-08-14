import type {} from "@prisma/client";
import { billingRouter } from "./models/billing/router";
import { teamRouter } from "./models/team/router";
import { userRouter } from "./models/user/router";
import { router } from "./trpc/base";

export const appRouter = router({
  user: userRouter,
  billing: billingRouter,
  team: teamRouter,
});

export type AppRouter = typeof appRouter;
