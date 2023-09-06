import { TRPCError } from "@trpc/server";
import { db } from "database";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";
import { cancelSubscription as cancelSubscriptionResolver } from "../provider";

export const cancelSubscription = protectedProcedure
  .input(
    z.object({
      subscriptionId: z.string(),
    }),
  )
  .mutation(async ({ input: { subscriptionId }, ctx: { user } }) => {
    const subscription = await db.subscription.findFirst({
      where: {
        subscription_id: subscriptionId,
      },
    });

    if (!subscription || subscription.team_id !== user!.id) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Subscription not found.",
      });
    }

    try {
      await cancelSubscriptionResolver({ subscriptionId });

      await db.subscription.update({
        where: {
          id: subscriptionId,
        },
        data: {
          ...subscription,
          status: "cancelled",
        },
      });
    } catch (e) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Could not cancel subscription.",
      });
    }
  });
