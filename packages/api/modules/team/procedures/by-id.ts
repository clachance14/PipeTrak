import { TRPCError } from "@trpc/server";
import { TeamSchema, db } from "database";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc/base";
import { defineAbilitiesFor } from "../../auth/abilities";

export const byId = protectedProcedure
	.input(
		z.object({
			id: z.string(),
		}),
	)
	.output(TeamSchema)
	.query(async ({ input: { id }, ctx: { user } }) => {
		const team = await db.team.findUnique({
			where: {
				id,
			},
		});

		if (!team) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Team not found.",
			});
		}

		const userAbilities = await defineAbilitiesFor(user);
		if (!userAbilities.isTeamMember(team.id)) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "No permission to read this team.",
			});
		}

		return team;
	});
