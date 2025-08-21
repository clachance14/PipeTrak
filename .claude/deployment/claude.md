# Launch Readiness & Deployment

## Pre-Launch Requirements

This checklist ensures your SaaS application is production-ready before going live.

### 1. Email System
- [x] Customize all email templates in `/packages/mail/emails`
- [x] Update logo in `Wrapper.tsx` template component
- [x] Verify all email templates work correctly
- [x] Ensure all email templates are translated for supported languages
- [x] Verify domain in email provider (Resend)
- [x] Configure `from` email address in `config/index.ts`
- [x] Test email delivery for all user flows:
  - [x] Welcome email
  - [x] Password reset
  - [x] Email verification
  - [x] Organization invitations
  - [x] Contact form submissions

### 2. Internationalization
- [ ] Enable only languages you actively support
- [ ] Ensure all language keys are fully translated
- [ ] Remove or disable unsupported language options
- [ ] Test language switching functionality
- [ ] Verify currency display for each locale

### 3. Payments
- [ ] Create products/subscriptions in Stripe production mode
- [ ] Verify pricing is correct (monthly/yearly amounts)
- [ ] Configure all supported currencies
- [ ] Set up production webhooks with signing secret
- [ ] Point webhooks to production URL (`https://pipetrak.co/api/webhooks/payments`)
- [ ] Test complete payment flow with production test cards
- [ ] Configure Stripe Customer Portal

### 4. SEO Optimization
- [ ] Add meta titles and descriptions to all pages
- [ ] Create and configure sitemap.xml
- [ ] Ensure all public pages are indexable
- [ ] Add Open Graph tags for social sharing
- [ ] Configure robots.txt appropriately
- [ ] Set up Google Search Console
- [ ] Submit sitemap to search engines

### 5. Legal Compliance
Create and link the following legal pages:
- [ ] Privacy Policy
- [ ] Terms of Service
- [ ] Cookie Policy
- [ ] Imprint/About page
- [ ] GDPR compliance features (if applicable)
- [ ] Cookie consent banner (if required)

### 6. Performance & Security

#### Critical Security Fixes (Must Complete Before Production)
- [ ] **Implement Rate Limiting** (CWE-770)
  - [ ] Add rate limiting middleware to all API endpoints
  - [ ] Configure differentiated limits (read: 1000/15min, write: 100/15min, bulk: 5/min)
  - [ ] Test rate limiting effectiveness under load
  
- [ ] **Fix SQL Injection Vulnerabilities** (CWE-89)
  - [ ] Fix raw SQL in `/packages/api/src/routes/pipetrak/realtime.ts:264-266`
  - [ ] Audit all database queries for parameterization
  - [ ] Use Prisma.sql for all raw queries
  
- [ ] **Sanitize Error Messages** (CWE-209)
  - [ ] Create centralized error handler middleware
  - [ ] Remove detailed error messages from production
  - [ ] Implement error ID tracking system
  - [ ] Remove all console.log statements from API routes

#### High Priority Security Fixes
- [ ] **File Upload Security** (CWE-400)
  - [ ] Implement 50MB file size limit
  - [ ] Add 100,000 row limit for CSV/Excel
  - [ ] Validate file types with magic bytes
  - [ ] Add memory usage controls
  
- [ ] **Remove Sensitive Data from Real-time** (CWE-359)
  - [ ] Remove email addresses from presence broadcasts
  - [ ] Audit all broadcast payloads for PII
  - [ ] Use user IDs or display names only
  
- [ ] **Add CSRF Protection** (CWE-352)
  - [ ] Implement CSRF tokens for state-changing operations
  - [ ] Add SameSite cookie attributes
  - [ ] Configure proper CORS headers
  
- [ ] **Fix Missing Authorization** (CWE-862)
  - [ ] Add permission checks for bulk operations
  - [ ] Implement role-based access control
  - [ ] Add resource-level authorization

#### Security Infrastructure
- [ ] **Structured Logging** (CWE-117)
  - [ ] Replace console.log with structured logger
  - [ ] Implement log sanitization
  - [ ] Add request ID tracking
  
- [ ] **Security Headers Configuration**
  - [ ] Content-Security-Policy (CSP)
  - [ ] Strict-Transport-Security (HSTS)
  - [ ] X-Frame-Options
  - [ ] X-Content-Type-Options
  - [ ] X-XSS-Protection
  
- [ ] **Input Validation**
  - [ ] Whitelist custom export columns
  - [ ] Add request body size limits (max 10MB)
  - [ ] Validate all user inputs with Zod schemas

#### Performance Optimization
- [ ] Database query optimization (all queries < 200ms)
- [ ] Implement caching strategy (Redis recommended)
- [ ] Configure CDN for static assets
- [ ] Optimize images and bundle sizes
- [ ] Test loading performance with Lighthouse (target: 90+ score)

#### Security Testing & Validation
- [ ] Run comprehensive security test suite
- [ ] Perform penetration testing
- [ ] Validate OWASP Top 10 compliance
- [ ] Security audit score must be 9/10 or higher
- [ ] Test incident response procedures

#### Monitoring & Alerting
- [ ] Set up application monitoring (Sentry or similar)
- [ ] Configure security event logging
- [ ] Set up rate limit violation alerts
- [ ] Monitor failed authentication attempts
- [ ] Configure database query performance monitoring

### 7. Deployment Configuration
- [ ] Set all environment variables in production
- [ ] Use production API keys and secrets
- [ ] Select deployment region close to:
  - [ ] Database location (minimize latency)
  - [ ] Target audience location
- [ ] Configure auto-scaling if needed
- [ ] Set up database backups
- [ ] Configure logging and monitoring

### 8. Final Testing
- [ ] Complete user journey testing in production environment
- [ ] Test all payment flows
- [ ] Verify email delivery
- [ ] Test organization features
- [ ] Check mobile responsiveness
- [ ] Verify all forms and validations
- [ ] Test error handling and edge cases

## Production Deployment Checklist

### Authentication
- [ ] Set up production OAuth apps:
  - [ ] GitHub OAuth App (production redirect URLs)
  - [ ] Google OAuth App (production redirect URLs)
- [ ] Update OAuth credentials in production environment

### Database
- [ ] Run database migrations on production Supabase
- [ ] Verify RLS policies are enabled
- [ ] Set up database backups

### Domain & Hosting
- [ ] Configure custom domain (pipetrak.co)
- [ ] Set up SSL certificates
- [ ] Configure production environment variables on Vercel
- [ ] Set up monitoring and error tracking

### Security
- [ ] Generate new `BETTER_AUTH_SECRET` for production
- [ ] Review and update CORS settings
- [ ] Enable rate limiting
- [ ] Set up security headers

### Performance
- [ ] Configure CDN for static assets
- [ ] Set up caching strategies
- [ ] Enable compression
- [ ] Configure image optimization

---

*For specific system setup details, see the corresponding `.claude/` directories.*