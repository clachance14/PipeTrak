import { Client } from "pg";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../../.env") });

async function createPipeTrakTables() {
	console.log("🚀 Starting PipeTrak table migration...");

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

		// Read the SQL file
		const sqlPath = path.join(
			__dirname,
			"../../../packages/database/supabase/tables/create-pipetrak-tables.sql",
		);
		console.log(`📄 Reading SQL from: ${sqlPath}`);

		if (!fs.existsSync(sqlPath)) {
			throw new Error(`SQL file not found at: ${sqlPath}`);
		}

		const sql = fs.readFileSync(sqlPath, "utf-8");
		console.log(`📝 SQL script loaded (${sql.length} characters)`);

		// Execute the SQL
		console.log("🔨 Creating tables...");
		await client.query(sql);
		console.log("✅ PipeTrak tables created successfully!");

		// List created tables
		const verifyQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('Drawing', 'Component', 'ComponentMilestone', 'MilestoneTemplate', 'ImportJob', 'AuditLog')
      ORDER BY table_name;
    `;

		const result = await client.query(verifyQuery);
		console.log("\n📋 Created tables:");
		result.rows.forEach((row) => {
			console.log(`   ✓ ${row.table_name}`);
		});
	} catch (error) {
		console.error("❌ Error during migration:", error);
		throw error;
	} finally {
		console.log("🔌 Closing database connection...");
		await client.end();
	}
}

// Run the migration
createPipeTrakTables()
	.then(() => {
		console.log("\n🎉 Migration completed successfully!");
		process.exit(0);
	})
	.catch((error) => {
		console.error("\n💥 Migration failed:", error.message);
		process.exit(1);
	});
