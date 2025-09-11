/**
 * Simplified Authentication Configuration
 * Temporary solution while fixing environment detector module resolution
 */

/**
 * Configuration interface for authentication settings
 */
export interface AuthConfiguration {
	// Core settings
	appName: string;
	baseURL: string;

	// Security settings
	skipEmailVerification: boolean;
	allowInsecureSecrets: boolean;
	trustAllOrigins: boolean;
	trustedOrigins: string[];

	// Session configuration
	session: {
		expiresIn: number;
		freshAge: number;
	};

	// Development features
	mockUser: any | null;
	debugMode: boolean;

	// Validation rules
	validation: {
		strict: boolean;
		requireEmailVerification: boolean;
		allowWeakPasswords: boolean;
	};

	// Provider configuration
	providers: string[];

	// Feature flags
	features: {
		magicLink: boolean;
		passkeys: boolean;
		socialLogin: boolean;
		twoFactor: boolean;
	};
}

function getBaseUrl() {
	if (process.env.NEXT_PUBLIC_SITE_URL) {
		return process.env.NEXT_PUBLIC_SITE_URL;
	}
	if (process.env.VERCEL_URL) {
		return `https://${process.env.VERCEL_URL}`;
	}
	if (process.env.NEXT_PUBLIC_VERCEL_URL) {
		return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
	}
	return `http://localhost:${process.env.PORT ?? 3000}`;
}

// Enhanced environment detection with logging
function detectEnvironment(): {
	env: string;
	isProduction: boolean;
	isPreview: boolean;
	isDevelopment: boolean;
	reasons: string[];
} {
	const reasons: string[] = [];

	// Production detection: actual production domain (pipetrak.co)
	const isProduction: boolean =
		process.env.VERCEL_ENV === "production" &&
		Boolean(
			process.env.NEXT_PUBLIC_SITE_URL?.includes("pipetrak.co") ||
				process.env.NEXT_PUBLIC_SITE_URL?.includes(
					"pipe-trak.vercel.app",
				),
		);
	if (isProduction) {
		reasons.push(
			`Production detected: VERCEL_ENV=${process.env.VERCEL_ENV}, SITE_URL=${process.env.NEXT_PUBLIC_SITE_URL}`,
		);
	}

	// Preview detection: Vercel preview deployments (not production)
	const isPreview: boolean = Boolean(
		(process.env.VERCEL_ENV === "preview" ||
			(process.env.VERCEL_URL && !isProduction) ||
			(process.env.VERCEL && process.env.NODE_ENV !== "development")) &&
			!isProduction,
	);
	if (isPreview) {
		reasons.push(
			`Preview detected: VERCEL_ENV=${process.env.VERCEL_ENV}, VERCEL_URL=${process.env.VERCEL_URL}, NODE_ENV=${process.env.NODE_ENV}`,
		);
	}

	// Development detection: local development environment
	const isDevelopment: boolean = Boolean(
		!process.env.VERCEL && process.env.NODE_ENV === "development",
	);
	if (isDevelopment) {
		reasons.push(
			`Development detected: No VERCEL env, NODE_ENV=${process.env.NODE_ENV}`,
		);
	}

	// Fallback detection
	if (!isProduction && !isPreview && !isDevelopment) {
		reasons.push(
			`Fallback case: VERCEL_ENV=${process.env.VERCEL_ENV}, NODE_ENV=${process.env.NODE_ENV}, VERCEL=${process.env.VERCEL}`,
		);
	}

	const env = isProduction
		? "production"
		: isPreview
			? "preview"
			: isDevelopment
				? "development"
				: "unknown";

	return { env, isProduction, isPreview, isDevelopment, reasons };
}

/**
 * Base configuration shared across all environments
 */
const baseAuthConfig: Partial<AuthConfiguration> = {
	appName: "PipeTrak",

	session: {
		expiresIn: 60 * 60 * 24 * 30, // 30 days
		freshAge: 0,
	},

	providers: ["email", "magicLink"],

	features: {
		magicLink: true,
		passkeys: true,
		socialLogin: false, // Disabled by default, can be enabled per environment
		twoFactor: false,
	},
};

/**
 * Development configuration (relaxed security for developer productivity)
 */
const developmentAuthConfig: AuthConfiguration = {
	...baseAuthConfig,
	baseURL: getBaseUrl(),

	// Security settings - relaxed for development
	skipEmailVerification: true,
	allowInsecureSecrets: true,
	trustAllOrigins: true,
	trustedOrigins: ["*"],

	// Development features
	mockUser: process.env.MOCK_USER ? JSON.parse(process.env.MOCK_USER) : null,
	debugMode: true,

	// Validation - lenient for development
	validation: {
		strict: false,
		requireEmailVerification: false,
		allowWeakPasswords: true,
	},

	// Enable additional features in development
	features: {
		...(baseAuthConfig.features || {}),
		socialLogin: true, // Allow testing social login in development
	},
} as AuthConfiguration;

/**
 * Production configuration (strict security)
 */
const productionAuthConfig: AuthConfiguration = {
	...baseAuthConfig,
	baseURL: getBaseUrl(),

	// Security settings - strict for production
	skipEmailVerification: false,
	allowInsecureSecrets: false,
	trustAllOrigins: false,
	trustedOrigins: [
		process.env.NEXT_PUBLIC_SITE_URL,
		"https://pipetrak.co",
		"https://www.pipetrak.co",
		"https://pipe-trak.vercel.app",
		"https://pipe-trak-cory-lachances-projects.vercel.app",
	].filter(Boolean) as string[],

	// Production features
	mockUser: null,
	debugMode: false,

	// Validation - strict for production
	validation: {
		strict: true,
		requireEmailVerification: true,
		allowWeakPasswords: false,
	},

	// Production feature set
	features: {
		...(baseAuthConfig.features || {}),
		twoFactor: true, // Enable 2FA in production
	},
} as AuthConfiguration;

/**
 * Preview configuration (moderate security for testing)
 */
const previewAuthConfig: AuthConfiguration = {
	...baseAuthConfig,
	baseURL: getBaseUrl(),

	// Security settings - moderate for preview deployments
	skipEmailVerification: true, // No email verification for easier testing
	allowInsecureSecrets: true,
	trustAllOrigins: true, // Accept all origins for preview deployments
	trustedOrigins: ["*"], // Wildcard for preview

	// Preview features
	mockUser: null,
	debugMode: true, // Enable debug logging for troubleshooting

	// Validation - relaxed for preview
	validation: {
		strict: false,
		requireEmailVerification: false, // No email verification barrier
		allowWeakPasswords: true,
	},

	// Preview feature set
	features: {
		...(baseAuthConfig.features || {}),
		socialLogin: true, // Enable for testing
		twoFactor: false, // Disable 2FA for easier testing
	},
} as AuthConfiguration;

/**
 * Get the appropriate auth configuration based on current environment
 */
export function getAuthConfig(): AuthConfiguration {
	const detection = detectEnvironment();
	let config: AuthConfiguration;

	// Select configuration based on environment
	if (detection.isProduction) {
		console.log("🔒 Using PRODUCTION auth configuration");
		config = productionAuthConfig;
	} else if (detection.isPreview) {
		console.log("🔧 Using PREVIEW auth configuration");
		config = previewAuthConfig;
	} else {
		console.log("🔓 Using DEVELOPMENT auth configuration");
		config = developmentAuthConfig;
	}

	// Log detailed environment detection
	console.log(`🔍 Environment Detection Results:
    Environment: ${detection.env.toUpperCase()}
    Detection Reasons:
      ${detection.reasons.map((reason) => `- ${reason}`).join("\n      ")}
    
    Configuration Applied:
      Base URL: ${config.baseURL}
      Auth Mode: ${config.validation.strict ? "STRICT" : "RELAXED"}
      Email Verification: ${config.validation.requireEmailVerification ? "REQUIRED" : "OPTIONAL"}
      Trust All Origins: ${config.trustAllOrigins ? "YES" : "NO"}
      Trusted Origins: ${config.trustAllOrigins ? "ALL" : config.trustedOrigins.join(", ")}
      Debug Mode: ${config.debugMode ? "ENABLED" : "DISABLED"}
      Mock User: ${config.mockUser ? "ENABLED" : "DISABLED"}
      
    Features Enabled:
      Magic Link: ${config.features.magicLink ? "YES" : "NO"}
      Passkeys: ${config.features.passkeys ? "YES" : "NO"}
      Social Login: ${config.features.socialLogin ? "YES" : "NO"}
      Two Factor: ${config.features.twoFactor ? "YES" : "NO"}
  `);

	return config;
}

/**
 * Get auth secret with fallback (restored original behavior)
 */
export function getAuthSecret(): string {
	// Always use fallback for now - restore original behavior
	return process.env.BETTER_AUTH_SECRET || "better-auth-fallback-secret";
}

/**
 * Check if a specific auth feature should be enabled
 */
export function isAuthFeatureEnabled(
	feature: keyof AuthConfiguration["features"],
): boolean {
	const config = getAuthConfig();
	return config.features[feature] ?? false;
}
