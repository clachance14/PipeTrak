import type { SessionUser } from "auth";
import { TeamMemberRoleSchema, UserRoleSchema, db } from "database";

export async function defineAbilitiesFor(user: SessionUser) {
	const teamMemberships =
		(await db.teamMembership.findMany({
			where: {
				userId: user.id,
			},
		})) ?? [];

	const isAdmin = user.role === UserRoleSchema.Values.ADMIN;

	const getTeamRole = (teamId: string) =>
		teamMemberships.find((m) => m.teamId === teamId)?.role ?? null;

	const isTeamOwner = (teamId: string) =>
		isAdmin || getTeamRole(teamId) === TeamMemberRoleSchema.Values.OWNER;

	const isTeamMember = (teamId: string) =>
		isTeamOwner(teamId) ||
		getTeamRole(teamId) === TeamMemberRoleSchema.Values.MEMBER;

	return {
		isAdmin,
		isTeamMember,
		isTeamOwner,
	};
}
