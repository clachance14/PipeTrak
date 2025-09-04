import { Client } from "pg";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

// Handle SSL issues with Supabase
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../../.env") });

async function applyComponentTypeMigration() {
	console.log("🚀 Applying ComponentType enum migration...");

	if (!process.env.DIRECT_URL) {
		throw new Error("DIRECT_URL environment variable is not set");
	}

	// Parse connection string and add SSL config
	const connectionConfig: any = {
		connectionString: process.env.DIRECT_URL,
	};

	// For Supabase, we need to handle SSL properly
	if (process.env.DIRECT_URL?.includes("supabase")) {
		connectionConfig.ssl = {
			rejectUnauthorized: false,
			ca: undefined,
		};
	}

	const client = new Client(connectionConfig);

	try {
		console.log("📡 Connecting to database...");
		await client.connect();
		console.log("✅ Connected successfully");

		// Read the migration SQL file
		const sqlPath = path.join(
			__dirname,
			"../../../packages/database/supabase/migrations/20250814120000_add_component_type_enum.sql",
		);
		console.log(`📄 Reading migration from: ${sqlPath}`);

		if (!fs.existsSync(sqlPath)) {
			throw new Error(`Migration file not found at: ${sqlPath}`);
		}

		const sql = fs.readFileSync(sqlPath, "utf-8");
		console.log(`📝 Migration script loaded (${sql.length} characters)`);

		// Execute the migration
		console.log("🔨 Applying migration...");

		// Split SQL into individual statements and execute one by one
		const statements = sql
			.split(";")
			.map((s) => s.trim())
			.filter((s) => s.length > 0 && !s.startsWith("--"));

		for (let i = 0; i < statements.length; i++) {
			const statement = statements[i];
			if (statement.trim()) {
				console.log(
					`📝 Executing statement ${i + 1}/${statements.length}...`,
				);
				try {
					await client.query(statement);
					console.log(`✅ Statement ${i + 1} completed`);
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error);
					console.log(`❌ Statement ${i + 1} failed:`, errorMessage);
					if (errorMessage.includes("already exists")) {
						console.log(
							"⚠️  Resource already exists, continuing...",
						);
					} else {
						throw error;
					}
				}
			}
		}

		console.log("✅ ComponentType enum migration applied successfully!");
	} catch (error) {
		console.error("❌ Error during migration:", error);
		throw error;
	} finally {
		console.log("🔌 Closing database connection...");
		await client.end();
	}
}

// Run the migration
applyComponentTypeMigration()
	.then(() => {
		console.log("\n🎉 Migration completed successfully!");
		process.exit(0);
	})
	.catch((error) => {
		console.error("\n💥 Migration failed:", error.message);
		process.exit(1);
	});
