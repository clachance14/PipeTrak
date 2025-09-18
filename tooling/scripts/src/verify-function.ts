#!/usr/bin/env tsx
import { Client } from "pg";

async function verifyFunction() {
	const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
	if (!databaseUrl) {
		throw new Error("DATABASE_URL or DIRECT_URL must be set");
	}

	console.log("Using database URL:", `${databaseUrl.substring(0, 30)}...`);

	const url = new URL(databaseUrl);
	const client = new Client({
		host: url.hostname,
		port: Number.parseInt(url.port),
		database: url.pathname.substring(1),
		user: url.username,
		password: url.password,
		ssl: { rejectUnauthorized: false },
	});

	try {
		await client.connect();
		console.log("✅ Connected to database");

		// Test if the function exists
		const result = await client.query(`
      SELECT 
        proname,
        proargtypes,
        prosrc
      FROM pg_proc 
      WHERE proname = 'initialize_component_milestones'
    `);

		if (result.rows.length > 0) {
			console.log(
				"✅ Function exists:",
				result.rows.length,
				"version(s)",
			);
			result.rows.forEach((row, i) => {
				console.log(
					`  Version ${i + 1}: arg types = ${row.proargtypes}`,
				);
			});
		} else {
			console.log("❌ Function does not exist");
		}

		// Test calling the function with a dummy ID
		try {
			await client.query(
				`SELECT initialize_component_milestones('test-id')`,
			);
			console.log("✅ Function can be called successfully");
		} catch (err: any) {
			console.log("❌ Function call failed:", err.message);
		}
	} catch (error) {
		console.error("Database error:", error);
	} finally {
		await client.end();
		console.log("Disconnected from database");
	}
}

verifyFunction().catch(console.error);
