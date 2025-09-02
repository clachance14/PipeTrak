#!/usr/bin/env node

/**
 * Field Weld Workflow Test Runner
 *
 * Runs all field weld workflow tests in the correct order:
 * 1. Unit tests (WeldMilestoneModal)
 * 2. Integration tests (API)
 * 3. E2E tests (Complete workflow)
 *
 * Usage:
 * pnpm test:field-weld                    # Run all tests
 * pnpm test:field-weld --unit            # Run only unit tests
 * pnpm test:field-weld --integration     # Run only integration tests
 * pnpm test:field-weld --e2e             # Run only E2E tests
 * pnpm test:field-weld --watch           # Run in watch mode
 */

import { execSync } from "child_process";
import { performance } from "perf_hooks";

// ANSI colors for console output
const colors = {
	reset: "\x1b[0m",
	bright: "\x1b[1m",
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	magenta: "\x1b[35m",
	cyan: "\x1b[36m",
};

// Test configuration
interface TestConfig {
	name: string;
	command: string;
	description: string;
	timeout?: number; // milliseconds
}

const testSuites: Record<string, TestConfig[]> = {
	unit: [
		{
			name: "WeldMilestoneModal Component",
			command:
				"vitest run modules/pipetrak/components/milestones/__tests__/WeldMilestoneModal.test.tsx",
			description: "Unit tests for the WeldMilestoneModal component",
			timeout: 30000,
		},
	],
	integration: [
		{
			name: "Field Weld Milestone API",
			command:
				"vitest run modules/pipetrak/components/milestones/__tests__/field-weld-milestone-api.integration.test.ts",
			description:
				"Integration tests for milestone API with field weld support",
			timeout: 60000,
		},
	],
	e2e: [
		{
			name: "Field Weld Workflow E2E",
			command: "playwright test tests/e2e/field-weld-workflow.spec.ts",
			description: "End-to-end tests for complete field weld workflow",
			timeout: 300000, // 5 minutes
		},
	],
};

// Parse command line arguments
const args = process.argv.slice(2);
const flags = {
	unit: args.includes("--unit"),
	integration: args.includes("--integration"),
	e2e: args.includes("--e2e"),
	watch: args.includes("--watch"),
	verbose: args.includes("--verbose") || args.includes("-v"),
	bail: args.includes("--bail"), // Stop on first failure
	parallel: args.includes("--parallel"),
	coverage: args.includes("--coverage"),
	help: args.includes("--help") || args.includes("-h"),
};

// Show help
if (flags.help) {
	console.log(`
${colors.bright}Field Weld Workflow Test Runner${colors.reset}

${colors.cyan}Usage:${colors.reset}
  npm run test:field-weld [options]

${colors.cyan}Options:${colors.reset}
  --unit                Run only unit tests
  --integration         Run only integration tests
  --e2e                 Run only E2E tests
  --watch               Run in watch mode
  --verbose, -v         Verbose output
  --bail                Stop on first failure
  --parallel            Run tests in parallel (where supported)
  --coverage            Generate coverage report
  --help, -h            Show this help message

${colors.cyan}Examples:${colors.reset}
  npm run test:field-weld                    # Run all tests
  npm run test:field-weld --unit --watch     # Watch unit tests
  npm run test:field-weld --e2e --verbose    # Run E2E tests with verbose output
  npm run test:field-weld --integration --coverage  # Run integration tests with coverage

${colors.cyan}Test Suites:${colors.reset}
  ${colors.yellow}Unit Tests:${colors.reset}
    - WeldMilestoneModal component tests
    - Form validation and interaction tests
    - Accessibility and mobile responsiveness tests

  ${colors.yellow}Integration Tests:${colors.reset}
    - Milestone API with welder data support
    - Field weld record synchronization
    - Error handling and data consistency tests

  ${colors.yellow}E2E Tests:${colors.reset}
    - Complete workflow from component table to QC
    - Modal interactions and form submissions
    - Cross-browser and mobile device testing
`);
	process.exit(0);
}

// Determine which test suites to run
let suitesToRun: string[] = [];
if (flags.unit || flags.integration || flags.e2e) {
	if (flags.unit) suitesToRun.push("unit");
	if (flags.integration) suitesToRun.push("integration");
	if (flags.e2e) suitesToRun.push("e2e");
} else {
	// Run all suites by default
	suitesToRun = ["unit", "integration", "e2e"];
}

// Utility functions
function log(message: string, color: string = colors.reset) {
	console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
	const separator = "=".repeat(60);
	log(`\n${separator}`, colors.cyan);
	log(`${title}`, colors.bright);
	log(`${separator}`, colors.cyan);
}

function logSubsection(title: string) {
	log(`\n${colors.blue}${"-".repeat(40)}${colors.reset}`);
	log(`${title}`, colors.yellow);
	log(`${colors.blue}${"-".repeat(40)}${colors.reset}`);
}

function runCommand(
	command: string,
	options: { timeout?: number; cwd?: string } = {},
): boolean {
	try {
		const startTime = performance.now();

		if (flags.verbose) {
			log(`Executing: ${command}`, colors.cyan);
		}

		const result = execSync(command, {
			stdio: flags.verbose ? "inherit" : "pipe",
			timeout: options.timeout || 60000,
			cwd: options.cwd || process.cwd(),
			encoding: "utf8",
		});

		const endTime = performance.now();
		const duration = Math.round(endTime - startTime);

		if (flags.verbose && typeof result === "string") {
			log(result, colors.reset);
		}

		log(`✅ Completed in ${duration}ms`, colors.green);
		return true;
	} catch (error: any) {
		log(`❌ Failed: ${error.message}`, colors.red);

		if (flags.verbose && error.stdout) {
			log("\nSTDOUT:", colors.cyan);
			log(error.stdout, colors.reset);
		}

		if (error.stderr) {
			log("\nSTDERR:", colors.red);
			log(error.stderr, colors.reset);
		}

		return false;
	}
}

// Environment checks
function checkEnvironment(): boolean {
	log("Checking test environment...", colors.yellow);

	const checks = [
		{
			name: "Node.js version",
			command: "node --version",
			expected: /v1[6-9]\.|v[2-9][0-9]\./,
		},
		{
			name: "Database connection",
			command:
				"node -e \"console.log(process.env.DATABASE_URL ? '✅ DATABASE_URL set' : '❌ DATABASE_URL not set')\"",
			required: false,
		},
	];

	let allPassed = true;

	for (const check of checks) {
		try {
			const result = execSync(check.command, { encoding: "utf8" });

			if (check.expected && !check.expected.test(result)) {
				log(`❌ ${check.name}: ${result.trim()}`, colors.red);
				if (check.required !== false) allPassed = false;
			} else {
				log(`✅ ${check.name}: ${result.trim()}`, colors.green);
			}
		} catch (error) {
			log(`❌ ${check.name}: Failed to check`, colors.red);
			if (check.required !== false) allPassed = false;
		}
	}

	return allPassed;
}

// Setup test database
function setupTestDatabase(): boolean {
	if (suitesToRun.includes("integration") || suitesToRun.includes("e2e")) {
		log("Setting up test database...", colors.yellow);

		const setupCommands = [
			"pnpm db:push", // Ensure schema is up to date
			// Note: Test data setup is handled by individual tests
		];

		for (const command of setupCommands) {
			if (!runCommand(command, { timeout: 120000 })) {
				log("❌ Failed to setup test database", colors.red);
				return false;
			}
		}

		log("✅ Test database ready", colors.green);
	}

	return true;
}

// Run test suite
async function runTestSuite(suiteName: string): Promise<boolean> {
	logSubsection(`Running ${suiteName} tests`);

	const suite = testSuites[suiteName];
	if (!suite) {
		log(`❌ Unknown test suite: ${suiteName}`, colors.red);
		return false;
	}

	let allPassed = true;

	for (const test of suite) {
		log(`\nRunning: ${test.name}`, colors.bright);
		log(`Description: ${test.description}`, colors.cyan);

		let command = test.command;

		// Add watch flag if requested
		if (flags.watch) {
			if (command.includes("vitest")) {
				command = command.replace("vitest run", "vitest watch");
			} else if (command.includes("playwright")) {
				command += " --ui"; // Playwright UI mode for E2E
			}
		}

		// Add coverage flag if requested
		if (flags.coverage && command.includes("vitest")) {
			command += " --coverage";
		}

		// Add parallel flag if requested
		if (flags.parallel) {
			if (command.includes("vitest")) {
				command += " --reporter=verbose --threads";
			} else if (command.includes("playwright")) {
				command += " --workers=auto";
			}
		}

		const success = runCommand(command, { timeout: test.timeout });

		if (!success) {
			allPassed = false;
			if (flags.bail) {
				log("❌ Stopping due to --bail flag", colors.red);
				break;
			}
		}
	}

	return allPassed;
}

// Generate test report
function generateReport(results: Record<string, boolean>, totalTime: number) {
	logSection("Test Results Summary");

	const passed = Object.values(results).filter(Boolean).length;
	const total = Object.keys(results).length;
	const success = passed === total;

	log(
		`\n${colors.bright}Overall Result: ${success ? "✅ PASSED" : "❌ FAILED"}${colors.reset}`,
	);
	log(`Tests Suites: ${passed}/${total} passed`);
	log(`Total Time: ${Math.round(totalTime)}ms`);

	log("\nSuite Details:", colors.cyan);
	for (const [suite, passed] of Object.entries(results)) {
		const status = passed ? "✅ PASSED" : "❌ FAILED";
		const description =
			testSuites[suite]?.[0]?.description || "Unknown suite";
		log(`  ${status} ${suite} - ${description}`);
	}

	if (!success) {
		log(
			"\n⚠️  Some tests failed. Check the output above for details.",
			colors.yellow,
		);
		log("💡 Use --verbose flag for more detailed output.", colors.cyan);
	}

	return success;
}

// Main execution
async function main() {
	const startTime = performance.now();

	logSection("Field Weld Workflow Test Runner");

	log(`Test suites to run: ${suitesToRun.join(", ")}`, colors.cyan);
	log(`Flags: ${JSON.stringify(flags, null, 2)}`, colors.cyan);

	// Pre-flight checks
	if (!checkEnvironment()) {
		log("❌ Environment check failed", colors.red);
		process.exit(1);
	}

	if (!setupTestDatabase()) {
		log("❌ Database setup failed", colors.red);
		process.exit(1);
	}

	// Run test suites
	const results: Record<string, boolean> = {};

	for (const suiteName of suitesToRun) {
		const success = await runTestSuite(suiteName);
		results[suiteName] = success;

		// If running in watch mode, exit after first suite
		if (flags.watch) {
			log("\n👀 Watch mode - exiting after first suite", colors.yellow);
			break;
		}
	}

	// Generate report (skip in watch mode)
	if (!flags.watch) {
		const endTime = performance.now();
		const totalTime = endTime - startTime;

		const success = generateReport(results, totalTime);
		process.exit(success ? 0 : 1);
	}
}

// Handle process signals
process.on("SIGINT", () => {
	log("\n\n⚠️  Test run interrupted", colors.yellow);
	process.exit(1);
});

process.on("SIGTERM", () => {
	log("\n\n⚠️  Test run terminated", colors.yellow);
	process.exit(1);
});

// Run the script
main().catch((error) => {
	log(`\n❌ Unexpected error: ${error.message}`, colors.red);
	if (flags.verbose) {
		console.error(error);
	}
	process.exit(1);
});
