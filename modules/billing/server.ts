import { TRPCError } from '@trpc/server';
import z from 'zod';
import { procedure } from '../../trpc';
import { createCheckoutLink, getAllPlans } from './lemonsqueezy';

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
};

export { billingRouter, getAllPlans, createCheckoutLink };
