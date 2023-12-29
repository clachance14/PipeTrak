import { inferAsyncReturnType } from "@trpc/server";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { Session, SessionUser, auth } from "auth";
import { db } from "database";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { defineAbilitiesFor } from "../modules/auth/abilities";

export async function createContext(
  params?: FetchCreateContextFnOptions | { isAdmin?: boolean },
) {
  const authRequest = auth.handleRequest({
    request: params && "req" in params ? (params.req as NextRequest) : null,
    cookies,
  });
  let session: Session | null = null;

  try {
    session = await authRequest.validate(); // or `authRequest.validateBearerToken()`
  } catch (e) {
    console.error(e);
  }

  const user: SessionUser | null = session?.user ?? null;

  const teamMemberships = user
    ? await db.teamMembership.findMany({
        where: {
          user_id: user.id,
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
    sessionId: session?.sessionId ?? null,
    responseHeaders:
      params && "resHeaders" in params ? params.resHeaders : undefined,
    isAdmin: params && "isAdmin" in params ? params.isAdmin : false,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
