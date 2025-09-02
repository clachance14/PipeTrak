#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

async function checkEmailTemplates() {
	console.log("📧 Email Template Analysis\n");

	const templatesDir = path.join(__dirname, "packages/mail/emails");

	try {
		const files = fs.readdirSync(templatesDir);
		const templateFiles = files.filter((file) => file.endsWith(".tsx"));

		console.log(`Found ${templateFiles.length} email templates:\n`);

		templateFiles.forEach((file) => {
			const templateName = file.replace(".tsx", "");
			const filePath = path.join(templatesDir, file);

			try {
				const content = fs.readFileSync(filePath, "utf8");

				console.log(`📄 Template: ${templateName}`);
				console.log(`   File: ${file}`);

				// Extract subject if defined
				const subjectMatch = content.match(
					/subject.*?['"`]([^'"`]+)['"`]/i,
				);
				if (subjectMatch) {
					console.log(`   Subject: ${subjectMatch[1]}`);
				}

				// Check for preview text
				const previewMatch = content.match(/<Preview[^>]*>([^<]+)</i);
				if (previewMatch) {
					console.log(`   Preview: ${previewMatch[1]}`);
				}

				// Check if it uses translations
				const hasTranslations =
					content.includes("translations") || content.includes("t(");
				console.log(
					`   Translations: ${hasTranslations ? "Yes" : "No"}`,
				);

				console.log("");
			} catch (error) {
				console.error(
					`   ❌ Error reading ${file}: ${error.message}\n`,
				);
			}
		});

		// Check the templates registration file
		const templatesIndexPath = path.join(
			__dirname,
			"packages/mail/src/util/templates.ts",
		);
		if (fs.existsSync(templatesIndexPath)) {
			console.log("🔧 Template Registration Check:");
			const templateRegistration = fs.readFileSync(
				templatesIndexPath,
				"utf8",
			);
			console.log("   File exists: ✅");

			templateFiles.forEach((file) => {
				const templateName = file.replace(".tsx", "");
				const isRegistered =
					templateRegistration.includes(templateName);
				console.log(
					`   ${templateName}: ${isRegistered ? "✅" : "❌"}`,
				);
			});
		}
	} catch (error) {
		console.error("❌ Error accessing templates directory:", error.message);
		console.log(
			"Make sure you're running this from the project root directory.",
		);
	}
}

async function checkEmailConfig() {
	console.log("\n⚙️  Email Configuration Check:\n");

	try {
		require("dotenv").config({ path: ".env.local" });

		console.log(
			"📧 From Address: onboarding@resend.dev (development domain)",
		);
		console.log(
			`🔑 API Key: ${process.env.RESEND_API_KEY ? "✅ Set" : "❌ Missing"}`,
		);

		if (process.env.RESEND_API_KEY) {
			const keyStart = process.env.RESEND_API_KEY.substring(0, 10);
			console.log(`🔑 Key Preview: ${keyStart}...`);
		}

		console.log("\n💡 Recommendations:");
		console.log(
			"   - Development domain (onboarding@resend.dev) may have delivery limitations",
		);
		console.log("   - Consider upgrading to custom domain for production");
		console.log(
			"   - Some email providers filter development domains more aggressively",
		);
	} catch (error) {
		console.error("❌ Error checking configuration:", error.message);
	}
}

console.log("🔍 PipeTrak Email System Analysis\n");
console.log("=====================================\n");

checkEmailTemplates();
checkEmailConfig();
