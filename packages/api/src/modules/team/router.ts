import { defineAbilitiesFor } from "@auth";
import { getBaseUrl } from "@shared";
import { protectedProcedure, router } from "@trpc";
import { TRPCError } from "@trpc/server";
import { db } from "database";
import { sendEmail } from "mail";
import slugify from "slugify";
import { z } from "zod";
import { teamBySlugProcedure } from "./procedures/by-slug";
import { teamMembershipsProcedure } from "./procedures/memberships";

export const teamRouter = router({
  bySlug: teamBySlugProcedure,
  memberships: teamMembershipsProcedure,

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
    }),

  inviteMember: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        email: z.string(),
        role: z.enum(["MEMBER", "OWNER"]),
      }),
    )
    .mutation(async ({ input: { teamId, email, role }, ctx: { user } }) => {
      const abilities = await defineAbilitiesFor({
        userId: user!.id,
        teamId,
      });

      if (!abilities.can("create", "TeamInvitation")) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "No permission to add a member to this team.",
        });
      }

      try {
        const invitation = await db.teamInvitation.create({
          data: {
            teamId,
            email,
            role,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
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
            url: `${getBaseUrl()}/auth/signup?invitationCode=${invitation.id}`,
            teamName: invitation.team.name,
          },
        });
      } catch (e) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not create membership.",
        });
      }
    }),

  invitations: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
      }),
    )
    .query(async ({ input: { teamId }, ctx: { user } }) => {
      const abilities = await defineAbilitiesFor({
        userId: user!.id,
        teamId,
      });

      if (!abilities.can("read", "TeamInvitation")) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "No permission to read the invitations for this team.",
        });
      }

      const invitations = await db.teamInvitation.findMany({
        where: {
          teamId,
        },
      });

      return invitations;
    }),
});
