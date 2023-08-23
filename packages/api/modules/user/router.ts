import { db } from "database";
import { protectedProcedure, publicProcedure, router } from "../trpc";

export const userRouter = router({
  info: publicProcedure.query(async ({ ctx: { user } }) => {
    if (!user) {
      return null;
    }

    const data = await db.userProfile.findFirst({
      where: {
        userId: user.id,
      },
    });

    if (data) {
      user.avatarUrl = data.avatarUrl ?? undefined;
      user.role = data.role ?? "USER";
    }

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
