#!/usr/bin/env tsx
import { Client } from "pg";

async function checkFunctions() {
	const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
	if (!databaseUrl) {
		throw new Error("DATABASE_URL or DIRECT_URL must be set");
	}

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
		console.log("Connected to database");

		// Check what functions exist
		const result = await client.query(`
      SELECT routine_name, routine_type, data_type
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name LIKE '%initialize_component%'
    `);

		console.log("Functions found:", result.rows);

		// Check triggers
		const triggers = await client.query(`
      SELECT trigger_name, event_object_table, action_statement
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      AND event_object_table = 'Component'
    `);

		console.log("Triggers found:", triggers.rows);
	} catch (error) {
		console.error("Error:", error);
	} finally {
		await client.end();
	}
}

checkFunctions().catch(console.error);
