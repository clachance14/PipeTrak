import { getRequestConfig } from "next-intl/server";

console.log("[i18n.ts] File loaded (Edge-compatible version)");

// Edge Runtime compatible configuration - no workspace package imports
const locales = ["en", "de"] as const;
const defaultLocale = "en";

export default getRequestConfig(async ({ requestLocale }) => {
	console.log(
		"[i18n.ts] getRequestConfig called with requestLocale:",
		requestLocale,
	);

	try {
		// Prefer the locale from the URL segment; avoid reading cookies during SSG
		let locale = (await requestLocale) || defaultLocale;

		// Validate locale
		if (!locales.includes(locale as any)) {
			console.log(
				"[i18n.ts] Invalid locale, using default:",
				defaultLocale,
			);
			locale = defaultLocale;
		}

		console.log("[i18n.ts] Loading messages for locale:", locale);

		// Load messages directly from local files (Edge Runtime compatible)
		const messages = (await import(`./messages/${locale}.json`)).default;

		console.log("[i18n.ts] Config generated successfully, locale:", locale);
		return {
			locale,
			messages,
		};
	} catch (error) {
		console.error("[i18n.ts] Error during config generation:", error);
		console.error(
			"[i18n.ts] Error message:",
			error instanceof Error ? error.message : "Unknown error",
		);
		console.error(
			"[i18n.ts] Error stack:",
			error instanceof Error ? error.stack : "No stack",
		);
		throw error;
	}
});
