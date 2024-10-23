import { TeamMembershipSchema, TeamSchema, UserSchema, db } from "database";
import { getSignedUrl } from "storage";
import { z } from "zod";
import { publicProcedure } from "../../../trpc/base";
import { getUserAvatarUrl } from "../lib/avatar-url";

export const user = publicProcedure
	.input(z.void())
	.output(
		UserSchema.pick({
			id: true,
			email: true,
			role: true,
			avatarUrl: true,
			name: true,
			onboardingComplete: true,
		})
			.extend({
				teamMemberships: z
					.array(
						TeamMembershipSchema.extend({
							team: TeamSchema,
						}),
					)
					.nullable(),
				impersonatedBy: UserSchema.pick({
					id: true,
					name: true,
				}).nullish(),
				activeTeamId: z.string().nullish(),
			})
			.nullable(),
	)
	.query(async ({ ctx: { user, session } }) => {
		if (!user || !session) {
			return null;
		}

		const impersonatedBy = session?.impersonatorId
			? await db.user.findUnique({
					where: {
						id: session.impersonatorId,
					},
					select: {
						id: true,
						name: true,
					},
				})
			: undefined;

		const teamMemberships = user
			? await Promise.all(
					(
						await db.teamMembership.findMany({
							where: {
								userId: user.id,
							},
							include: {
								team: true,
							},
						})
					).map(async (membership) => ({
						...membership,
						team: {
							...membership.team,
							avatarUrl: membership.team.avatarUrl
								? await getSignedUrl(membership.team.avatarUrl, {
										bucket: process.env
											.NEXT_PUBLIC_AVATARS_BUCKET_NAME as string,
										expiresIn: 360,
									})
								: null,
						},
					})),
				)
			: null;

		return {
			...user,
			avatarUrl: await getUserAvatarUrl(user.avatarUrl),
			teamMemberships,
			impersonatedBy,
			activeTeamId: session.teamId,
		};
	});
