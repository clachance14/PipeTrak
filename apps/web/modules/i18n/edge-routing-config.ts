import { defineRouting } from "next-intl/routing";
import { edgeConfig } from "../../lib/edge-config";

export const routing = defineRouting({
	locales: Object.keys(edgeConfig.i18n.locales),
	defaultLocale: edgeConfig.i18n.defaultLocale,
	localeCookie: {
		name: edgeConfig.i18n.localeCookieName,
	},
	localePrefix: edgeConfig.i18n.enabled ? "always" : "never",
	localeDetection: edgeConfig.i18n.enabled,
});
