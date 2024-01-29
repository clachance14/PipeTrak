import { TeamMembershipSchema, TeamSchema, UserSchema } from "database";
import { z } from "zod";
import { publicProcedure } from "../../../trpc/base";

export const user = publicProcedure
  .input(z.void())
  .output(
    UserSchema.pick({
      id: true,
      email: true,
      role: true,
      avatarUrl: true,
      name: true,
    })
      .extend({
        teamMemberships: z
          .array(
            TeamMembershipSchema.extend({
              team: TeamSchema,
            }),
          )
          .nullable(),
      })
      .nullable(),
  )
  .query(async ({ ctx: { user, teamMemberships } }) => {
    if (!user) return null;

    return {
      ...user,
      avatarUrl: user.avatarUrl ?? null,
      teamMemberships,
    };
  });
