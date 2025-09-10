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

// Simple environment detection
function isLocalDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' && !process.env.VERCEL;
}

/**
 * Base configuration shared across all environments
 */
const baseAuthConfig: Partial<AuthConfiguration> = {
  appName: 'PipeTrak',
  
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    freshAge: 0,
  },
  
  providers: ['email', 'magicLink'],
  
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
  trustedOrigins: ['*'],
  
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
    'https://pipe-trak.vercel.app',
    'https://pipe-trak-cory-lachances-projects.vercel.app',
    // Add more production domains as needed
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
 * Get the appropriate auth configuration based on current environment
 */
export function getAuthConfig(): AuthConfiguration {
  const isLocal = isLocalDevelopment();
  const envName = isLocal ? 'local' : 'production';
  
  let config: AuthConfiguration;
  
  if (isLocal) {
    console.log('🔓 Using DEVELOPMENT auth configuration (simple)');
    config = developmentAuthConfig;
  } else {
    console.log('🔒 Using PRODUCTION auth configuration (simple)');
    config = productionAuthConfig;
  }
  
  // Log configuration summary
  console.log(`📋 Auth Configuration Summary:
    Environment: ${envName}
    Auth Mode: ${config.validation.strict ? 'STRICT' : 'RELAXED'}
    Email Verification: ${config.validation.requireEmailVerification ? 'REQUIRED' : 'OPTIONAL'}
    Debug Mode: ${config.debugMode ? 'ENABLED' : 'DISABLED'}
    Trusted Origins: ${config.trustAllOrigins ? 'ALL' : config.trustedOrigins.length}
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
export function isAuthFeatureEnabled(feature: keyof AuthConfiguration['features']): boolean {
  const config = getAuthConfig();
  return config.features[feature] ?? false;
}