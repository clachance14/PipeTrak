import { getAuthConfig } from "@repo/config/auth-config-simple";
import { NextResponse } from "next/server";

/**
 * Debug Configuration Endpoint
 * 
 * Provides detailed configuration information for development environments.
 * SECURITY: Only available in development - returns 403 in production.
 */
export async function GET() {
  const isProduction = process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production';
  
  // Security check - only allow in development environments
  if (isProduction) {
    return NextResponse.json(
      { 
        error: 'Debug endpoints are not available in production',
        environment: 'production' 
      }, 
      { status: 403 }
    );
  }
  
  try {
    const authConfig = getAuthConfig();
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV === 'development' ? 'development' : 'production',
      
      // Environment details
      runtime: {
        nodeVersion: process.version,
        platform: process.platform,
        isServer: typeof window === 'undefined',
        vercelDeployment: process.env.VERCEL_URL || null,
        vercelEnv: process.env.VERCEL_ENV || null,
      },
      
      // Authentication configuration
      auth: {
        mode: authConfig.debugMode ? 'DEBUG' : 'NORMAL',
        baseURL: authConfig.baseURL,
        emailVerification: !authConfig.skipEmailVerification,
        strictValidation: authConfig.validation.strict,
        trustedOrigins: authConfig.trustAllOrigins 
          ? 'ALL (*)'
          : authConfig.trustedOrigins,
        
        features: {
          magicLink: authConfig.features.magicLink,
          passkeys: authConfig.features.passkeys,
          socialLogin: authConfig.features.socialLogin,
          twoFactor: authConfig.features.twoFactor,
        },
        
        // Mock user info (if configured)
        mockUser: authConfig.mockUser ? {
          enabled: true,
          email: authConfig.mockUser.email || 'Unknown',
          id: authConfig.mockUser.id || 'Unknown',
        } : {
          enabled: false,
        },
      },
      
      // System health checks
      checks: {
        hasDatabase: !!process.env.DATABASE_URL,
        hasDirectUrl: !!process.env.DIRECT_URL,
        hasAuthSecret: !!process.env.BETTER_AUTH_SECRET,
        hasEmailService: !!process.env.RESEND_API_KEY,
        
        // OAuth providers
        hasGoogleOAuth: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        hasGitHubOAuth: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
        
        // Storage
        hasS3Storage: !!(
          process.env.S3_ACCESS_KEY_ID && 
          process.env.S3_SECRET_ACCESS_KEY && 
          process.env.S3_ENDPOINT
        ),
      },
      
      // Configuration warnings
      warnings: [],
      
      // Development hints
      hints: [],
    };
    
    // Add warnings for common issues
    if (!debugInfo.checks.hasDatabase) {
      debugInfo.warnings.push('DATABASE_URL not configured - authentication will fail');
    }
    
    if (!debugInfo.checks.hasAuthSecret && process.env.NODE_ENV !== 'development') {
      debugInfo.warnings.push('BETTER_AUTH_SECRET not set - using fallback (insecure)');
    }
    
    if (!debugInfo.checks.hasEmailService) {
      debugInfo.warnings.push('RESEND_API_KEY not set - email features will fail');
    }
    
    if (authConfig.trustAllOrigins) {
      debugInfo.warnings.push('Accepting all origins - only safe in development');
    }
    
    // Add development hints
    if (process.env.NODE_ENV === 'development') {
      debugInfo.hints.push('Set MOCK_USER environment variable to enable mock authentication');
      debugInfo.hints.push('Check console logs for magic link URLs in development');
      debugInfo.hints.push('Use /api/debug/auth-test to test authentication flows');
    }
    
    if (debugInfo.auth.features.socialLogin && !debugInfo.checks.hasGoogleOAuth && !debugInfo.checks.hasGitHubOAuth) {
      debugInfo.hints.push('Configure GOOGLE_CLIENT_ID/SECRET or GITHUB_CLIENT_ID/SECRET for social login');
    }
    
    return NextResponse.json(debugInfo, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
    
  } catch (error) {
    console.error('Error in debug/config endpoint:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to generate debug information',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Disable caching for this endpoint
export const dynamic = 'force-dynamic';
export const revalidate = 0;