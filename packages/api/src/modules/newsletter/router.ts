import { publicProcedure, router } from "@trpc";
import { sendEmail } from "mail";
import { z } from "zod";

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
