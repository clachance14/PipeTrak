import { TeamMembershipModel, TeamModel, db } from "database";
import { z } from "zod";
import { userSchema } from "../../auth";
import { publicProcedure } from "../../trpc";

export const me = publicProcedure
  .output(
    userSchema
      .extend({
        teamMemberships: z
          .array(
            TeamMembershipModel.extend({
              team: TeamModel,
            }),
          )
          .nullable(),
      })
      .nullable(),
  )
  .query(async ({ ctx: { user, teamMemberships } }) => {
    if (!user) {
      return null;
    }

    const data = await db.userProfile.findFirst({
      where: {
        userId: user.id,
      },
    });

    if (data) {
      user.avatarUrl = data.avatarUrl ?? undefined;
      user.role = data.role ?? "USER";
    }

    return {
      ...user,
      teamMemberships,
    };
  });
