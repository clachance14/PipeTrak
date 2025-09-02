import { Client } from "pg";
import * as path from "path";
import dotenv from "dotenv";

// Handle SSL issues with Supabase
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../../.env") });

async function fixComponentTypeMigration() {
	console.log("🔧 Fixing ComponentType enum migration...");

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

		// Step 1: Normalize existing component types to uppercase
		console.log("📝 Step 1: Normalizing existing component types...");

		const normalizeQuery = `
      UPDATE "Component" 
      SET type = UPPER(type)
      WHERE type IS NOT NULL;
    `;

		const normalizeResult = await client.query(normalizeQuery);
		console.log(
			`✅ Normalized ${normalizeResult.rowCount} component types to uppercase`,
		);

		// Step 2: Update invalid types to valid enum values
		console.log("📝 Step 2: Mapping invalid types to valid enum values...");

		const mappingQueries = [
			`UPDATE "Component" SET type = 'SPOOL' WHERE UPPER(type) IN ('SPOOL', 'PIPE', 'PIPING');`,
			`UPDATE "Component" SET type = 'VALVE' WHERE UPPER(type) = 'VALVE';`,
			`UPDATE "Component" SET type = 'FITTING' WHERE UPPER(type) IN ('FITTING', 'ELBOW', 'TEE');`,
			`UPDATE "Component" SET type = 'FLANGE' WHERE UPPER(type) = 'FLANGE';`,
			`UPDATE "Component" SET type = 'GASKET' WHERE UPPER(type) = 'GASKET';`,
			`UPDATE "Component" SET type = 'SUPPORT' WHERE UPPER(type) IN ('SUPPORT', 'HANGER');`,
			`UPDATE "Component" SET type = 'FIELD_WELD' WHERE UPPER(type) IN ('FIELD_WELD', 'WELD');`,
			`UPDATE "Component" SET type = 'INSTRUMENT' WHERE UPPER(type) = 'INSTRUMENT';`,
			`UPDATE "Component" SET type = 'INSULATION' WHERE UPPER(type) = 'INSULATION';`,
			`UPDATE "Component" SET type = 'PAINT' WHERE UPPER(type) = 'PAINT';`,
			`UPDATE "Component" SET type = 'OTHER' WHERE type NOT IN ('SPOOL', 'PIPING_FOOTAGE', 'THREADED_PIPE', 'FITTING', 'VALVE', 'FLANGE', 'GASKET', 'SUPPORT', 'FIELD_WELD', 'INSTRUMENT', 'INSULATION', 'PAINT');`,
		];

		for (const query of mappingQueries) {
			const result = await client.query(query);
			if (result.rowCount > 0) {
				console.log(`   Updated ${result.rowCount} components`);
			}
		}

		// Step 3: Create the ComponentType enum
		console.log("📝 Step 3: Creating ComponentType enum...");

		const createEnumQuery = `
      CREATE TYPE "ComponentType" AS ENUM (
        'SPOOL',
        'PIPING_FOOTAGE', 
        'THREADED_PIPE',
        'FITTING',
        'VALVE',
        'FLANGE',
        'GASKET',
        'SUPPORT',
        'FIELD_WELD',
        'INSTRUMENT',
        'INSULATION',
        'PAINT',
        'OTHER'
      );
    `;

		try {
			await client.query(createEnumQuery);
			console.log("✅ ComponentType enum created successfully");
		} catch (error) {
			if (error.message.includes("already exists")) {
				console.log(
					"⚠️  ComponentType enum already exists, skipping...",
				);
			} else {
				throw error;
			}
		}

		// Step 4: Convert the column type
		console.log(
			"📝 Step 4: Converting Component.type column to use enum...",
		);

		const alterColumnQuery = `
      ALTER TABLE "Component" 
      ALTER COLUMN "type" TYPE "ComponentType" 
      USING "type"::"ComponentType";
    `;

		await client.query(alterColumnQuery);
		console.log("✅ Component.type column converted to ComponentType enum");

		// Step 5: Verify the changes
		console.log("📝 Step 5: Verifying changes...");

		// Check enum exists
		const enumQuery = `
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = '"ComponentType"'::regtype 
      ORDER BY enumsortorder;
    `;

		const enumResult = await client.query(enumQuery);
		console.log(
			`✅ ComponentType enum has ${enumResult.rows.length} values:`,
			enumResult.rows.map((r) => r.enumlabel).join(", "),
		);

		// Check column type
		const columnQuery = `
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'Component' AND column_name = 'type';
    `;

		const columnResult = await client.query(columnQuery);
		if (columnResult.rows.length > 0) {
			const column = columnResult.rows[0];
			console.log(
				`✅ Component.type column: ${column.data_type} (${column.udt_name})`,
			);
		}

		// Check sample data
		const sampleQuery = `SELECT "componentId", type FROM "Component" LIMIT 5;`;
		const sampleResult = await client.query(sampleQuery);
		console.log("✅ Sample components:");
		sampleResult.rows.forEach((row) => {
			console.log(`   ${row.componentId}: ${row.type}`);
		});
	} catch (error) {
		console.error("❌ Error during migration:", error);
		throw error;
	} finally {
		await client.end();
	}
}

// Run the migration
fixComponentTypeMigration()
	.then(() => {
		console.log("\n🎉 ComponentType migration completed successfully!");
		process.exit(0);
	})
	.catch((error) => {
		console.error("\n💥 Migration failed:", error.message);
		process.exit(1);
	});
