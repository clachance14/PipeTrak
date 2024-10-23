import { TRPCError } from "@trpc/server";
import { db } from "database";
import { logger } from "logs";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc/base";
import { defineAbilitiesFor } from "../../auth/abilities";

export const deleteTeam = protectedProcedure
	.input(
		z.object({
			id: z.string(),
		}),
	)
	.mutation(async ({ input: { id }, ctx: { user } }) => {
		try {
			const userAbilities = await defineAbilitiesFor(user);
			if (!userAbilities.isTeamOwner(id)) {
				throw new TRPCError({
					code: "FORBIDDEN",
				});
			}

			await db.team.delete({
				where: {
					id,
				},
			});

			await db.userSession.deleteMany({
				where: {
					teamId: id,
				},
			});
		} catch (e) {
			logger.error(e);

			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
			});
		}
	});
