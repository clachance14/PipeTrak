import { TRPCError } from "@trpc/server";
import { db } from "database";
import { sendEmail } from "mail";
import slugify from "slugify";
import { z } from "zod";
import { getUsersById } from "../../auth";
import { protectedProcedure, router } from "../../trpc/base";
import { getBaseUrl } from "../../util/base-url";

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

      const userIds =
        team?.memberships
          .map((m) => m.userId)
          .filter((id): id is string => !!id) ?? [];

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
          role: "OWNER",
          isCreator: true,
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

  inviteMember: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        email: z.string(),
      }),
    )
    .mutation(async ({ input: { teamId, email }, ctx: { user } }) => {
      // check if user is member of team and is has owner role
      const ownerMembership = await db.teamMembership.findFirst({
        where: {
          teamId: teamId,
          userId: user!.id,
          role: "OWNER",
        },
      });

      if (!ownerMembership) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "No permission to add a member.",
        });
      }

      try {
        const newMembership = await db.teamMembership.create({
          data: {
            teamId: teamId,
            email,
            status: "PENDING",
          },
          include: {
            team: {
              select: {
                name: true,
              },
            },
          },
        });

        // get user

        await sendEmail({
          templateId: "teamInvitation",
          to: email,
          context: {
            url: `${getBaseUrl()}/auth/signup?invitationCode=${
              newMembership.id
            }`,
            teamName: newMembership.team.name,
          },
        });
      } catch (e) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not create membership.",
        });
      }
    }),
});
