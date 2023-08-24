import { z } from "zod";
import { protectedProcedure } from "../../trpc";
import { createCheckoutLink as createCheckoutLinkResolver } from "../provider";

export const createCheckoutLink = protectedProcedure
  .input(
    z.object({
      planId: z.string(),
      variantId: z.string(),
    }),
  )
  .output(z.string())
  .mutation(async ({ input: { planId, variantId }, ctx: { user } }) => {
    return await createCheckoutLinkResolver({
      planId,
      variantId,
      userData: user!,
    });
  });
