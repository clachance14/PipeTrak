import { db } from "database";
import { protectedProcedure } from "src/trpc/base";
import { router } from "../../trpc/base";

export const userRouter = router({
  info: protectedProcedure.query(async ({ ctx: { user } }) => {
    const role = await db.userRole.findFirst({
      where: {
        userId: user!.id,
      },
    });

    const organizations = await db.organizationMembership.findMany({
      where: {
        userId: {
          contains: user!.id,
        },
      },
      include: {
        organization: true,
      },
    });

    return {
      ...user,
      role,
      organizations,
    };
  }),
});
