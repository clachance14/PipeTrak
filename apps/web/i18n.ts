import { getRequestConfig } from "next-intl/server";

// Re-export the configuration from the modules directory
export default getRequestConfig(async ({ requestLocale }) => {
	const { default: requestConfig } = await import("./modules/i18n/request");
	return await requestConfig({ requestLocale });
});
