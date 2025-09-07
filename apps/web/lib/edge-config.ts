// Edge-compatible configuration for middleware
// Contains only the minimal config values needed for middleware execution

export const edgeConfig = {
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
