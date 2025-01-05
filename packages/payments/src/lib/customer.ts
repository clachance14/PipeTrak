import { db } from "@repo/database";

export async function setCustomerIdToEntity(
	customerId: string,
	{ organizationId, userId }: { organizationId?: string; userId?: string },
) {
	if (organizationId) {
		await db.organization.update({
			where: { id: organizationId },
			data: { paymentsCustomerId: customerId },
		});
	} else if (userId) {
		await db.user.update({
			where: { id: userId },
			data: { paymentsCustomerId: customerId },
		});
	}
}

export const getCustomerIdFromEntity = async ({
	organizationId,
	userId,
}: { organizationId?: string; userId?: string }) => {
	if (organizationId) {
		return (
			(
				await db.organization.findUnique({
					where: { id: organizationId },
				})
			)?.paymentsCustomerId ?? null
		);
	}

	if (userId) {
		return (
			(
				await db.user.findUnique({
					where: { id: userId },
				})
			)?.paymentsCustomerId ?? null
		);
	}

	return null;
};
