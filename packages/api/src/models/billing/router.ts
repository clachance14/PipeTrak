import { TRPCError } from "@trpc/server";
import { db, Subscription } from "database";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../../trpc/base";
import {
  cancelSubscription,
  createCheckoutLink,
  getAllPlans,
} from "./lemonsqueezy";

export async function updateUserSubscription(
  subscription: Omit<Subscription, "id"> & {
    userId?: string;
  },
): Promise<void | Subscription> {
  if (!subscription.userId) {
    throw new Error("Either customerId or userId must be provided");
  }

  const existingSubscription = await db.subscription.findFirst({
    where: {
      userId: subscription.userId,
    },
  });

  try {
    if (existingSubscription) {
      return await db.subscription.update({
        data: subscription,
        where: {
          id: existingSubscription.id,
        },
      });
    }

    await db.subscription.create({
      data: {
        ...subscription,
      },
    });
  } catch (e) {
    console.error(e);
    throw new Error("Could not upsert subscription");
  }
}

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

      if (!subscription || subscription.userId !== user!.id) {
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

  userSubscription: protectedProcedure.query(async ({ ctx: { user } }) => {
    const subscription = await db.subscription.findFirst({
      where: {
        userId: user!.id,
      },
    });

    return subscription;
  }),
});
