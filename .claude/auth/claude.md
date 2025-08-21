# Authentication System

## Overview
Supastarter includes a complete authentication system using better-auth with Supabase integration. No additional auth setup is needed for PipeTrak.

## Available Features
- **Complete auth flow**: Login, signup, password reset, email verification, magic links
- **Organization multi-tenancy**: Full support with invitations and member management
- **OAuth providers**: Google and GitHub pre-configured
- **Advanced security**: 2FA, passkeys, session management
- **Admin UI**: Built-in interface for user and organization management

## Role System

### User Roles
- `admin` - System administrator with full access
- `user` - Standard user role

### Organization Roles  
- `owner` - Full organization control
- `admin` - Organization administration
- `member` - Standard organization member

### PipeTrak Role Mapping
- **Foreman**: Organization `member` role
- **Project Manager**: Organization `owner` or `admin` role

## Accessing Sessions

### Client Components
```typescript
import { useSession } from "@saas/auth/hooks/use-session";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";

function ClientComponent() {
  const { session, user } = useSession();
  const { organization, membership } = useActiveOrganization();
  
  // Check permissions
  if (membership?.role === 'owner' || membership?.role === 'admin') {
    // Project Manager access
  }
}
```

### Server Components
```typescript
import { getSession } from "@saas/auth/lib/server";

async function ServerComponent() {
  const session = await getSession();
  
  if (!session) {
    // Not authenticated
  }
}
```

## Permission Patterns
```typescript
// Route protection (server-side)
if (!session || session.user.role !== 'admin') {
  return redirect("/app");
}

// Feature gating (client-side)
if (membership?.role === 'member') {
  // Show Foreman features
} else if (membership?.role === 'owner' || membership?.role === 'admin') {
  // Show Project Manager features
}
```

## Key Files
- Auth configuration: `packages/auth/auth.ts`
- Session hooks: `apps/web/modules/saas/auth/hooks/`
- Auth components: `apps/web/modules/saas/auth/components/`
- OAuth providers: `apps/web/modules/saas/auth/constants/oauth-providers.tsx`

## Documentation Links
- [User & Session Management](https://supastarter.dev/docs/nextjs/authentication/user-and-session)
- [Permissions](https://supastarter.dev/docs/nextjs/authentication/permissions)
- [OAuth Configuration](https://supastarter.dev/docs/nextjs/authentication/oauth)
- [Super Admin](https://supastarter.dev/docs/nextjs/authentication/superadmin)

## Authentication Testing Guidelines

### CRITICAL: Always Test Auth Flow After Changes

When modifying any authentication-related code, you MUST test the following to prevent redirect loops and broken auth:

#### Pre-Deployment Checklist
- [ ] **Login Access**: Can users reach `/auth/login` when logged out?
- [ ] **Expired Session**: Can users reach `/auth/login` with an expired/invalid session cookie?
- [ ] **Successful Login**: Does login redirect to `/app` correctly?
- [ ] **Protected Routes**: Does `/app` redirect to `/auth/login` when not authenticated?
- [ ] **Logout Flow**: Does logout clear the session and redirect appropriately?
- [ ] **API Endpoints**: Do `/api/auth/*` endpoints return proper status codes (not 404)?
- [ ] **No Loops**: Check browser network tab for redirect loops
- [ ] **Clean State**: Test with cleared cookies/cache
- [ ] **Session Expiry**: Test with manually expired session cookies

#### Common Pitfalls to Avoid
1. **Never block `/auth/login` access** - Even with invalid cookies
2. **Understand cookie vs session** - Cookie existence ≠ valid session
3. **Test middleware changes** - Middleware affects all route access
4. **Verify API routes** - Ensure `/api/auth/*` routes are properly mounted

#### Quick Debug Commands
```bash
# Test auth endpoint
curl -I http://localhost:3000/api/auth/session

# Should return 200 (with session) or 401 (without), never 404
```

#### If You Encounter Redirect Loops
1. Check `apps/web/middleware.ts` - Ensure login page is accessible
2. Check `apps/web/app/(saas)/app/layout.tsx` - Verify session validation
3. Clear browser cookies and try again
4. Check browser network tab for the redirect pattern

See `project-documentation/authentication-flow.md` for detailed auth architecture.