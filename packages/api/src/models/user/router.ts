import { db } from "database";
import { protectedProcedure, publicProcedure, router } from "../../trpc/base";

export const userRouter = router({
  info: publicProcedure.query(async ({ ctx: { user } }) => {
    return user;
  }),
  claims: protectedProcedure.query(async ({ ctx: { user } }) => {
    const role = await db.userRole.findFirst({
      where: {
        userId: user!.id,
      },
    });

    const teams = await db.teamMembership.findMany({
      where: {
        userId: {
          contains: user!.id,
        },
      },
      include: {
        team: true,
      },
    });

    return {
      user,
      role,
      teams,
    };
  }),
});
