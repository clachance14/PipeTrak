import { TRPCError } from "@trpc/server";
import { lucia } from "auth";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc/base";

export const logout = protectedProcedure
  .input(z.void())
  .mutation(async ({ ctx: { sessionId, responseHeaders } }) => {
    try {
      if (!sessionId) return;
      await lucia.invalidateSession(sessionId);
      const sessionCookie = lucia.createBlankSessionCookie();
      responseHeaders?.append("Set-Cookie", sessionCookie.serialize());
    } catch (e) {
      console.error(e);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unknown error occurred.",
      });
    }
  });
