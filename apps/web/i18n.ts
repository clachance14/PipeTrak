import { getRequestConfig } from "next-intl/server";

console.log("[i18n.ts] File loaded");

// Re-export the configuration from the modules directory
export default getRequestConfig(async ({ requestLocale }) => {
	console.log(
		"[i18n.ts] getRequestConfig called with requestLocale:",
		requestLocale,
	);

	try {
		console.log("[i18n.ts] Attempting to import ./modules/i18n/request");
		const { default: requestConfig } = await import(
			"./modules/i18n/request"
		);
		console.log("[i18n.ts] Import successful, calling requestConfig");

		const result = await requestConfig({ requestLocale });
		console.log(
			"[i18n.ts] Config generated successfully, locale:",
			result.locale,
		);
		return result;
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
