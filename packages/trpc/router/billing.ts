import { TRPCError } from "@trpc/server";
import {
  cancelSubscription,
  createCheckoutLink,
  updateUserSubscription,
} from "billing/subscriptions";
import { getSubscriptionById } from "database";
import { z } from "zod";
import { protectedProcedure } from "..";

export const billingRouter = {
  createCheckoutLink: protectedProcedure
    .input(
      z.object({
        planId: z.string(),
        variantId: z.string(),
      }),
    )
    .mutation(async ({ input: { planId, variantId }, ctx: { session } }) => {
      return await createCheckoutLink({
        planId,
        variantId,
        userData: session!.user,
      });
    }),

  cancelSubscription: protectedProcedure
    .input(
      z.object({
        subscriptionId: z.string(),
      }),
    )
    .mutation(async ({ input: { subscriptionId }, ctx: { session } }) => {
      const subscription = await getSubscriptionById(subscriptionId);

      if (!subscription || subscription.userId !== session!.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subscription not found.",
        });
      }

      try {
        await cancelSubscription({ subscriptionId });

        await updateUserSubscription({
          ...subscription,
          status: "cancelled",
        });
      } catch (e) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not cancel subscription.",
        });
      }

      return true;
    }),
};
