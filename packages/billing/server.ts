import { procedure } from '@backend/trpc/instance';
import { prisma } from '@database/prisma';
import { TRPCError } from '@trpc/server';
import z from 'zod';
import { cancelSubscription, createCheckoutLink, createCustomerPortalLink, getAllPlans } from './lemonsqueezy';
import { getUserSubscription, updateUserSubscription } from './shared/subscriptions';

const billingRouter = {
  createCheckoutLink: procedure
    .input(
      z.object({
        variantIds: z.array(z.number()),
        storeId: z.string(),
      })
    )
    .mutation(async ({ input: { variantIds, storeId }, ctx: { session } }) => {
      if (!session) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not logged in.',
        });
      }

      return await createCheckoutLink({
        variantIds,
        storeId,
        user: session.user,
      });
    }),

  cancelSubscription: procedure
    .input(
      z.object({
        subscriptionId: z.string(),
      })
    )
    .mutation(async ({ input: { subscriptionId }, ctx: { session } }) => {
      if (!session) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not logged in.',
        });
      }

      const subscription = await prisma.subscription.findFirst({
        where: {
          userId: session.user.id,
          subscriptionId,
        },
      });

      if (!subscription) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Subscription not found.',
        });
      }

      try {
        await cancelSubscription({ subscriptionId });

        await updateUserSubscription({
          ...subscription,
          status: 'cancelled',
        });
      } catch (e) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Could not cancel subscription.',
        });
      }

      return true;
    }),
};

export {
  billingRouter,
  getAllPlans,
  createCheckoutLink,
  updateUserSubscription,
  getUserSubscription,
  createCustomerPortalLink,
};
