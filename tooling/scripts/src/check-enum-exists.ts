import { Client } from "pg";
import * as path from "path";
import dotenv from "dotenv";

// Handle SSL issues with Supabase
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../../.env") });

async function checkEnumExists() {
	console.log("🔍 Checking if ComponentType enum exists in database...");

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
		console.log("✅ Connected to database");

		// Check if the enum exists
		const enumQuery = `
      SELECT 
        t.typname as enum_name,
        t.oid,
        string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as enum_values
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typname = 'ComponentType'
      GROUP BY t.typname, t.oid;
    `;

		const enumResult = await client.query(enumQuery);

		if (enumResult.rows.length === 0) {
			console.log("❌ ComponentType enum NOT found");

			// Check what enums do exist
			const allEnumsQuery = `
        SELECT 
          t.typname as enum_name,
          string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as enum_values
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid  
        GROUP BY t.typname
        ORDER BY t.typname;
      `;

			const allEnumsResult = await client.query(allEnumsQuery);
			console.log("\n📋 Existing enums in database:");
			if (allEnumsResult.rows.length === 0) {
				console.log("   No enums found");
			} else {
				allEnumsResult.rows.forEach((row) => {
					console.log(`   ${row.enum_name}: ${row.enum_values}`);
				});
			}
		} else {
			const enumData = enumResult.rows[0];
			console.log("✅ ComponentType enum found!");
			console.log(`   Name: ${enumData.enum_name}`);
			console.log(`   OID: ${enumData.oid}`);
			console.log(`   Values: ${enumData.enum_values}`);
		}

		// Check the Component table structure
		console.log("\n🔍 Checking Component table structure...");
		const columnQuery = `
      SELECT 
        column_name, 
        data_type, 
        udt_name,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'Component' AND column_name = 'type';
    `;

		const columnResult = await client.query(columnQuery);
		if (columnResult.rows.length === 0) {
			console.log("❌ Component.type column not found");
		} else {
			const column = columnResult.rows[0];
			console.log("📊 Component.type column info:");
			console.log(`   Column: ${column.column_name}`);
			console.log(`   Data Type: ${column.data_type}`);
			console.log(`   UDT Name: ${column.udt_name}`);
			console.log(`   Nullable: ${column.is_nullable}`);
			console.log(`   Default: ${column.column_default}`);
		}

		// Try to get some sample data
		console.log("\n🔍 Checking existing components...");
		const sampleQuery = `SELECT id, "componentId", type FROM "Component" LIMIT 3;`;
		try {
			const sampleResult = await client.query(sampleQuery);
			console.log(
				`📊 Found ${sampleResult.rows.length} existing components:`,
			);
			sampleResult.rows.forEach((row, index) => {
				console.log(`   ${index + 1}. ${row.componentId}: ${row.type}`);
			});
		} catch (error) {
			console.log("❌ Could not query components:", error.message);
		}
	} catch (error) {
		console.error("❌ Error:", error);
		throw error;
	} finally {
		await client.end();
	}
}

// Run check
checkEnumExists()
	.then(() => {
		console.log("\n✅ Check complete");
		process.exit(0);
	})
	.catch((error) => {
		console.error("\n💥 Check failed:", error.message);
		process.exit(1);
	});
