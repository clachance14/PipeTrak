#!/usr/bin/env tsx
import { Client } from "pg";

async function dropTrigger() {
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

		// Drop the trigger and function
		await client.query(
			'DROP TRIGGER IF EXISTS component_after_insert ON "Component"',
		);
		console.log("Dropped trigger component_after_insert");

		await client.query(
			"DROP FUNCTION IF EXISTS component_after_insert_trigger() CASCADE",
		);
		console.log("Dropped function component_after_insert_trigger");

		await client.query(
			"DROP FUNCTION IF EXISTS initialize_component_milestones(uuid) CASCADE",
		);
		await client.query(
			"DROP FUNCTION IF EXISTS initialize_component_milestones(text) CASCADE",
		);
		console.log("Dropped initialize_component_milestones functions");

		console.log("✅ Successfully removed all triggers and functions");
	} catch (error) {
		console.error("Error:", error);
	} finally {
		await client.end();
	}
}

dropTrigger().catch(console.error);
