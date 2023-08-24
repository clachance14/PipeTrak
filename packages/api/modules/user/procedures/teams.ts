import { TeamModel, db } from "database";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const teams = protectedProcedure
  .input(z.object({ userId: z.string() }))
  .output(z.array(TeamModel))
  .query(async ({ input: { userId } }) => {
    const teams = await db.team.findMany({
      where: {
        memberships: {
          some: {
            userId: {
              contains: userId,
            },
          },
        },
      },
    });

    return teams;
  });
