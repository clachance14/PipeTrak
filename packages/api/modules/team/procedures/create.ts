import { TeamModel, db } from "database";
import slugify from "slugify";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const create = protectedProcedure
  .input(
    z.object({
      name: z.string(),
      slug: z.optional(z.string()),
    }),
  )
  .output(TeamModel)
  .mutation(async ({ input: { name, slug }, ctx: { user } }) => {
    const team = await db.team.create({
      data: {
        name,
        slug: slugify(slug ?? name, {
          lower: true,
          remove: /[*+~.()'"!:@]/g,
        }),
      },
    });

    // automatically add the creating user to the team
    await db.teamMembership.create({
      data: {
        teamId: team.id,
        userId: user!.id,
        role: "OWNER",
        isCreator: true,
      },
    });

    return team;
  });
