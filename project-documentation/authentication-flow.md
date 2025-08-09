# PipeTrak Authentication Flow Documentation

## Overview
This document describes the authentication flow in PipeTrak, including common pitfalls and how to avoid them.

## Architecture Components

### 1. Better-Auth Integration
- **Location**: `packages/auth/auth.ts`
- **Purpose**: Core authentication logic using better-auth library
- **Key Routes**: All `/api/auth/*` endpoints handled by better-auth

### 2. API Router
- **Location**: `packages/api/src/routes/auth.ts`
- **Pattern**: Mounted at `/auth` prefix, handles all `/*` routes
- **Critical**: Must be mounted correctly in `packages/api/src/app.ts`

### 3. Middleware
- **Location**: `apps/web/middleware.ts`
- **Purpose**: Route protection and initial auth checks
- **Key Behavior**: Checks for session cookie EXISTENCE (not validity)

### 4. App Layout
- **Location**: `apps/web/app/(saas)/app/layout.tsx`
- **Purpose**: Validates actual session and protects app routes
- **Key Behavior**: Validates session and redirects to login if invalid

## Authentication Flow

### Successful Login Flow
1. User clicks login → Goes to `/auth/login`
2. User enters credentials → Submits to `/api/auth/login`
3. Better-auth validates → Creates session cookie
4. Success → Redirects to `/app`
5. App layout validates session → Shows PipeTrak dashboard

### Logout Flow
1. User clicks logout → Calls `/api/auth/logout`
2. Better-auth invalidates session → Clears cookie
3. Redirects to login page

## Critical Rules to Prevent Issues

### ⚠️ NEVER Block Access to Login Page
**Problem**: If middleware redirects users with ANY cookie away from `/auth/login`, it creates a redirect loop when the cookie is invalid.

**Solution**: Always allow access to `/auth/login`, even with existing cookies:
```typescript
// CORRECT - Only redirect from signup
if (sessionCookie && pathname === "/auth/signup") {
    return NextResponse.redirect(new URL("/app", origin));
}

// WRONG - Blocks login access
if (sessionCookie && pathname !== "/auth/reset-password") {
    return NextResponse.redirect(new URL("/app", origin));
}
```

### Session Cookie vs Valid Session
- **Cookie Existence**: Checked by middleware (`getSessionCookie`)
- **Session Validity**: Checked by app (`getSession`)
- These are DIFFERENT - a cookie can exist but be expired/invalid

## Common Issues and Solutions

### Issue 1: Redirect Loop on Login
**Symptoms**: Clicking login button causes infinite redirects between `/auth/login` and `/app`

**Cause**: Middleware redirects away from login when invalid cookie exists

**Solution**: Allow access to `/auth/login` regardless of cookie state

### Issue 2: Auth Endpoints Return 404
**Symptoms**: All `/api/auth/*` endpoints return 404

**Cause**: Incorrect routing pattern in Hono router

**Solution**: 
1. Mount authRouter at `/auth` prefix
2. Use `/*` pattern in the router
3. Ensure proper order in app router chain

## Testing Checklist

Before deploying any auth-related changes:

- [ ] Can users access `/auth/login` when logged out?
- [ ] Can users access `/auth/login` with expired session?
- [ ] Does login redirect to `/app` successfully?
- [ ] Does `/app` redirect to login when not authenticated?
- [ ] Does logout clear session and redirect to login?
- [ ] Do API auth endpoints (`/api/auth/session`) return 200?
- [ ] No redirect loops in browser network tab?
- [ ] Test with cleared cookies/cache
- [ ] Test with expired session cookie

## Debug Tips

### Check Auth Endpoint Status
```bash
curl -I http://localhost:3000/api/auth/session
# Should return 200 or 401, not 404
```

### Monitor Redirect Loops
Watch the browser network tab for repeating patterns:
- `/app` → `/auth/login` → `/app` (indicates middleware issue)
- Multiple identical requests (indicates loop)

### Session Cookie Inspection
Use browser DevTools to check:
- Cookie name: `better-auth.session_token`
- Check expiry date
- Try deleting and retesting

## File Locations Reference

- **Auth Config**: `packages/auth/auth.ts`
- **Auth Client**: `packages/auth/client.ts`
- **Auth Router**: `packages/api/src/routes/auth.ts`
- **API App**: `packages/api/src/app.ts`
- **Middleware**: `apps/web/middleware.ts`
- **App Layout**: `apps/web/app/(saas)/app/layout.tsx`
- **Login Page**: `apps/web/app/auth/login/page.tsx`
- **Session Hook**: `apps/web/modules/saas/auth/hooks/use-session.tsx`

## Key Principles

1. **Always allow access to login page** - Never block `/auth/login`
2. **Validate sessions properly** - Don't trust cookie existence alone
3. **Test redirect flows** - Always test full auth flow after changes
4. **Clear error messages** - Help users understand auth failures
5. **Document changes** - Update this doc when auth flow changes

---

Last Updated: 2025-08-08
Issue Fixed: Redirect loop when accessing login page with invalid session cookie