// Temporarily disabled due to type export issues during auth system refactoring
// import type { ActiveOrganization } from "../auth";

// Temporary type until auth system is fully operational
interface TempActiveOrganization {
	members: Array<{
		userId: string;
		role: string;
	}>;
}

export function isOrganizationAdmin(
	organization?: TempActiveOrganization | null,
	user?: {
		id: string;
		role?: string | null;
	} | null,
) {
	const userOrganizationRole = organization?.members.find(
		(member: any) => member.userId === user?.id,
	)?.role;

	return (
		["owner", "admin"].includes(userOrganizationRole ?? "") ||
		user?.role === "admin"
	);
}
