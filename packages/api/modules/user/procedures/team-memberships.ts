import { TeamMembershipModel, TeamModel, db } from "database";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const teamMemberships = protectedProcedure
  .input(z.object({ userId: z.string() }))
  .output(z.array(TeamMembershipModel.extend({ team: TeamModel })))
  .query(async ({ input: { userId } }) => {
    const teams = await db.teamMembership.findMany({
      where: {
        userId,
      },
      include: {
        team: true,
      },
    });

    return teams;
  });
