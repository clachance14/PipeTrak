import { TRPCError } from "@trpc/server";
import { TeamModel, db } from "database";
import { z } from "zod";
import { defineAbilitiesFor } from "../../auth";
import { protectedProcedure } from "../../trpc";

export const bySlug = protectedProcedure
  .input(
    z.object({
      slug: z.string(),
    }),
  )
  .output(TeamModel)
  .query(async ({ input: { slug }, ctx: { user } }) => {
    const team = await db.team.findFirst({
      where: {
        slug,
      },
    });

    if (!team) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Team not found.",
      });
    }

    const abilities = await defineAbilitiesFor({
      userId: user!.id,
      teamId: team!.id,
    });

    if (!abilities.can("read", "Team")) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "No permission to read this team.",
      });
    }

    return team;
  });
