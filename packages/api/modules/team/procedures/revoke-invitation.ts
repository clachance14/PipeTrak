import { TRPCError } from "@trpc/server";
import { db } from "database";
import { logger } from "logs";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc/base";
import { defineAbilitiesFor } from "../../auth/abilities";

export const revokeInvitation = protectedProcedure
	.input(
		z.object({
			invitationId: z.string(),
		}),
	)
	.mutation(async ({ input: { invitationId }, ctx: { user } }) => {
		const invitation = await db.teamInvitation.findUnique({
			where: {
				id: invitationId,
			},
			select: {
				id: true,
				teamId: true,
			},
		});

		if (!invitation) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Invitation not found.",
			});
		}

		const userAbilities = await defineAbilitiesFor(user);
		if (!userAbilities.isTeamOwner(invitation.teamId)) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "No permission to add a member to this team.",
			});
		}

		try {
			await db.teamInvitation.delete({
				where: {
					id: invitationId,
				},
			});
		} catch (e) {
			logger.error(e);

			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Could remove invitation.",
			});
		}
	});
