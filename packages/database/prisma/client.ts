import fs from "node:fs";
import path from "node:path";

import { ComponentStatus, Prisma, PrismaClient } from "./generated/client";

export { PrismaClient, Prisma, ComponentStatus };

const hasLoggedEngineProbe = { value: false };

const copyFile = (src: string, dest: string) => {
	try {
		const srcStat = fs.statSync(src, { throwIfNoEntry: false });
		if (!srcStat?.isFile()) {
			return { success: false as const, reason: "source-not-file" };
		}
		const destDir = path.dirname(dest);
		fs.mkdirSync(destDir, { recursive: true });
		fs.copyFileSync(src, dest);
		fs.chmodSync(dest, 0o755);
		return { success: true as const };
	} catch (error) {
		return {
			success: false as const,
			reason: error instanceof Error ? error.message : String(error),
		};
	}
};

const logPrismaEngineProbe = (context: string) => {
	if (hasLoggedEngineProbe.value) {
		return;
	}
	hasLoggedEngineProbe.value = true;

	const shouldLog =
		process.env.PRISMA_ENGINE_DEBUG === "1" ||
		process.env.PRISMA_ENGINE_TRACE === "1" ||
		process.env.VERCEL === "1";

	if (!shouldLog) {
		return;
	}

	const cwd = process.cwd();
	const prismaDir = __dirname;
	const engineCandidates = [
		{
			label: "package-generated",
			file: path.join(
				cwd,
				"packages",
				"database",
				"prisma",
				"generated",
				"client",
				"query-engine-rhel-openssl-3.0.x",
			),
		},
		{
			label: "app-prisma",
			file: path.join(
				cwd,
				"apps",
				"web",
				"prisma",
				"generated",
				"client",
				"query-engine-rhel-openssl-3.0.x",
			),
		},
		{
			label: "app-dot-prisma",
			file: path.join(
				cwd,
				"apps",
				"web",
				".prisma",
				"client",
				"query-engine-rhel-openssl-3.0.x",
			),
		},
		{
			label: "next-server",
			file: path.join(
				cwd,
				"apps",
				"web",
				".next",
				"server",
				"query-engine-rhel-openssl-3.0.x",
			),
		},
		{
			label: "next-standalone-package",
			file: path.join(
				cwd,
				".next",
				"standalone",
				"packages",
				"database",
				"prisma",
				"generated",
				"client",
				"query-engine-rhel-openssl-3.0.x",
			),
		},
		{
			label: "next-standalone-app",
			file: path.join(
				cwd,
				".next",
				"standalone",
				"apps",
				"web",
				"prisma",
				"generated",
				"client",
				"query-engine-rhel-openssl-3.0.x",
			),
		},
		{
			label: "tmp",
			file: path.join("/tmp", "prisma-engines", "query-engine-rhel-openssl-3.0.x"),
		},
		{
			label: "local-dir",
			file: path.join(
				prismaDir,
				"generated",
				"client",
				"query-engine-rhel-openssl-3.0.x",
			),
		},
		{
			label: "root-packages",
			file: path.join(
				cwd,
				"..",
				"..",
				"packages",
				"database",
				"prisma",
				"generated",
				"client",
				"query-engine-rhel-openssl-3.0.x",
			),
		},
		{
			label: "root-dot-prisma",
			file: path.join(
				cwd,
				"..",
				"..",
				".prisma",
				"client",
				"query-engine-rhel-openssl-3.0.x",
			),
		},
	];

	const runtimeBinaries = engineCandidates.map((candidate) => {
		try {
			const stat = fs.statSync(candidate.file, { throwIfNoEntry: false });
			return {
				label: candidate.label,
				path: candidate.file,
				exists: Boolean(stat),
				size: stat?.size ?? 0,
			};
		} catch (error) {
			return {
				label: candidate.label,
				path: candidate.file,
				exists: false,
				error: error instanceof Error ? error.message : String(error),
				size: 0,
			};
		}
	});

	const existingBinary = runtimeBinaries.find(
		(binary) => binary.exists && binary.size > 0,
	);

	let binarySelection: {
		from?: string;
		target?: string;
		copyResult?: Record<string, unknown>;
	} | undefined;

	if (existingBinary) {
		const binaryPath = existingBinary.path;
		const binaryName = path.basename(binaryPath);
		const tmpBinaryPath = path.join(
			"/tmp",
			"prisma-engines",
			binaryName,
		);
		const copyResult = copyFile(binaryPath, tmpBinaryPath);
		if (copyResult.success) {
			process.env.PRISMA_QUERY_ENGINE_BINARY = tmpBinaryPath;
			binarySelection = { from: binaryPath, target: tmpBinaryPath };
		} else {
			process.env.PRISMA_QUERY_ENGINE_BINARY = binaryPath;
			binarySelection = {
				from: binaryPath,
				target: binaryPath,
				copyResult,
			};
		}
	}

	const schemaCandidates = [
		path.join(__dirname, "generated", "client", "schema.prisma"),
		path.join(cwd, "packages", "database", "prisma", "generated", "client", "schema.prisma"),
		existingBinary
			? path.join(path.dirname(existingBinary.path), "schema.prisma")
			: undefined,
		path.join(cwd, "..", "..", "packages", "database", "prisma", "generated", "client", "schema.prisma"),
	].filter(Boolean) as string[];

	const schemaPath = schemaCandidates.find((candidate) =>
		fs.existsSync(candidate),
	);

	let schemaSelection:
		| {
				from?: string;
				target?: string;
				copyResult?: Record<string, unknown>;
			}
		| undefined;

	if (schemaPath) {
		const tmpSchemaPath = path.join(
			"/tmp",
			"prisma-engines",
			"schema.prisma",
		);
		const copyResult = copyFile(schemaPath, tmpSchemaPath);
		if (copyResult.success) {
			process.env.PRISMA_SCHEMA_PATH = tmpSchemaPath;
			schemaSelection = { from: schemaPath, target: tmpSchemaPath };
		} else {
			process.env.PRISMA_SCHEMA_PATH = schemaPath;
			schemaSelection = {
				from: schemaPath,
				target: schemaPath,
				copyResult,
			};
		}
	}

	process.env.PRISMA_CLIENT_ENGINE_TYPE = "binary";

	const envOverrides = {
		PRISMA_QUERY_ENGINE_LIBRARY: process.env.PRISMA_QUERY_ENGINE_LIBRARY,
		PRISMA_QUERY_ENGINE_BINARY: process.env.PRISMA_QUERY_ENGINE_BINARY,
		NODE_ENV: process.env.NODE_ENV,
		VERCEL: process.env.VERCEL,
		VERCEL_ENV: process.env.VERCEL_ENV,
		REGION: process.env.VERCEL_REGION,
		PRISMA_SCHEMA_PATH: process.env.PRISMA_SCHEMA_PATH,
		PRISMA_CLIENT_ENGINE_TYPE: process.env.PRISMA_CLIENT_ENGINE_TYPE,
	};

	console.error(
		"[PRISMA_ENGINE_DEBUG] probe",
		JSON.stringify(
			{
				context,
				cwd,
				prismaDir,
				envOverrides,
				runtimeBinaries,
				binarySelection,
				schemaSelection,
			},
			null,
			2,
		),
	);
};

const prismaClientSingleton = () => {
	// Build connection URL with pool configuration
	// Support both DATABASE_URL (dev) and POSTGRES_URL (Vercel production)
	const baseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
	const urlWithPool = baseUrl.includes("?")
		? `${baseUrl}&connection_limit=50&pool_timeout=60`
		: `${baseUrl}?connection_limit=50&pool_timeout=60`;

	// Configure Prisma client with Vercel-specific settings
	const clientConfig: any = {
		log:
			process.env.NODE_ENV === "development"
				? ["error", "warn"]
				: ["error"],
		datasources: {
			db: {
				url: urlWithPool,
			},
		},
	};

	// Examine deployment runtime for Prisma engine availability in serverless
	logPrismaEngineProbe("client-initialization");

	try {
		const client = new PrismaClient(clientConfig);
		client.$use(async (params, next) => {
			logPrismaEngineProbe(
				`middleware:${params.model ?? "unknown"}.${params.action ?? "unknown"}`,
			);
			return next(params);
		});
		return client;
	} catch (error) {
		logPrismaEngineProbe("client-constructor-error");
		throw error;
	}
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
