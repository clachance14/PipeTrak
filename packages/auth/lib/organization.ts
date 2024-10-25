import { db } from "@repo/database";

export async function getOrganizationMembership(
	userId: string,
	organizationId: string,
) {
	const membership = await db.member.findUnique({
		where: {
			userId_organizationId: {
				userId,
				organizationId,
			},
		},
	});

	return membership;
}

export async function getOrganizationMemberships(userId: string) {
	const memberships = await db.member.findMany({
		where: { userId },
	});

	return memberships;
}

export async function getOrganizationBySlug(slug: string) {
	const organization = await db.organization.findUnique({
		where: { slug },
	});

	return organization;
}
