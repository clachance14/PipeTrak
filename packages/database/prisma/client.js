import { ComponentStatus, Prisma, PrismaClient } from "./generated/client";
export { PrismaClient, Prisma, ComponentStatus };
const prismaClientSingleton = () => {
    // Build connection URL with pool configuration
    // Support both DATABASE_URL (dev) and POSTGRES_URL (Vercel production)
    const baseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
    const urlWithPool = baseUrl.includes("?")
        ? `${baseUrl}&connection_limit=50&pool_timeout=60`
        : `${baseUrl}?connection_limit=50&pool_timeout=60`;
    return new PrismaClient({
        log: process.env.NODE_ENV === "development"
            ? ["error", "warn"]
            : ["error"],
        datasources: {
            db: {
                url: urlWithPool,
            },
        },
    });
};
// biome-ignore lint/suspicious/noRedeclare: This is a singleton
const prisma = globalThis.prisma ?? prismaClientSingleton();
if (process.env.NODE_ENV !== "production") {
    globalThis.prisma = prisma;
}
export { prisma as db };
