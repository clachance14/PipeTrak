import { inferAsyncReturnType } from "@trpc/server";
import { getUser } from "../auth";

export async function createContext() {
  const user = await getUser();
  return {
    user,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
