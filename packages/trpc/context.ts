import { inferAsyncReturnType } from "@trpc/server";
import { getUserSession } from "auth";

export async function createContext() {
  const session = await getUserSession();
  return {
    session,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
