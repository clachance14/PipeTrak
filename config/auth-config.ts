/**
 * Three-Layer Authentication Configuration
 * 
 * Implements environment-aware authentication configuration following industry best practices:
 * 1. Base configuration - Shared across all environments
 * 2. Environment overrides - Specific to development/production
 * 3. Runtime selection - Based on environment detection
 */

// Temporarily disabled due to module resolution issues
// import { EnvironmentDetector } from "@repo/utils";
// import { getBaseUrl } from "@repo/utils";

// Inline getBaseUrl to avoid import issues
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
  // Simple environment detection inline
  const isLocalDev = process.env.NODE_ENV === 'development' && !process.env.VERCEL;
  const envName = isLocalDev ? 'local' : 'production';
  
  let config: AuthConfiguration;
  
  if (isLocalDev) {
    console.log('🔓 Using DEVELOPMENT auth configuration');
    config = developmentAuthConfig;
  } else {
    console.log('🔒 Using PRODUCTION auth configuration');
    config = productionAuthConfig;
  }
  
  // Validate configuration before returning
  validateAuthConfig(config, envName);
  
  return config;
}

/**
 * Validate auth configuration for security issues
 */
function validateAuthConfig(config: AuthConfiguration, environment: string): void {
  // Check for security issues in production
  if (environment === 'production') {
    if (config.allowInsecureSecrets) {
      throw new Error('SECURITY: allowInsecureSecrets cannot be true in production');
    }
    
    if (config.trustAllOrigins) {
      throw new Error('SECURITY: trustAllOrigins cannot be true in production');
    }
    
    if (config.mockUser) {
      throw new Error('SECURITY: mockUser cannot be set in production');
    }
    
    if (!process.env.BETTER_AUTH_SECRET) {
      throw new Error('SECURITY: BETTER_AUTH_SECRET is required in production');
    }
    
    if (!process.env.DATABASE_URL) {
      throw new Error('CONFIGURATION: DATABASE_URL is required in production');
    }
  }
  
  // Validate trusted origins
  if (!config.trustAllOrigins && config.trustedOrigins.length === 0) {
    console.warn('⚠️ WARNING: No trusted origins configured, this may cause CORS issues');
  }
  
  // Log configuration summary
  console.log(`📋 Auth Configuration Summary:
    Environment: ${environment}
    Auth Mode: ${config.validation.strict ? 'STRICT' : 'RELAXED'}
    Email Verification: ${config.validation.requireEmailVerification ? 'REQUIRED' : 'OPTIONAL'}
    Debug Mode: ${config.debugMode ? 'ENABLED' : 'DISABLED'}
    Trusted Origins: ${config.trustAllOrigins ? 'ALL' : config.trustedOrigins.length}
  `);
}

/**
 * Get auth secret with environment-aware fallback
 */
export function getAuthSecret(): string {
  const config = getAuthConfig();
  
  if (config.allowInsecureSecrets) {
    // Development fallback
    return process.env.BETTER_AUTH_SECRET || 'dev-only-secret-never-use-in-prod';
  }
  
  // Production - must have secret
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error('BETTER_AUTH_SECRET is required in production');
  }
  
  return secret;
}

/**
 * Check if a specific auth feature should be enabled
 */
export function isAuthFeatureEnabled(feature: keyof AuthConfiguration['features']): boolean {
  const config = getAuthConfig();
  return config.features[feature] ?? false;
}

/**
 * Get environment-specific auth URLs for OAuth providers
 */
export function getAuthUrls() {
  const config = getAuthConfig();
  const baseUrl = config.baseURL;
  
  return {
    signIn: `${baseUrl}/auth/login`,
    signUp: `${baseUrl}/auth/signup`,
    resetPassword: `${baseUrl}/auth/forgot-password`,
    verifyEmail: `${baseUrl}/auth/verify`,
    callback: `${baseUrl}/api/auth/callback`,
    session: `${baseUrl}/api/auth/get-session`,
  };
}