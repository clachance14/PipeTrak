import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";
import {
	accounts,
	aiChats,
	invitations,
	members,
	organizations,
	passkeys,
	purchases,
	sessions,
	users,
	verifications,
} from "./schema";

export const AiChatSchema = createSelectSchema(aiChats);
export const UserSchema = createSelectSchema(users);
export const UserUpdateSchema = createUpdateSchema(users, {
	id: z.string(),
});
export const OrganizationSchema = createSelectSchema(organizations);
export const OrganizationUpdateSchema = createUpdateSchema(organizations, {
	id: z.string(),
});
export const MemberSchema = createSelectSchema(members);
export const InvitationSchema = createSelectSchema(invitations);
export const PurchaseSchema = createSelectSchema(purchases);
export type Purchase = typeof purchases.$inferSelect;
export const PurchaseInsertSchema = createInsertSchema(purchases);
export const PurchaseUpdateSchema = createUpdateSchema(purchases, {
	id: z.string(),
});
export const SessionSchema = createSelectSchema(sessions);
export const AccountSchema = createSelectSchema(accounts);
export const VerificationSchema = createSelectSchema(verifications);
export const PasskeySchema = createSelectSchema(passkeys);
