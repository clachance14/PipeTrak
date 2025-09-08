import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

console.log("[i18n.ts] File loaded (Edge-compatible version)");

// Edge Runtime compatible configuration - no workspace package imports
const locales = ["en", "de"] as const;
const defaultLocale = "en";
const localeCookieName = "NEXT_LOCALE";

export default getRequestConfig(async ({ requestLocale }) => {
	console.log(
		"[i18n.ts] getRequestConfig called with requestLocale:",
		requestLocale,
	);

	try {
		let locale = await requestLocale;

		// If no locale from URL, check cookie
		if (!locale) {
			console.log("[i18n.ts] No requestLocale, checking cookie");
			const cookieStore = await cookies();
			locale = cookieStore.get(localeCookieName)?.value || defaultLocale;
			console.log("[i18n.ts] Cookie locale:", locale);
		}

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
