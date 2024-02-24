import { TRPCError } from "@trpc/server";
import { lucia } from "auth";
import { db } from "database";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc/base";

export const unimpersonate = protectedProcedure
  .input(
    z.object({
      userId: z.string(),
    }),
  )
  .output(z.void())
  .mutation(
    async ({ ctx: { sessionId, isAdmin, abilities, responseHeaders } }) => {
      if (!isAdmin && !abilities.isAdmin)
        throw new TRPCError({
          code: "UNAUTHORIZED",
        });

      try {
        const currentSession = await db.userSession.findUnique({
          where: {
            id: sessionId,
          },
        });

        if (!currentSession || !currentSession.impersonatorId)
          throw new TRPCError({ code: "NOT_FOUND" });

        await lucia.invalidateSession(sessionId);

        const newSession = await lucia.createSession(
          currentSession.impersonatorId,
          {},
        );

        const sessionCookie = lucia.createSessionCookie(newSession.id);
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
