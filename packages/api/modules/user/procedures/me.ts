import { db } from "database";
import { publicProcedure } from "../../trpc";

export const me = publicProcedure.query(async ({ ctx: { user } }) => {
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
});
