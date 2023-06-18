import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prismaClient } from "database";

export const adapter = PrismaAdapter(prismaClient);

export { getUserByEmail, getUserById } from "database";
