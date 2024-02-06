import { TRPCError } from "@trpc/server";
import { auth, validateVerificationToken } from "auth";
import { z } from "zod";
import { publicProcedure } from "../../../trpc/base";

export const verifyToken = publicProcedure
  .input(
    z.object({
      token: z.string(),
    }),
  )
  .mutation(async ({ input: { token }, ctx: { responseHeaders } }) => {
    try {
      const userId = await validateVerificationToken({
        token,
      });

      const session = await auth.createSession({
        userId: userId,
        attributes: {},
      });

      if (!session.user.email_verified) {
        await auth.updateUserAttributes(session.user.id, {
          email_verified: true,
        });
      }

      const sessionCookie = auth.createSessionCookie(session);
      responseHeaders?.append("Set-Cookie", sessionCookie.serialize());

      return session;
    } catch (e) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid token",
      });
    }
  });
