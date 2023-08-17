import { db } from "database";
import { protectedProcedure, publicProcedure, router } from "../../trpc/base";

export const userRouter = router({
  info: publicProcedure.query(async ({ ctx: { user } }) => {
    return user;
  }),

  teams: protectedProcedure.query(async ({ ctx: { user } }) => {
    const teams = await db.team.findMany({
      where: {
        memberships: {
          some: {
            userId: {
              contains: user!.id,
            },
          },
        },
      },
    });

    return teams;
  }),
});
