import { SubscriptionSchema, db } from "database";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc/base";
import { defineAbilitiesFor } from "../../auth/abilities";

export const subscription = protectedProcedure
	.input(
		z.object({
			teamId: z.string(),
		}),
	)
	.output(SubscriptionSchema.nullable())
	.query(async ({ input: { teamId }, ctx: { user } }) => {
		const userAbilities = await defineAbilitiesFor(user);
		if (!userAbilities.isTeamMember(teamId)) {
			throw new Error("Unauthorized");
		}

		const subscription = await db.subscription.findUnique({
			where: {
				teamId,
			},
		});

		return subscription;
	});
