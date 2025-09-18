#!/usr/bin/env node

/**
 * Script to copy Prisma Query Engine binaries to the correct locations
 * for Vercel serverless deployment compatibility
 */

const fs = require("fs");
const path = require("path");

// Paths
const repoRoot = path.join(__dirname, "..");
const sourceDir = path.join(
	repoRoot,
	"packages",
	"database",
	"prisma",
	"generated",
	"client",
);
const nextDir = path.join(repoRoot, "apps", "web", ".next");

const targetDirs = [
	// Standard Next.js server output
	path.join(nextDir, "server"),
	// Standalone output used by Vercel's serverless runtime
	path.join(
		nextDir,
		"standalone",
		"apps",
		"web",
		"prisma",
		"generated",
		"client",
	),
	// Vercel expected paths from runtime error logs
	path.join(repoRoot, "apps", "web", "prisma", "generated", "client"),
	path.join(repoRoot, "apps", "web", ".prisma", "client"),
	path.join(repoRoot, "apps", "web", ".next", "server"),
	// Additional Vercel runtime paths
	path.join(
		nextDir,
		"standalone",
		"packages",
		"database",
		"prisma",
		"generated",
		"client",
	),
	// Vercel serverless function root directory
	path.join(nextDir, "standalone"),
	// Temp directory used during lambda execution
	"/tmp/prisma-engines",
];

// Engine files to copy (binary engine for Vercel)
const engineFiles = [
	"query-engine-rhel-openssl-3.0.x",
];

function copyFile(src, dest) {
	try {
		// Ensure destination directory exists
		const destDir = path.dirname(dest);
		if (!fs.existsSync(destDir)) {
			fs.mkdirSync(destDir, { recursive: true });
		}

		// Copy file if source exists
		if (fs.existsSync(src)) {
			fs.copyFileSync(src, dest);
			// Make binary executable
			fs.chmodSync(dest, 0o755);
			console.log(
				`✅ Copied: ${path.relative(process.cwd(), src)} → ${path.relative(process.cwd(), dest)}`,
			);
			return true;
		} else {
			console.warn(
				`⚠️  Source not found: ${path.relative(process.cwd(), src)}`,
			);
			return false;
		}
	} catch (error) {
		console.error(`❌ Failed to copy ${src} to ${dest}:`, error.message);
		return false;
	}
}

function main() {
	console.log(
		"🔧 Copying Prisma Query Engine binaries for Vercel deployment...\n",
	);

	if (!fs.existsSync(sourceDir)) {
		console.error(`❌ Source directory not found: ${sourceDir}`);
		console.error("Make sure Prisma client has been generated first.");
		process.exit(1);
	}

	let successCount = 0;
	let totalFiles = 0;

	// Copy engine files to all target directories
	for (const targetDir of targetDirs) {
		console.log(
			`📁 Target directory: ${path.relative(process.cwd(), targetDir)}`,
		);

		for (const engineFile of engineFiles) {
			const src = path.join(sourceDir, engineFile);
			const dest = path.join(targetDir, engineFile);

			totalFiles++;
			if (copyFile(src, dest)) {
				successCount++;
			}
		}
		console.log("");
	}

	// Summary
	console.log(
		`📊 Summary: ${successCount}/${totalFiles} files copied successfully`,
	);

	if (successCount === totalFiles) {
		console.log("✅ All Prisma Query Engine binaries copied successfully!");
		process.exit(0);
	} else {
		console.log(
			"⚠️  Some files could not be copied. Check the warnings above.",
		);
		process.exit(0); // Don't fail the build, just warn
	}
}

// Run if called directly
if (require.main === module) {
	main();
}

module.exports = { main, copyFile };
