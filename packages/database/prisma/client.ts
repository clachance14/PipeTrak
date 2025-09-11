import { ComponentStatus, Prisma, PrismaClient } from "@prisma/client";

export { PrismaClient, Prisma, ComponentStatus };

const prismaClientSingleton = () => {
	// Build connection URL with pool configuration
	// Support both DATABASE_URL (dev) and POSTGRES_URL (Vercel production)
	const baseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";

	// For Vercel/serverless environments, use pgbouncer mode to handle prepared statements
	const isServerless =
		process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
	const poolParams = isServerless
		? "?pgbouncer=true&connection_limit=1&pool_timeout=20"
		: "?connection_limit=50&pool_timeout=60";

	const urlWithPool = baseUrl.includes("?")
		? `${baseUrl}&${poolParams.substring(1)}`
		: `${baseUrl}${poolParams}`;

	return new PrismaClient({
		log:
			process.env.NODE_ENV === "development"
				? ["error", "warn"]
				: ["error"],
		datasources: {
			db: {
				url: urlWithPool,
			},
		},
	});
};

declare global {
	var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

// biome-ignore lint/suspicious/noRedeclare: This is a singleton
const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
	globalThis.prisma = prisma;
}

export { prisma as db };
