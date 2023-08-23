import { billingRouter } from "@billing";
import { newsletterRouter } from "@newsletter";
import type {} from "@prisma/client";
import { teamRouter } from "@team";
import { router } from "@trpc";
import { userRouter } from "@user";

export const appRouter = router({
  user: userRouter,
  billing: billingRouter,
  team: teamRouter,
  newsletter: newsletterRouter,
});

export type AppRouter = typeof appRouter;
