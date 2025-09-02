#!/usr/bin/env tsx
import { Client } from "pg";

async function createStubFunction() {
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

		// Create a stub function that does nothing
		const functionSQL = `
CREATE OR REPLACE FUNCTION initialize_component_milestones(p_component_id text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Stub function that does nothing
  -- The seed script will handle milestone creation manually
  RETURN;
END;
$$;
    `;

		await client.query(functionSQL);
		console.log("Created stub initialize_component_milestones function");

		console.log("✅ Successfully created stub function");
	} catch (error) {
		console.error("Error:", error);
	} finally {
		await client.end();
	}
}

createStubFunction().catch(console.error);
