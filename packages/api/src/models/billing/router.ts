import { TRPCError } from "@trpc/server";
import { db } from "database";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../../trpc/base";
import {
  cancelSubscription,
  createCheckoutLink,
  getAllPlans,
} from "./lemonsqueezy";

export const billingRouter = router({
  plans: publicProcedure.query(async () => {
    return await getAllPlans();
  }),
  createCheckoutLink: protectedProcedure
    .input(
      z.object({
        planId: z.string(),
        variantId: z.string(),
      }),
    )
    .mutation(async ({ input: { planId, variantId }, ctx: { user } }) => {
      return await createCheckoutLink({
        planId,
        variantId,
        userData: user!,
      });
    }),
  cancelSubscription: protectedProcedure
    .input(
      z.object({
        subscriptionId: z.string(),
      }),
    )
    .mutation(async ({ input: { subscriptionId }, ctx: { user } }) => {
      const subscription = await db.subscription.findFirst({
        where: {
          subscriptionId,
        },
      });

      if (!subscription || subscription.teamId !== user!.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subscription not found.",
        });
      }

      try {
        await cancelSubscription({ subscriptionId });

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

      return true;
    }),

  userSubscription: protectedProcedure.query(async ({ ctx: { user } }) => {
    const subscription = await db.subscription.findFirst({
      where: {
        teamId: user!.id,
      },
    });

    return subscription;
  }),
});
