import { TRPCError } from "@trpc/server";
import { TeamModel, db } from "database";
import slugify from "slugify";
import { z } from "zod";
import { defineAbilitiesFor } from "../../auth";
import { protectedProcedure } from "../../trpc";

export const update = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      name: z.string(),
      slug: z.optional(z.string()),
    }),
  )
  .output(TeamModel)
  .mutation(async ({ input: { id, name, slug }, ctx: { user } }) => {
    const abilities = await defineAbilitiesFor({
      userId: user!.id,
      teamId: id,
    });

    if (!abilities.can("update", "Team")) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "No permission to update this team.",
      });
    }

    const team = await db.team.update({
      where: {
        id,
      },
      data: {
        name,
        slug: slugify(slug ?? name, {
          lower: true,
          remove: /[*+~.()'"!:@]/g,
        }),
      },
    });

    return team;
  });
