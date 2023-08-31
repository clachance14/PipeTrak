import { inferAsyncReturnType } from "@trpc/server";
import { db } from "database";
import { defineAbilitiesFor, getUser } from "../auth";

export async function createContext() {
  const user = await getUser();

  if (user) {
    const userProfile = await db.userProfile.findFirst({
      where: {
        userId: user.id,
      },
    });

    if (userProfile) {
      user.avatarUrl = userProfile.avatarUrl ?? undefined;
      user.role = userProfile.role ?? "USER";
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
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
