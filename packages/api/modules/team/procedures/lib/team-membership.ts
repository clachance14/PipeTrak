import { db } from "database";

export async function getOrCreateTeamMembershipForUser(userId: string) {
	const teamMembership = await db.teamMembership.findFirst({
		where: {
			userId,
		},
		select: {
			id: true,
			role: true,
			teamId: true,
		},
	});

	if (teamMembership) {
		return teamMembership;
	}

	const user = await db.user.findUniqueOrThrow({
		where: {
			id: userId,
		},
	});

	const newTeam = await db.team.create({
		data: {
			name: user.name ?? user.email.split("@")[0],
			memberships: {
				create: {
					userId,
					role: "OWNER",
				},
			},
		},
		select: {
			memberships: {
				select: {
					id: true,
					role: true,
					teamId: true,
				},
			},
		},
	});

	return newTeam.memberships[0];
}
