import { TRPCError } from "@trpc/server";
import { TeamMembershipModel, db } from "database";
import { z } from "zod";
import { defineAbilitiesFor, getUsersById, userSchema } from "../../auth";
import { protectedProcedure } from "../../trpc";

export const memberships = protectedProcedure
  .input(
    z.object({
      teamId: z.string(),
    }),
  )
  .output(
    z.array(
      TeamMembershipModel.merge(
        z.object({
          user: z.optional(userSchema),
        }),
      ),
    ),
  )
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
