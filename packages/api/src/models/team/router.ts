import { db } from "database";
import slugify from "slugify";
import { z } from "zod";
import { getUsersById } from "../../auth";
import { protectedProcedure, router } from "../../trpc/base";

export const teamRouter = router({
  getBySlug: protectedProcedure
    .input(
      z.object({
        slug: z.string(),
      }),
    )
    .query(async ({ input: { slug }, ctx: { user } }) => {
      const team = await db.team.findFirst({
        where: {
          slug,
        },
        include: {
          memberships: true,
        },
      });

      const userIds = team?.memberships.map((m) => m.userId) ?? [];
      const users = await getUsersById(userIds);

      return {
        ...team,
        memberships:
          team?.memberships.map((m) => ({
            ...m,
            user: users.find((u) => u.id === m.userId),
          })) ?? [],
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        slug: z.optional(z.string()),
      }),
    )
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
          status: "ACCEPTED",
        },
      });

      return team;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        slug: z.optional(z.string()),
      }),
    )
    .mutation(async ({ input: { id, name, slug }, ctx: { user } }) => {
      // check if user is member of team
      const membership = await db.teamMembership.findFirst({
        where: {
          teamId: id,
          userId: user!.id,
        },
      });

      if (!membership) {
        throw new Error("User is not a member of this team.");
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
    }),
});
