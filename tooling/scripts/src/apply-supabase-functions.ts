import { Client } from "pg";
import * as path from "path";
import * as fs from "fs";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../../.env") });

async function applySupabaseFunctions() {
	console.log("🚀 Applying Supabase RPC functions...\n");

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
		await client.connect();
		console.log("✅ Connected to database\n");

		// Read the SQL file
		const sqlPath = path.join(
			__dirname,
			"../../../packages/database/supabase/functions/pipetrak-functions-fixed.sql",
		);
		const sql = fs.readFileSync(sqlPath, "utf8");

		console.log("📝 Executing SQL functions...");

		// Split by function definitions and execute each one
		const statements = sql.split(/^-- Function/gm).filter((s) => s.trim());

		for (let i = 0; i < statements.length; i++) {
			if (statements[i].includes("CREATE OR REPLACE FUNCTION")) {
				const functionMatch = statements[i].match(/FUNCTION\s+(\w+)/);
				const functionName = functionMatch
					? functionMatch[1]
					: `Statement ${i + 1}`;

				try {
					await client.query("-- Function" + statements[i]);
					console.log(`  ✅ ${functionName}`);
				} catch (error: any) {
					console.error(`  ❌ ${functionName}: ${error.message}`);
				}
			}
		}

		// Also execute the full script as a single transaction for triggers and grants
		console.log("\n📝 Applying triggers and permissions...");
		try {
			await client.query(sql);
			console.log(
				"  ✅ All functions, triggers, and permissions applied",
			);
		} catch (error: any) {
			// This might fail if functions already exist, which is OK
			if (error.message.includes("already exists")) {
				console.log("  ⚠️  Some objects already exist (this is OK)");
			} else {
				console.error(
					"  ❌ Error applying full script:",
					error.message,
				);
			}
		}

		// Test the functions
		console.log("\n🧪 Testing functions...");

		// Test get_project_progress
		try {
			const result = await client.query(
				`
        SELECT get_project_progress($1) as progress
      `,
				["clzr8yc5w002rr0iq5j5gnx9k"],
			); // Using the Project ID from seed data

			if (result.rows[0]?.progress) {
				const progress = result.rows[0].progress;
				console.log("  ✅ get_project_progress works");
				console.log(
					`     - Total components: ${progress.overall?.total_components || 0}`,
				);
				console.log(
					`     - Average completion: ${Math.round(progress.overall?.avg_completion || 0)}%`,
				);
			}
		} catch (error: any) {
			console.error("  ❌ get_project_progress failed:", error.message);
		}

		// Test calculate_component_completion
		try {
			// Get a sample component ID
			const componentResult = await client.query(`
        SELECT id FROM "Component" LIMIT 1
      `);

			if (componentResult.rows[0]) {
				const componentId = componentResult.rows[0].id;
				const result = await client.query(
					`
          SELECT calculate_component_completion($1) as completion
        `,
					[componentId],
				);

				console.log("  ✅ calculate_component_completion works");
				console.log(
					`     - Completion: ${Math.round(result.rows[0].completion || 0)}%`,
				);
			}
		} catch (error: any) {
			console.error(
				"  ❌ calculate_component_completion failed:",
				error.message,
			);
		}

		console.log("\n✅ Supabase functions deployment complete!");
	} catch (error) {
		console.error("❌ Error during deployment:", error);
		throw error;
	} finally {
		await client.end();
	}
}

// Run deployment
applySupabaseFunctions()
	.then(() => {
		console.log("\n🎉 Success! Supabase functions are ready to use.");
		process.exit(0);
	})
	.catch((error) => {
		console.error("\n💥 Deployment failed:", error.message);
		process.exit(1);
	});
