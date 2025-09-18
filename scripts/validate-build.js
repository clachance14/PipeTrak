#!/usr/bin/env node

/**
 * Build Validation Script for PipeTrak
 * 
 * Validates environment configuration before building to prevent:
 * - Development variables in production builds
 * - Missing required production variables
 * - Insecure configurations reaching production
 * 
 * Run automatically before build: node scripts/validate-build.js
 */

const chalk = require('chalk');
const path = require('path');

// ANSI colors for console output (fallback if chalk not available)
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
};

// Use chalk if available, otherwise use fallback colors
const c = typeof chalk !== 'undefined' ? chalk : colors;

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [BUILD-VALIDATOR]`;
  
  switch (level) {
    case 'error':
      console.error(c.red(`${prefix} ❌ ${message}`));
      break;
    case 'warning':
      console.warn(c.yellow(`${prefix} ⚠️  ${message}`));
      break;
    case 'success':
      console.log(c.green(`${prefix} ✅ ${message}`));
      break;
    case 'info':
    default:
      console.log(c.blue(`${prefix} ℹ️  ${message}`));
      break;
  }
}

function validateEnvironment() {
  log('Starting build environment validation...');
  
  // Determine if this is a production build
  const NODE_ENV = process.env.NODE_ENV;
  const VERCEL_ENV = process.env.VERCEL_ENV;
  const isProduction = NODE_ENV === 'production' || VERCEL_ENV === 'production';
  const isVercelBuild = process.env.VERCEL === '1';
  
  log(`Environment detected: NODE_ENV=${NODE_ENV}, VERCEL_ENV=${VERCEL_ENV}`);
  log(`Production build: ${isProduction ? c.bold('YES') : 'NO'}`);
  log(`Vercel build: ${isVercelBuild ? 'YES' : 'NO'}`);
  
  let hasErrors = false;
  let hasWarnings = false;
  
  // 1. Check for development-only variables in production
  if (isProduction) {
    log('Checking for development variables in production build...');
    
    const devOnlyVars = [
      'MOCK_USER',
      'SKIP_AUTH', 
      'ALLOW_INSECURE',
      'DEBUG_AUTH',
      'BYPASS_EMAIL_VERIFICATION',
      'DISABLE_CSRF',
      'DEV_MODE',
    ];
    
    const foundDevVars = devOnlyVars.filter(varName => {
      const value = process.env[varName];
      return value && value.toLowerCase() !== 'false' && value !== '0';
    });
    
    if (foundDevVars.length > 0) {
      hasErrors = true;
      log("SECURITY ERROR: Development variables found in production build:", 'error');
      foundDevVars.forEach(varName => {
        log(`  - ${varName}=${process.env[varName]}`, 'error');
      });
      log('These variables must be removed or set to false in production!', 'error');
    } else {
      log('✓ No development variables found in production build', 'success');
    }
  }
  
  // 2. Check for required production variables
  if (isProduction) {
    log('Checking required production variables...');
    
    const requiredProdVars = [
      { name: 'BETTER_AUTH_SECRET', description: 'Authentication secret key' },
      { name: 'DATABASE_URL', description: 'Database connection string' },
      { name: 'NEXT_PUBLIC_SITE_URL', description: 'Public site URL' },
    ];
    
    const missingVars = requiredProdVars.filter(({ name }) => !process.env[name]);
    
    if (missingVars.length > 0) {
      hasErrors = true;
      log('CONFIGURATION ERROR: Missing required production variables:', 'error');
      missingVars.forEach(({ name, description }) => {
        log(`  - ${name}: ${description}`, 'error');
      });
    } else {
      log('✓ All required production variables are set', 'success');
    }
    
    // Check for auth secret strength in production
    const authSecret = process.env.BETTER_AUTH_SECRET;
    if (authSecret) {
      if (authSecret.length < 32) {
        hasWarnings = true;
        log('WARNING: BETTER_AUTH_SECRET is shorter than recommended 32 characters', 'warning');
      } else if (authSecret.includes('dev') || authSecret.includes('test') || authSecret.includes('example')) {
        hasErrors = true;
        log('SECURITY ERROR: BETTER_AUTH_SECRET appears to be a development/example value', 'error');
      } else {
        log('✓ BETTER_AUTH_SECRET meets security requirements', 'success');
      }
    }
  }
  
  // 3. Check for email service configuration
  const emailService = process.env.RESEND_API_KEY;
  if (!emailService && isProduction) {
    hasWarnings = true;
    log('WARNING: RESEND_API_KEY not set - email features will not work', 'warning');
  } else if (emailService) {
    log('✓ Email service configured', 'success');
  }
  
  // 4. Validate database configuration
  const databaseUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;
  
  if (databaseUrl) {
    // Check if using connection pooling (recommended for serverless)
    if (isVercelBuild && !databaseUrl.includes('pooler') && !databaseUrl.includes('6543')) {
      hasWarnings = true;
      log('WARNING: DATABASE_URL may not be using connection pooling (recommended for Vercel)', 'warning');
    }
    log('✓ Database URL configured', 'success');
  }
  
  if (directUrl) {
    log('✓ Direct database URL configured (needed for migrations)', 'success');
  } else if (isProduction) {
    hasWarnings = true;
    log('WARNING: DIRECT_URL not set - database migrations may fail', 'warning');
  }
  
  // 5. Check OAuth configuration if social login is intended
  const hasGoogle = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
  const hasGitHub = process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET;
  
  if (hasGoogle) {
    log('✓ Google OAuth configured', 'success');
  }
  if (hasGitHub) {
    log('✓ GitHub OAuth configured', 'success');
  }
  
  // 6. Validate Vercel-specific configuration
  if (isVercelBuild) {
    log('Checking Vercel-specific configuration...');
    
    const vercelUrl = process.env.VERCEL_URL;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    
    if (!siteUrl && isProduction) {
      hasWarnings = true;
      log('WARNING: NEXT_PUBLIC_SITE_URL not set - will use VERCEL_URL fallback', 'warning');
    }
    
    if (vercelUrl) {
      log(`✓ Vercel URL: ${vercelUrl}`, 'success');
    }
  }
  
  // 7. Check for conflicting environment variables
  if (process.env.NODE_ENV === 'development' && process.env.VERCEL === '1') {
    hasWarnings = true;
    log('WARNING: NODE_ENV=development with VERCEL=1 - this is unusual', 'warning');
  }
  
  // Summary
  log('='.repeat(60));
  if (hasErrors) {
    log('❌ BUILD VALIDATION FAILED', 'error');
    log('Please fix the errors above before building for production.', 'error');
    process.exit(1);
  } else if (hasWarnings) {
    log('⚠️  BUILD VALIDATION COMPLETED WITH WARNINGS', 'warning');
    log('Build will proceed, but please review warnings above.', 'warning');
  } else {
    log('✅ BUILD VALIDATION PASSED', 'success');
    log('All checks passed. Build can proceed safely.', 'success');
  }
  log('='.repeat(60));
}

// Run validation if script is executed directly
if (require.main === module) {
  try {
    validateEnvironment();
  } catch (error) {
    log(`Validation script failed: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

module.exports = { validateEnvironment };