import type { Config } from "./types";

export const config = {
	// Internationalization
	i18n: {
		// Define all locales here that should be available in the app
		// You need to define a label that is shown in the language selector and a currency that should be used for pricing with this locale
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
		// The default locale is used if no locale is provided
		defaultLocale: "en",
		// The default currency is used for pricing if no currency is provided
		defaultCurrency: "USD",
		// The name of the cookie that is used to determine the locale
		localeCookieName: "NEXT_LOCALE",
	},
	// Organizations
	organizations: {
		// Whether organizations are enabled in general
		enable: true,
		// Whether billing for organizations should be enabled (below you can enable it for users instead)
		enableBilling: true,
		// Should users be able to create new organizations? Otherwise only admin users can create them
		enableUsersToCreateOrganizations: true,
		// These colors are used for placeholder avatar if the organization has no logo uploaded
		avatarColors: ["#4e6df5", "#e5a158", "#9dbee5", "#ced3d9"],
		// Define forbidden organization slugs. Make sure to add all paths that you define as a route after /app/... to avoid routing issues
		forbiddenOrganizationSlugs: [
			"new-organization",
			"admin",
			"settings",
			"ai-demo",
		],
	},
	// Users
	users: {
		// Whether billing should be enabled for users (above you can enable it for organizations instead)
		enableBilling: true,
		// Whether you want the user to go through an onboarding form after signup (can be defined in the OnboardingForm.tsx)
		enableOnboarding: false,
	},
	// Authentication
	auth: {
		// Whether users should be able to create accounts (otherwise users can only be by admins)
		enableSignup: true,
		// where users should be redirected after the sign in
		redirectAfterSignIn: "/app",
		// where users should be redirected after logout
		redirectAfterLogout: "/",
		// how long a session should be valid
		sessionCookieMaxAge: 60 * 60 * 24 * 30,
	},
	// Mails
	mails: {
		// the from address for mails
		from: "hello@your-domain.com",
	},
	// Frontend
	ui: {
		// the themes that should be available in the app
		enabledThemes: ["light", "dark"],
		// the default theme
		defaultTheme: "light",
		// the saas part of the application
		saas: {
			// whether the saas part should be enabled (otherwise all routes will be redirect to the marketing page)
			enabled: true,
			// whether the sidebar layout should be used
			useSidebarLayout: true,
		},
		// the marketing part of the application
		marketing: {
			// whether the marketing features should be enabled (otherwise all routes will be redirect to the saas part)
			enabled: true,
		},
	},
	// Storage
	storage: {
		// define the name of the buckets for the different types of files
		bucketNames: {
			avatars: process.env.NEXT_PUBLIC_AVATARS_BUCKET_NAME ?? "avatars",
		},
	},
	// Payments
	payments: {
		// define the products that should be available in the checkout
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
