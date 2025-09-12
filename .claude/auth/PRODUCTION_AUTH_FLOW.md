# PipeTrak Production Authentication Flow - Working Configuration

## Overview

This document captures the complete authentication flow that is currently working in production on Vercel as of January 11, 2025. It serves as a reference for understanding the auth architecture and troubleshooting future authentication issues.

## Architecture Overview

### Core Components
- **Better-Auth**: Primary authentication library with organization support
- **Prisma Adapter**: Database integration with PostgreSQL
- **Environment-Aware Configuration**: Different settings for dev/preview/production
- **Organization-Based Multi-tenancy**: Single organization membership per user

### Authentication Stack
```
User Request → Next.js Middleware → Better-Auth → Prisma → PostgreSQL
                     ↓
Organization Context → PipeTrak Routes → Protected Resources
```

## Environment-Aware Configuration

### Configuration File: `config/auth-config-simple.ts`

The auth system automatically detects the environment and applies appropriate security settings:

#### Production Configuration (Strict Security)
```typescript
const productionAuthConfig: AuthConfiguration = {
	baseURL: getBaseUrl(),
	
	// Security settings - strict for production
	skipEmailVerification: false,
	allowInsecureSecrets: false,
	trustAllOrigins: false,
	trustedOrigins: [
		"https://pipetrak.co",
		"https://www.pipetrak.co", 
		"https://pipe-trak.vercel.app",
		"https://pipe-trak-cory-lachances-projects.vercel.app",
	].filter(Boolean) as string[],
	
	// Validation - strict for production
	validation: {
		strict: true,
		requireEmailVerification: true,
		allowWeakPasswords: false,
	},
	
	// Production feature set
	features: {
		magicLink: true,
		passkeys: true,
		socialLogin: false, // Currently disabled
		twoFactor: true, // Enabled in production
	},
};
```

#### Preview Configuration (Moderate Security)
```typescript  
const previewAuthConfig: AuthConfiguration = {
	// Security settings - moderate for preview deployments
	skipEmailVerification: true, // No email verification for easier testing
	trustAllOrigins: true, // Accept all origins for preview deployments
	
	// Validation - relaxed for preview
	validation: {
		strict: false,
		requireEmailVerification: false,
		allowWeakPasswords: true,
	},
	
	// Debug logging enabled for troubleshooting
	debugMode: true,
};
```

### Environment Detection Logic
```typescript
function detectEnvironment(): {
	env: string;
	isProduction: boolean;
	isPreview: boolean;  
	isDevelopment: boolean;
	reasons: string[];
} {
	// Production: actual production domain (pipetrak.co)
	const isProduction: boolean =
		process.env.VERCEL_ENV === "production" &&
		Boolean(
			process.env.NEXT_PUBLIC_SITE_URL?.includes("pipetrak.co") ||
			process.env.NEXT_PUBLIC_SITE_URL?.includes("pipe-trak.vercel.app"),
		);
	
	// Preview: Vercel preview deployments (not production)  
	const isPreview: boolean = Boolean(
		(process.env.VERCEL_ENV === "preview" ||
			(process.env.VERCEL_URL && !isProduction) ||
			(process.env.VERCEL && process.env.NODE_ENV !== "development")) &&
			!isProduction,
	);
	
	// Development: local development environment
	const isDevelopment: boolean = Boolean(
		!process.env.VERCEL && process.env.NODE_ENV === "development",
	);
}
```

## Better-Auth Configuration

### Core Setup: `packages/auth/auth.ts`
```typescript
export const auth = betterAuth({
	secret: getAuthSecret(),
	baseURL: appUrl,
	trustedOrigins: authConfig.trustAllOrigins ? ['*'] : authConfig.trustedOrigins,
	appName: authConfig.appName,
	
	// Prisma adapter with serverless optimization
	database: prismaAdapter(db, {
		provider: "postgresql",
		// Optimize for serverless environments
		...(process.env.VERCEL && {
			skipPreparedStatements: true, // KEY FIX for prepared statement errors
		}),
	}),
	
	session: {
		expiresIn: authConfig.session.expiresIn, // 30 days
		freshAge: authConfig.session.freshAge,
	},
	
	// Organization plugin configuration
	plugins: [
		organization({
			allowUserToCreateOrganization: async (user) => {
				// Only allow organization creation if user doesn't already belong to one
				const hasExisting = await hasExistingMembership(user.id);
				return !hasExisting; // Enforces single organization membership
			},
			organizationLimit: 1, // Hard limit of 1 organization per user
		}),
		// Additional plugins...
	],
});
```

## Organization-Based Routing Flow

### The "ics-inc" Slug Issue Resolution

The routing system works as follows:

1. **User Login** → `/auth/login`
2. **Auth Success** → `/app` (AppStartPage)
3. **Organization Detection** → `/app/{organizationSlug}` 
4. **PipeTrak Redirect** → `/app/{organizationSlug}/pipetrak`

#### Critical Fix in Organization Page
**File**: `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/page.tsx`

```typescript
export default async function OrganizationPage({ params }) {
	const { organizationSlug } = await params;

	try {
		const activeOrganization = await getActiveOrganization(organizationSlug);
		if (!activeOrganization) {
			return notFound();
		}
		redirect(`/app/${organizationSlug}/pipetrak`);
	} catch (error) {
		console.error("Error loading organization:", error);
		// CRITICAL: Fallback redirect prevents 404s during DB issues
		redirect(`/app/${organizationSlug}/pipetrak`);
	}
}
```

**Key Points**:
- Organization slug "ics-inc" is valid and exists in database
- Error handling prevents 404s when database has temporary issues
- Always redirects to PipeTrak application (`/pipetrak` suffix required)

#### App Start Page Logic
**File**: `apps/web/app/(saas)/app/(account)/page.tsx`

```typescript
export default async function AppStartPage() {
	const session = await getSession();
	if (!session) {
		redirect("/auth/login");
	}

	const organizations = await getOrganizationList();
	
	// Find active organization or use the first one
	const activeOrganization =
		organizations.find(
			(org) => org.id === session.session.activeOrganizationId,
		) || organizations[0];

	if (!activeOrganization) {
		redirect("/new-organization");
	}

	// Ensure valid slug before redirecting (prevents undefined slug errors)
	if (!activeOrganization.slug) {
		console.error("Organization missing slug:", activeOrganization);
		redirect("/new-organization");
	}

	// Redirect to organization home page
	redirect(`/app/${activeOrganization.slug}`); // This becomes /app/ics-inc
}
```

## Session Management

### Session Retrieval (Server Side)
**File**: `apps/web/modules/saas/auth/lib/server.ts`

```typescript
export const getSession = cache(async () => {
	console.log("[getSession] Fetching session...");
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
			query: {
				disableCookieCache: true, // Ensures fresh session data
			},
		});
		console.log("[getSession] Session result:", session ? "exists" : "null");
		return session;
	} catch (error) {
		console.error("[getSession] Error:", error);
		return null; // Graceful fallback
	}
});
```

### Organization Context Loading
```typescript
export const getActiveOrganization = cache(async (slug: string) => {
	try {
		const activeOrganization = await auth.api.getFullOrganization({
			query: {
				organizationSlug: slug,
			},
			headers: await headers(),
		});
		return activeOrganization;
	} catch {
		return null; // Graceful fallback prevents crashes
	}
});
```

## Authentication Middleware & Route Protection

### Protected Routes Pattern
All routes under `/app` require authentication:

```typescript
// Middleware pattern (conceptual)
if (pathname.startsWith('/app')) {
	const session = await getSession();
	if (!session) {
		return redirect('/auth/login');
	}
}
```

### Organization Context Requirement
All PipeTrak routes require organization membership:

```typescript
// Organization-scoped routes pattern
/app/{organizationSlug}/pipetrak/{feature}
```

Examples:
- `/app/ics-inc/pipetrak` - Projects list
- `/app/ics-inc/pipetrak/{projectId}/dashboard` - Project dashboard
- `/app/ics-inc/pipetrak/{projectId}/components` - Components table

## API Endpoints Structure

### Better-Auth API Routes
All mounted under `/api/auth/*`:
- `/api/auth/session` - Get current session
- `/api/auth/sign-in/email` - Email login
- `/api/auth/sign-out` - Logout
- `/api/auth/organization/*` - Organization management

### PipeTrak API Routes  
All mounted under `/api/pipetrak/*`:
- `/api/pipetrak/projects` - Project management
- `/api/pipetrak/components` - Component CRUD
- `/api/pipetrak/import` - CSV import functionality

## Error Handling & Recovery

### Authentication Errors
```typescript
// Pattern for handling auth API errors
try {
	const result = await auth.api.someOperation(params);
	return result;
} catch (error) {
	console.error("Auth operation failed:", error);
	// Log but don't expose detailed errors to client
	return { error: "Authentication failed" };
}
```

### Database Connection Errors
```typescript
// Pattern for handling DB connection issues
try {
	const data = await db.query();
	return data;
} catch (error) {
	if (error.code === "42P05") { // Prepared statement error
		console.error("Prepared statement conflict:", error);
		// This should not happen with current configuration
	}
	console.error("Database error:", error);
	return null; // Graceful fallback
}
```

## Production Debugging

### Logging Configuration
```typescript
// Better-auth logging (production)
export const auth = betterAuth({
	// Minimal logging in production
	onAPIError: {
		onError(error: any, ctx: any) {
			logger.error(error, { ctx }); // Structured logging
		},
	},
});
```

### Environment Variable Validation
```typescript
// Runtime configuration validation
console.log(`🚀 Initializing PipeTrak Auth`);
console.log(`Environment: ${detection.env.toUpperCase()}`);
console.log(`Base URL: ${config.baseURL}`);
console.log(`Trust All Origins: ${config.trustAllOrigins ? "YES" : "NO"}`);
```

## Linear Integration

### Related Projects
- **User Management** (`c5c32779-835a-4df5-96c5-1ec99e824c15`): Authentication, roles, permissions
- **Database Optimization** (`7f5f47e5-a85e-4423-a0d2-b1d7e320d82a`): Connection pooling, performance

### Issue Creation for Auth Problems
```
mcp__linear__create_issue(
  title: "Authentication Issue: [Brief Description]",
  team: "PipeTrak", 
  description: "## Issue\n[Describe the problem]\n\n## Current Behavior\n[What happens]\n\n## Expected Behavior\n[What should happen]\n\n## Configuration\n- Environment: [prod/preview/dev]\n- Auth Config: [relevant settings]\n- Error Logs: [if available]",
  project: "User Management",
  labels: ["Bug", "Auth", "Priority: High", "Backend"]
)
```

### Session Handoff Pattern
```
mcp__linear__create_issue(
  title: "Session Handoff: Auth System Working State",
  team: "PipeTrak",
  description: "## Current State\n- Production auth flow working\n- No prepared statement errors\n- Organization routing stable\n\n## Configuration Snapshot\n- Better-auth with Prisma adapter\n- Serverless optimization enabled\n- Environment-aware security settings\n\n## Next Steps\n- Monitor for stability\n- Document any edge cases\n\n## Reference\nSee: .claude/auth/PRODUCTION_AUTH_FLOW.md",
  project: "User Management",
  labels: ["Session-Handoff", "Auth", "Documentation", "Knowledge-Base"]
)
```

## Troubleshooting Checklist

### Authentication Not Working
1. ✅ Check environment variables are set correctly
2. ✅ Verify `BETTER_AUTH_SECRET` is configured  
3. ✅ Confirm database connection is working
4. ✅ Check trusted origins include deployment URL
5. ✅ Review auth API endpoint responses (not 404)

### Organization Routing Issues  
1. ✅ Verify organization exists in database
2. ✅ Check organization slug is valid
3. ✅ Confirm user has organization membership
4. ✅ Test fallback redirect logic
5. ✅ Review error handling in organization pages

### Session Problems
1. ✅ Check session cookie is being set
2. ✅ Verify session expiry settings
3. ✅ Test session refresh behavior
4. ✅ Confirm headers are passed correctly
5. ✅ Review cache behavior with `disableCookieCache`

---

*This authentication configuration has been tested and verified working in production on Vercel as of January 11, 2025. All major auth flows are stable and performant.*