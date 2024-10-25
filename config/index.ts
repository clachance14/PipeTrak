import type { Config } from "./types";

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
		localeCookieName: "NEXT_LOCALE",
	},
	organizations: {
		enable: true,
		enableBilling: true,
		enableUsersToCreateOrganizations: true,
		avatarColors: ["#4e6df5", "#e5a158", "#9dbee5", "#ced3d9"],
		forbiddenOrganizationSlugs: [
			"new-organization",
			"admin",
			"settings",
			"ai-demo",
		],
	},
	users: {
		enableBilling: true,
		enableOnboarding: false,
	},
	auth: {
		enableSignup: true,
		redirectAfterSignIn: "/app",
		redirectAfterLogout: "/",
		sessionCookieMaxAge: 60 * 60 * 24 * 30,
	},
	mailing: {
		provider: "plunk",
		from: "hello@your-domain.com",
	},
	ui: {
		enabledThemes: ["light", "dark"],
		defaultTheme: "light",
		saas: {
			enabled: true,
			useSidebarLayout: true,
		},
		marketing: {
			enabled: true,
		},
	},
	storage: {
		bucketNames: {
			avatars: process.env.NEXT_PUBLIC_AVATARS_BUCKET_NAME ?? "avatars",
		},
	},
	payments: {
		products: [
			{
				type: "subscription",
				productId: "price_1M9NO0FkmmuOs718SNBdrtPw",
				referenceId: "basic",
				interval: "month",
				price: 9,
				currency: "USD",
			},
			{
				type: "subscription",
				productId: "price_1M9NOjFkmmuOs718vaedJF6b",
				referenceId: "basic",
				interval: "year",
				price: 90,
				currency: "USD",
			},
			{
				type: "subscription",
				productId: "price_1M9kHDFkmmuOs718blksnsHJ",
				referenceId: "pro",
				interval: "month",
				price: 29,
				currency: "USD",
			},
			{
				type: "subscription",
				productId: "price_1M9kHqFkmmuOs718XRvjZ8l1",
				referenceId: "pro",
				interval: "year",
				price: 290,
				currency: "USD",
			},
			{
				type: "one-time",
				productId: "price_1PHjoxFkmmuOs718Orzx98rv",
				referenceId: "lifetime",
				price: 799,
				currency: "USD",
			},
		],
	},
} as const satisfies Config;

export type { Config };
