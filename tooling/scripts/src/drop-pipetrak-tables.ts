import { Client } from "pg";
import * as path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../../.env") });

async function dropPipeTrakTables() {
	console.log("🗑️  Dropping existing PipeTrak tables...\n");

	if (!process.env.DIRECT_URL) {
		throw new Error("DIRECT_URL environment variable is not set");
	}

	const connectionConfig: any = {
		connectionString: process.env.DIRECT_URL,
	};

	// For Supabase, handle SSL properly
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
		console.log("✅ Connected successfully\n");

		// List of tables to drop (in order due to foreign key constraints)
		const tablesToDrop = [
			"component_milestone",
			"component",
			"drawing",
			"milestone_template",
			"import_job",
			"audit_log",
		];

		console.log("🔨 Dropping tables...");
		for (const table of tablesToDrop) {
			try {
				await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE;`);
				console.log(`   ✓ Dropped ${table}`);
			} catch (error: any) {
				console.log(`   ⚠️  Could not drop ${table}: ${error.message}`);
			}
		}

		console.log("\n✅ PipeTrak tables dropped successfully!");
	} catch (error) {
		console.error("❌ Error during table drop:", error);
		throw error;
	} finally {
		console.log("\n🔌 Closing database connection...");
		await client.end();
	}
}

// Run the drop operation
dropPipeTrakTables()
	.then(() => {
		console.log("\n🎉 Table drop completed successfully!");
		process.exit(0);
	})
	.catch((error) => {
		console.error("\n💥 Table drop failed:", error.message);
		process.exit(1);
	});
