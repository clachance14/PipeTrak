export { PrismaClient } from "@prisma/client";
export * from "./client";
export * from "./zod";
export * from "./queries";

declare global {
	namespace PrismaJson {
		type AIChatMessages = Array<{
			role: "user" | "assistant";
			content: string;
		}>;
	}
}
