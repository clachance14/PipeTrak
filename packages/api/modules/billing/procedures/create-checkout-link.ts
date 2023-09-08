import { z } from "zod";
import { protectedProcedure } from "../../trpc";
import { createCheckoutLink as createCheckoutLinkResolver } from "../provider";

export const createCheckoutLink = protectedProcedure
  .input(
    z.object({
      planId: z.string(),
      variantId: z.string(),
      teamId: z.string(),
      redirectUrl: z.string().optional(),
    }),
  )
  .output(z.string())
  .mutation(
    async ({
      input: { planId, variantId, redirectUrl, teamId },
      ctx: { user },
    }) => {
      if (!user) throw new Error("User not found");

      return await createCheckoutLinkResolver({
        planId,
        variantId,
        email: user.email,
        name: user.name ?? "",
        teamId,
        redirectUrl,
      });
    },
  );
