import type {} from "@prisma/client";
import { billingRouter } from "../billing";
import { newsletterRouter } from "../newsletter";
import * as teamProcedures from "../team/procedures";
import { router } from "../trpc";
import { userRouter } from "../user";

export const appRouter = router({
  user: userRouter,
  billing: billingRouter,
  team: router(teamProcedures),
  newsletter: newsletterRouter,
});

export type AppRouter = typeof appRouter;
