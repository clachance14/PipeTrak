/**
 * Environment Detection Utility
 * 
 * Provides reliable environment detection for PipeTrak across different deployment contexts.
 * Used to configure authentication and other environment-specific behaviors.
 */

export interface EnvironmentInfo {
  name: 'local' | 'vercel-dev' | 'production';
  isLocal: boolean;
  isDevelopment: boolean;
  isProduction: boolean;
  authMode: 'relaxed' | 'strict';
}

// Cache for environment info
let _cachedInfo: EnvironmentInfo | null = null;

/**
 * Check if running in local development (not on Vercel)
 */
export function isLocalDev(): boolean {
  return process.env.NODE_ENV === 'development' && !process.env.VERCEL;
}

/**
 * Check if running on Vercel in development mode (preview deployments)
 */
export function isVercelDev(): boolean {
  return process.env.VERCEL === '1' && process.env.VERCEL_ENV !== 'production';
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
}

/**
 * Get current environment name with fallback to production
 */
export function getCurrentEnvironment(): EnvironmentInfo['name'] {
  if (isLocalDev()) return 'local';
  if (isVercelDev()) return 'vercel-dev';
  if (isProduction()) return 'production';
  
  // Fallback to production (most restrictive) for unknown environments
  console.warn('⚠️ Unable to detect environment, defaulting to production settings');
  return 'production';
}

/**
 * Get comprehensive environment information
 */
export function getEnvironmentInfo(): EnvironmentInfo {
  // Cache the result since environment doesn't change during runtime
  if (_cachedInfo) {
    return _cachedInfo;
  }

  const name = getCurrentEnvironment();
  const isLocal = name === 'local';
  const isDevelopment = name === 'local' || name === 'vercel-dev';
  const isProductionEnv = name === 'production';
  const authMode = isLocal ? 'relaxed' : 'strict';

  _cachedInfo = {
    name,
    isLocal,
    isDevelopment,
    isProduction: isProductionEnv,
    authMode,
  };

  return _cachedInfo;
}

/**
 * Validate environment configuration at startup
 * Logs environment info and checks for conflicts
 */
export function validateEnvironment(): EnvironmentInfo {
  const envInfo = getEnvironmentInfo();
  
  // Log environment detection
  console.log(`🔐 Environment detected: ${envInfo.name}`);
  console.log(`📍 Auth mode: ${envInfo.authMode === 'relaxed' ? 'RELAXED (Development)' : 'STRICT (Production)'}`);
  
  // Check for dangerous conflicting environment variables
  if (envInfo.isLocal && process.env.VERCEL) {
    throw new Error('SECURITY: Conflicting environment variables detected - both local dev and Vercel flags are set');
  }

  // Warn if production has development-only variables
  if (envInfo.isProduction) {
    const devOnlyVars = ['MOCK_USER', 'SKIP_AUTH', 'ALLOW_INSECURE'];
    const foundDevVars = devOnlyVars.filter(varName => process.env[varName]);
    
    if (foundDevVars.length > 0) {
      console.error('🚨 SECURITY WARNING: Development-only variables found in production:', foundDevVars);
    }
  }

  // Log additional context
  if (typeof window !== 'undefined') {
    console.log('🌐 Running in browser context');
  } else {
    console.log('🖥️ Running in server context');
  }

  return envInfo;
}

/**
 * Check if specific features should be enabled based on environment
 */
export function shouldEnableFeature(feature: string): boolean {
  const envInfo = getEnvironmentInfo();
  
  switch (feature) {
    case 'mockAuth':
      return envInfo.isLocal;
    case 'debugEndpoints':
      return envInfo.isDevelopment;
    case 'strictValidation':
      return envInfo.isProduction;
    case 'emailVerification':
      return envInfo.isProduction;
    case 'devIndicator':
      return envInfo.isDevelopment;
    default:
      console.warn(`Unknown feature flag: ${feature}`);
      return false;
  }
}

/**
 * Reset cached environment info (mainly for testing)
 */
export function resetEnvironmentCache(): void {
  _cachedInfo = null;
}

// Export class-based interface for backwards compatibility
export const EnvironmentDetector = {
  isLocalDev,
  isVercelDev,
  isProduction,
  getCurrentEnvironment,
  getEnvironmentInfo,
  validateEnvironment,
  shouldEnableFeature,
  _resetCache: resetEnvironmentCache,
};