import { eq } from "drizzle-orm";
import { db } from "../client";
import { aiChats } from "../schema/postgres";

export async function getAiChatsByUserId({
	limit,
	offset,
	userId,
}: {
	limit: number;
	offset: number;
	userId: string;
}) {
	return await db.query.aiChats.findMany({
		where: (aiChat, { eq }) => eq(aiChat.userId, userId),
		limit,
		offset,
	});
}

export async function getAiChatsByOrganizationId({
	limit,
	offset,
	organizationId,
}: {
	limit: number;
	offset: number;
	organizationId: string;
}) {
	return await db.query.aiChats.findMany({
		where: (aiChat, { eq }) => eq(aiChat.organizationId, organizationId),
		limit,
		offset,
	});
}

export async function getAiChatById(id: string) {
	return db.query.aiChats.findFirst({
		where: (aiChat, { eq }) => eq(aiChat.id, id),
	});
}

export async function createAiChat({
	organizationId,
	userId,
	title,
}: {
	organizationId?: string;
	userId: string;
	title?: string;
}) {
	const [{ id }] = await db
		.insert(aiChats)
		.values({
			organizationId,
			userId,
			title,
		})
		.returning({ id: aiChats.id });

	const createdChat = await getAiChatById(id);

	if (!createdChat) {
		throw new Error("Failed to create chat");
	}

	return createdChat;
}

export async function updateAiChat({
	id,
	title,
	messages,
}: {
	id: string;
	title?: string;
	messages?: typeof aiChats.$inferInsert.messages;
}) {
	return await db
		.update(aiChats)
		.set({ title, messages })
		.where(eq(aiChats.id, id))
		.returning();
}

export async function deleteAiChat(id: string) {
	return await db.delete(aiChats).where(eq(aiChats.id, id));
}
