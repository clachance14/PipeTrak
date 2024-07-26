export const appConfig = {
	i18n: {
		locales: ["en", "de"] as const,
		defaultLocale: "en" as const,
		localeLabels: {
			en: "English",
			de: "Deutsch",
			fr: "asdf",
		},
		localeCurrencies: {
			/* This only works with Stripe for now. For LemonSqueezy, we need to set the currency in the LemonSqueezy dashboard and there can only be one. */
			en: "USD",
			de: "USD",
		},
	},
	marketing: {
		menu: [
			{
				translationKey: "pricing",
				href: "/pricing",
			},
			{
				translationKey: "blog",
				href: "/Blog",
			},
		],
	},
	teams: {
		avatarColors: ["#4e6df5", "#e5a158", "#9dbee5", "#ced3d9"],
	},
	auth: {
		redirectAfterLogout: "/",
	},
};
