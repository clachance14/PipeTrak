import { defineAbilitiesFor } from "@auth";
import { protectedProcedure } from "@trpc";
import { TRPCError } from "@trpc/server";
import { db } from "database";
import { z } from "zod";

const TeamBySlugInput = z.object({
  slug: z.string(),
});

const TeamBySlugOutput = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});

export const teamBySlugProcedure = protectedProcedure
  .input(TeamBySlugInput)
  .output(TeamBySlugOutput)
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
