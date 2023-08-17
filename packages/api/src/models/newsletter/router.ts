import { sendEmail } from "mail";
import { z } from "zod";
import { publicProcedure, router } from "../../trpc/base";

export const newsletterRouter = router({
  signup: publicProcedure
    .input(
      z.object({
        email: z.string(),
      }),
    )
    .mutation(async ({ input: { email } }) => {
      await sendEmail({
        to: email,
        templateId: "newsletterSignup",
      });
    }),
});
