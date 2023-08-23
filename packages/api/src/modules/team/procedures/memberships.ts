import { defineAbilitiesFor, getUsersById } from "@auth";
import { protectedProcedure } from "@trpc";
import { TRPCError } from "@trpc/server";
import { db } from "database";
import { z } from "zod";

const TeamMembershipsInput = z.object({
  teamId: z.string(),
});

const TeamMembershipsOutput = z.array(
  z.object({
    userId: z.string(),
    role: z.string(),
    isCreator: z.boolean(),
    user: z.optional(
      z.object({
        id: z.string(),
        email: z.string(),
        avatarUrl: z.optional(z.string()),
      }),
    ),
  }),
);

export const teamMembershipsProcedure = protectedProcedure
  .input(TeamMembershipsInput)
  .output(TeamMembershipsOutput)
  .query(async ({ input: { teamId }, ctx: { user } }) => {
    const abilities = await defineAbilitiesFor({
      userId: user!.id,
      teamId,
    });

    if (!abilities.can("read", "TeamMembership")) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "No permission to read the memberships for this team.",
      });
    }

    const memberships = await db.teamMembership.findMany({
      where: {
        teamId,
      },
    });

    const userIds =
      memberships.map((m) => m.userId).filter((id): id is string => !!id) ?? [];

    const users = await getUsersById(userIds);

    return (
      memberships.map((m) => ({
        ...m,
        user: users.find((u) => u.id === m.userId),
      })) ?? []
    );
  });
