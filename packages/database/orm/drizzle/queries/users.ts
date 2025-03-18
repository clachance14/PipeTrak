import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { z } from "zod";
import { db } from "../client";
import { accounts, users } from "../schema/postgres";
import type { UserUpdateSchema } from "../zod";

export async function getUsers({
	limit,
	offset,
	query,
}: {
	limit: number;
	offset: number;
	query?: string;
}) {
	return await db.query.users.findMany({
		where: (user, { like }) => like(user.name, `%${query}%`),
		limit,
		offset,
	});
}

export async function countAllUsers() {
	return db.$count(users);
}

export async function getUserById(id: string) {
	return await db.query.users.findFirst({
		where: (user, { eq }) => eq(user.id, id),
	});
}

export async function getUserByEmail(email: string) {
	return await db.query.users.findFirst({
		where: (user, { eq }) => eq(user.email, email),
	});
}

export async function createUser({
	email,
	name,
	role,
	emailVerified,
	onboardingComplete,
}: {
	email: string;
	name: string;
	role: "admin" | "user";
	emailVerified: boolean;
	onboardingComplete: boolean;
}) {
	const [{ id }] = await db.insert(users).values({
		id: nanoid(),
		email,
		name,
		role,
		emailVerified,
		onboardingComplete,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	const user = await getUserById(id);

	return user;
}

export async function getAccountById(id: string) {
	return await db.query.accounts.findFirst({
		where: (account, { eq }) => eq(account.id, id),
	});
}

export async function createUserAccount({
	userId,
	providerId,
	accountId,
	hashedPassword,
}: {
	userId: string;
	providerId: string;
	accountId: string;
	hashedPassword?: string;
}) {
	const [{ id }] = await db.insert(accounts).values({
		id: nanoid(),
		userId,
		accountId,
		providerId,
		createdAt: new Date(),
		updatedAt: new Date(),
		password: hashedPassword,
	});

	const account = await getAccountById(id);

	return account;
}

export async function updateUser(user: z.infer<typeof UserUpdateSchema>) {
	return db.update(users).set(user).where(eq(users.id, user.id));
}
