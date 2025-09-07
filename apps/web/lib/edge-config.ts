// Edge-compatible configuration for middleware
// Contains only the minimal config values needed for middleware execution

export const edgeConfig = {
	appName: "PipeTrak",
	i18n: {
		enabled: true,
		locales: {
			en: {
				currency: "USD",
				label: "English",
			},
			de: {
				currency: "USD",
				label: "Deutsch",
			},
		},
		defaultLocale: "en",
		defaultCurrency: "USD",
		localeCookieName: "NEXT_LOCALE",
	},
	ui: {
		saas: {
			// Whether the saas part should be enabled (otherwise all routes will redirect to the marketing page)
			enabled: true,
		},
		marketing: {
			// Whether the marketing features should be enabled (otherwise all routes will redirect to the saas part)
			enabled: true,
		},
	},
} as const;
