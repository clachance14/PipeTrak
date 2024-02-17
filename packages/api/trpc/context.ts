import { inferAsyncReturnType } from "@trpc/server";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { SessionUser, lucia } from "auth";
import { db } from "database";
import { cookies } from "next/headers";
import { defineAbilitiesFor } from "../modules/auth/abilities";

export async function createContext(
  params?: FetchCreateContextFnOptions | { isAdmin?: boolean },
) {
  let user: SessionUser | null = null;
  const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;

  if (sessionId) {
    const validatedSession = await lucia.validateSession(sessionId);

    if (validatedSession.user) {
      user = validatedSession.user;
    }
  }

  const teamMemberships = user
    ? await db.teamMembership.findMany({
        where: {
          userId: user.id,
        },
        include: {
          team: true,
        },
      })
    : null;

  const abilities = defineAbilitiesFor({
    user,
    teamMemberships,
  });

  return {
    user,
    teamMemberships,
    abilities,
    sessionId,
    responseHeaders:
      params && "resHeaders" in params ? params.resHeaders : undefined,
    isAdmin: params && "isAdmin" in params ? params.isAdmin : false,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
