import { SubscriptionModel, db } from "database";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const subscription = protectedProcedure
  .input(
    z.object({
      teamId: z.string(),
    }),
  )
  .output(SubscriptionModel.nullable())
  .query(async ({ ctx: { user } }) => {
    const subscription = await db.subscription.findFirst({
      where: {
        team_id: user!.id,
      },
    });

    return subscription;
  });
