import { inferAsyncReturnType } from "@trpc/server";
import { db } from "database";
import { getUser } from "../auth";

export async function createContext() {
  const user = await getUser();

  if (user) {
    const data = await db.userProfile.findFirst({
      where: {
        userId: user.id,
      },
    });

    if (data) {
      user.avatarUrl = data.avatarUrl ?? undefined;
      user.role = data.role ?? "USER";
    }
  }

  return {
    user,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
