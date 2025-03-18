import { eq } from "drizzle-orm";
import type { z } from "zod";
import { db } from "../client";
import { purchases } from "../schema/postgres";
import type { PurchaseInsertSchema, PurchaseUpdateSchema } from "../zod";

export async function getPurchasesByOrganizationId(organizationId: string) {
	return db.query.purchases.findMany({
		where: (purchase, { eq }) =>
			eq(purchase.organizationId, organizationId),
	});
}

export async function getPurchasesByUserId(userId: string) {
	return db.query.purchases.findMany({
		where: (purchase, { eq }) => eq(purchase.userId, userId),
	});
}

export async function getPurchaseById(id: string) {
	return db.query.purchases.findFirst({
		where: (purchase, { eq }) => eq(purchase.id, id),
	});
}

export async function getPurchaseBySubscriptionId(subscriptionId: string) {
	return db.query.purchases.findFirst({
		where: (purchase, { eq }) =>
			eq(purchase.subscriptionId, subscriptionId),
	});
}

export async function createPurchase(
	purchase: z.infer<typeof PurchaseInsertSchema>,
) {
	const [{ id }] = await db
		.insert(purchases)
		.values(purchase)
		.returning({ id: purchases.id });

	return getPurchaseById(id);
}

export async function updatePurchase(
	purchase: z.infer<typeof PurchaseUpdateSchema>,
) {
	const [{ id }] = await db
		.update(purchases)
		.set(purchase)
		.returning({ id: purchases.id });

	return getPurchaseById(id);
}

export async function deletePurchaseBySubscriptionId(subscriptionId: string) {
	await db
		.delete(purchases)
		.where(eq(purchases.subscriptionId, subscriptionId));
}
