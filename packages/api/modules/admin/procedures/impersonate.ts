import { TRPCError } from "@trpc/server";
import { lucia } from "auth";
import { db } from "database";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc/base";

export const impersonate = protectedProcedure
  .input(
    z.object({
      userId: z.string(),
    }),
  )
  .output(z.void())
  .mutation(
    async ({
      input: { userId },
      ctx: { sessionId, isAdmin, abilities, responseHeaders },
    }) => {
      if (!isAdmin && !abilities.isAdmin)
        throw new TRPCError({
          code: "UNAUTHORIZED",
        });

      // check if user with id exists
      const userExists = await db.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!userExists) throw new TRPCError({ code: "NOT_FOUND" });

      try {
        const session = await lucia.createSession(userId, {
          impersonatorSessionId: sessionId,
        });

        // auth.handleRequest(req);
        const sessionCookie = lucia.createSessionCookie(session.id);
        responseHeaders?.append("Set-Cookie", sessionCookie.serialize());
      } catch (e) {
        console.error(e);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An unknown error occurred.",
        });
      }
    },
  );
