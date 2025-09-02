#!/usr/bin/env tsx

import { Client } from "pg";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../../../.env.local") });

export interface SQLExecutorOptions {
	connectionString?: string;
	showProgress?: boolean;
	continueOnError?: boolean;
	dryRun?: boolean;
}

export interface ExecutionResult {
	success: boolean;
	statementsExecuted: number;
	statementsSkipped: number;
	errors: Array<{ statement: string; error: string }>;
}

export interface DatabaseInfo {
	version?: Array<{ version: string }>;
	tables?: Array<{ table_name: string; table_type: string }>;
	functions?: Array<{ routine_name: string; routine_type: string }>;
}

export interface DatabaseInfoError {
	error: string;
}

export class SQLExecutor {
	private client: Client;
	private options: SQLExecutorOptions;
	private isConnected = false;

	constructor(options: SQLExecutorOptions = {}) {
		// Always use DIRECT_URL for schema operations
		const connectionString =
			options.connectionString || process.env.DIRECT_URL;

		if (!connectionString) {
			throw new Error("DIRECT_URL not found in environment variables");
		}

		this.client = new Client({
			connectionString,
			ssl: {
				rejectUnauthorized: false,
				ca: undefined,
			},
		});

		this.options = {
			showProgress: true,
			continueOnError: false,
			dryRun: false,
			...options,
		};
	}

	/**
	 * Connect to the database with timeout handling
	 */
	async connect(timeoutMs = 10000): Promise<void> {
		if (this.isConnected) {
			if (this.options.showProgress) {
				console.log("🔌 Already connected to database");
			}
			return;
		}

		if (this.options.showProgress) {
			console.log("🔌 Connecting to database...");
		}

		const connectPromise = this.client.connect();
		const timeoutPromise = new Promise<never>((_, reject) =>
			setTimeout(
				() => reject(new Error("Connection timeout")),
				timeoutMs,
			),
		);

		try {
			await Promise.race([connectPromise, timeoutPromise]);
			this.isConnected = true;
			if (this.options.showProgress) {
				console.log("✅ Connected successfully");
			}
		} catch (error: any) {
			throw new Error(`Failed to connect: ${error.message}`);
		}
	}

	/**
	 * Close the database connection
	 */
	async disconnect(): Promise<void> {
		if (!this.isConnected) {
			return;
		}

		try {
			await this.client.end();
			this.isConnected = false;
			if (this.options.showProgress) {
				console.log("🔌 Database connection closed");
			}
		} catch (error) {
			// Ignore disconnect errors but reset state
			this.isConnected = false;
		}
	}

	/**
	 * Execute SQL from a file
	 */
	async executeSQLFile(filePath: string): Promise<ExecutionResult> {
		if (!fs.existsSync(filePath)) {
			throw new Error(`SQL file not found: ${filePath}`);
		}

		const sqlContent = fs.readFileSync(filePath, "utf-8");

		if (this.options.showProgress) {
			console.log(`📄 Executing SQL file: ${path.basename(filePath)}`);
		}

		return this.executeSQLContent(sqlContent);
	}

	/**
	 * Execute SQL content string
	 */
	async executeSQLContent(sqlContent: string): Promise<ExecutionResult> {
		const statements = this.parseSQLStatements(sqlContent);

		if (this.options.showProgress) {
			console.log(`📊 Found ${statements.length} SQL statements`);
		}

		if (this.options.dryRun) {
			console.log("🔍 DRY RUN - No statements will be executed");
			statements.forEach((stmt, index) => {
				console.log(`${index + 1}. ${this.truncateStatement(stmt)}`);
			});
			return {
				success: true,
				statementsExecuted: 0,
				statementsSkipped: statements.length,
				errors: [],
			};
		}

		const result: ExecutionResult = {
			success: true,
			statementsExecuted: 0,
			statementsSkipped: 0,
			errors: [],
		};

		for (let i = 0; i < statements.length; i++) {
			const statement = statements[i];

			if (this.options.showProgress) {
				console.log(
					`\n📝 Executing statement ${i + 1}/${statements.length}:`,
				);
				console.log(`   ${this.truncateStatement(statement)}`);
			}

			try {
				await this.client.query(statement);
				result.statementsExecuted++;

				if (this.options.showProgress) {
					console.log("   ✅ Success");
				}
			} catch (error: any) {
				const errorInfo = {
					statement: this.truncateStatement(statement),
					error: error.message,
				};

				result.errors.push(errorInfo);

				if (error.message.includes("already exists")) {
					result.statementsSkipped++;
					if (this.options.showProgress) {
						console.log("   ⚠️  Already exists (skipped)");
					}
				} else {
					if (this.options.showProgress) {
						console.log(`   ❌ Error: ${error.message}`);
					}

					if (!this.options.continueOnError) {
						result.success = false;
						throw new Error(
							`SQL execution failed at statement ${i + 1}/${statements.length}: ${error.message}`,
						);
					}

					result.success = false;
				}
			}
		}

		return result;
	}

	/**
	 * Execute a single SQL statement
	 */
	async executeStatement(sql: string): Promise<any> {
		if (this.options.dryRun) {
			console.log("🔍 DRY RUN:", this.truncateStatement(sql));
			return null;
		}

		try {
			const result = await this.client.query(sql);
			if (this.options.showProgress) {
				console.log("✅ Statement executed successfully");
			}
			return result;
		} catch (error: any) {
			if (this.options.showProgress) {
				console.error(`❌ Statement failed: ${error.message}`);
			}
			throw error;
		}
	}

	/**
	 * Test database connectivity
	 */
	async testConnection(): Promise<boolean> {
		try {
			const result = await this.client.query("SELECT 1 as test");
			return result.rows[0]?.test === 1;
		} catch (error) {
			return false;
		}
	}

	/**
	 * Get database information
	 */
	async getDatabaseInfo(): Promise<DatabaseInfo> {
		const queries = {
			version: "SELECT version() as version",
			tables: `
        SELECT table_name, table_type 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `,
			functions: `
        SELECT routine_name, routine_type 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        ORDER BY routine_name
      `,
		};

		const info: DatabaseInfo = {};

		for (const [key, query] of Object.entries(queries)) {
			try {
				const result = await this.client.query(query);
				(info as any)[key] = result.rows;
			} catch (error: any) {
				(info as any)[key] = { error: error.message };
			}
		}

		return info;
	}

	/**
	 * Parse SQL content into executable statements
	 * Handles PostgreSQL functions with $$ delimiters properly
	 */
	private parseSQLStatements(sqlContent: string): string[] {
		const statements: string[] = [];
		let currentStatement = "";
		let inFunction = false;
		let dollarTag = "";

		const lines = sqlContent.split("\n");

		for (const line of lines) {
			// Skip standalone comment lines and empty lines, but preserve inline comments
			if (
				(line.trim().startsWith("--") &&
					currentStatement.trim() === "") ||
				line.trim() === ""
			) {
				continue;
			}

			currentStatement += line + "\n";

			// Check for dollar-quoted function start/end markers
			// Match patterns like $$, $tag$, $body$, etc.
			const dollarMatches = line.match(/\$([^$]*)\$/g);
			if (dollarMatches) {
				for (const match of dollarMatches) {
					const tag = match.substring(1, match.length - 1); // Extract tag between $$

					if (!inFunction) {
						// Starting a function
						inFunction = true;
						dollarTag = tag;
					} else if (tag === dollarTag) {
						// Ending the function with matching tag
						inFunction = false;
						dollarTag = "";

						// End of function statement
						if (line.trim().endsWith(";")) {
							statements.push(currentStatement.trim());
							currentStatement = "";
						}
						break; // Found closing tag, stop processing other matches
					}
				}
			} else if (!inFunction && line.trim().endsWith(";")) {
				// Regular statement end (not inside a function)
				statements.push(currentStatement.trim());
				currentStatement = "";
			}
		}

		// Add any remaining statement
		if (currentStatement.trim()) {
			statements.push(currentStatement.trim());
		}

		return statements.filter((stmt) => stmt.length > 0);
	}

	/**
	 * Truncate statement for display
	 */
	private truncateStatement(statement: string): string {
		const cleaned = statement.replace(/\s+/g, " ").trim();
		return cleaned.length > 80 ? cleaned.substring(0, 80) + "..." : cleaned;
	}
}

/**
 * Convenience function to execute a SQL file
 */
export async function executeSQLFile(
	filePath: string,
	options: SQLExecutorOptions = {},
): Promise<ExecutionResult> {
	const executor = new SQLExecutor(options);

	try {
		await executor.connect();
		const result = await executor.executeSQLFile(filePath);

		const showProgress =
			options.showProgress !== undefined ? options.showProgress : true;
		if (showProgress) {
			console.log("\n📊 Execution Summary:");
			console.log(
				`   ✅ Statements executed: ${result.statementsExecuted}`,
			);
			console.log(
				`   ⚠️  Statements skipped: ${result.statementsSkipped}`,
			);
			console.log(`   ❌ Errors: ${result.errors.length}`);

			if (result.errors.length > 0) {
				console.log("\n🚨 Error Details:");
				result.errors.forEach((err, index) => {
					console.log(`   ${index + 1}. ${err.statement}`);
					console.log(`      Error: ${err.error}`);
				});
			}
		}

		return result;
	} finally {
		await executor.disconnect();
	}
}

/**
 * Convenience function to execute SQL content
 */
export async function executeSQLContent(
	sqlContent: string,
	options: SQLExecutorOptions = {},
): Promise<ExecutionResult> {
	const executor = new SQLExecutor(options);

	try {
		await executor.connect();
		return await executor.executeSQLContent(sqlContent);
	} finally {
		await executor.disconnect();
	}
}

/**
 * Convenience function to test database connection
 */
export async function testDatabaseConnection(
	showProgress = false,
): Promise<boolean> {
	const executor = new SQLExecutor({ showProgress });

	try {
		await executor.connect();
		return await executor.testConnection();
	} catch (error) {
		return false;
	} finally {
		await executor.disconnect();
	}
}
