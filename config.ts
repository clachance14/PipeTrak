export const config = {
	i18n: {
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
	},
	teams: {
		avatarColors: ["#4e6df5", "#e5a158", "#9dbee5", "#ced3d9"],
	},
	auth: {
		redirectAfterLogout: "/",
	},
	mailing: {
		provider: "postmark",
		from: "hello@your-domain.com",
	},
} as const satisfies Config;

export type Config = {
	i18n: {
		locales: { [locale: string]: { currency: string; label: string } };
		defaultLocale: string;
		defaultCurrency: string;
	};
	teams: { avatarColors: string[] };
	auth: { redirectAfterLogout: string };
	mailing: {
		provider:
			| "custom"
			| "console"
			| "plunk"
			| "resend"
			| "postmark"
			| "nodemailer";
		from: string;
	};
};

export type Locale = keyof (typeof config)["i18n"]["locales"];
