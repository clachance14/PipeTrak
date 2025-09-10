# Vercel Deployment Configuration - Working Setup

## 🎉 Status: DEPLOYMENT SUCCESSFUL ✅

**Date**: September 9, 2025  
**Issue**: 404 NOT_FOUND errors on all Vercel deployment URLs  
**Solution**: Proper middleware configuration + correct Vercel project settings  
**Deployment URL**: https://pipe-trak.vercel.app/

## 🔧 What Fixed the 404 Errors

The deployment was failing because:
1. **Missing/incorrect middleware** - Locale routing wasn't properly handled
2. **Vercel framework detection** - Project was set to "Other" instead of "Next.js"
3. **Improper monorepo configuration** - Build commands and structure needed optimization

### Key Success Factors

1. **✅ Proper Middleware**: Full next-intl middleware with authentication
2. **✅ Correct Vercel Project Settings**: Root Directory = `apps/web`, Framework = Next.js
3. **✅ Monorepo Build Configuration**: Proper pnpm workspace filtering
4. **✅ Locale-aware Routing**: Root redirect + middleware handling

## 📁 Critical File Configurations

### 1. Middleware (`apps/web/middleware.ts`)

**CRITICAL**: This middleware handles locale routing, authentication, and proper request flow.

```typescript
import { routing } from "@i18n/routing";
import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { withQuery } from "ufo";
import { edgeConfig } from "./lib/edge-config";

const intlMiddleware = createMiddleware(routing);

export default async function middleware(req: NextRequest) {
	const { pathname, origin } = req.nextUrl;

	// Protect SaaS app routes
	if (pathname.startsWith("/app")) {
		if (!edgeConfig.ui.saas.enabled) {
			return NextResponse.redirect(new URL("/", origin));
		}
		const sessionCookie = getSessionCookie(req);
		if (!sessionCookie) {
			return NextResponse.redirect(
				new URL(
					withQuery("/auth/login", { redirectTo: pathname }),
					origin,
				),
			);
		}
		return NextResponse.next();
	}

	// Handle auth routes when SaaS is disabled
	if (pathname.startsWith("/auth")) {
		if (!edgeConfig.ui.saas.enabled) {
			return NextResponse.redirect(new URL("/", origin));
		}
		return NextResponse.next();
	}

	// Paths that should bypass locale handling
	const pathsWithoutLocale = [
		"/onboarding",
		"/new-organization",
		"/choose-plan",
		"/organization-invitation",
	];
	if (pathsWithoutLocale.some((p) => pathname.startsWith(p))) {
		return NextResponse.next();
	}

	// If marketing is disabled, send traffic to the app
	if (!edgeConfig.ui.marketing.enabled) {
		return NextResponse.redirect(new URL("/app", origin));
	}

	// Locale-aware routing for marketing pages
	return intlMiddleware(req);
}

export const config = {
	matcher: [
		"/((?!api|image-proxy|images|fonts|_next/static|_next/image|favicon.ico|icon.png|sitemap.xml|robots.txt).*)",
	],
};
```

### 2. Root Vercel Configuration (`vercel.json`)

```json
{
	"version": 2,
	"buildCommand": "pnpm --filter @repo/database prisma:generate && pnpm --filter @repo/web build",
	"installCommand": "pnpm install --frozen-lockfile",
	"framework": "nextjs"
}
```

### 3. Web App Vercel Configuration (`apps/web/vercel.json`)

```json
{
	"version": 2,
	"framework": "nextjs",
	"installCommand": "pnpm install --frozen-lockfile"
}
```

### 4. Root Page Redirect (`apps/web/app/page.tsx`)

```typescript
import { redirect } from "next/navigation";

// Root page that redirects to locale-based home page
export default function RootPage() {
	// Redirect to English locale home page
	redirect("/en");
}
```

### 5. i18n Routing Configuration (`apps/web/modules/i18n/edge-routing-config.ts`)

```typescript
import { defineRouting } from "next-intl/routing";
import { edgeConfig } from "../../lib/edge-config";

export const routing = defineRouting({
	locales: Object.keys(edgeConfig.i18n.locales),
	defaultLocale: edgeConfig.i18n.defaultLocale,
	localeCookie: {
		name: edgeConfig.i18n.localeCookieName,
	},
	localePrefix: edgeConfig.i18n.enabled ? "always" : "never",
	localeDetection: edgeConfig.i18n.enabled,
});
```

## ⚙️ Vercel Project Settings

**CRITICAL**: These settings must be configured correctly in the Vercel dashboard:

```
Project Name: pipe-trak
Root Directory: apps/web
Framework Preset: Next.js (NOT "Other")
Build Command: Auto-detected or custom via vercel.json
Output Directory: Auto-detected (.next)
Install Command: Auto-detected (pnpm install)
Node.js Version: 22.x
```

### Vercel CLI Project Info

```bash
npx vercel project inspect pipe-trak
```

Expected output:
```
General
  Root Directory: apps/web
  Framework Preset: Next.js  # ← Must be Next.js, not "Other"

Framework Settings
  Framework Preset: Next.js
  Build Command: Auto or from vercel.json
  Output Directory: .next
```

## 🏗️ Build Process

### Monorepo Build Commands

The build process requires proper dependency handling:

1. **Prisma Generation**: `pnpm --filter @repo/database prisma:generate`
2. **Next.js Build**: `pnpm --filter @repo/web build`
3. **Dependencies**: `pnpm install --frozen-lockfile`

### Local Testing Commands

```bash
# Full build test
pnpm --filter @repo/database prisma:generate && pnpm --filter @repo/web build

# Local development
pnpm start

# Type checking
pnpm typecheck
```

## 🔍 Routing Structure

### URL Patterns

- **Root**: `/` → redirects to `/en`
- **Marketing**: `/en`, `/de` (locale-based)
- **SaaS App**: `/app/*` (protected by authentication)
- **Auth**: `/auth/*` (login, signup, etc.)
- **API**: `/api/*` (API routes)

### Middleware Flow

1. **SaaS Routes** (`/app/*`) → Check authentication → Redirect to login if needed
2. **Auth Routes** (`/auth/*`) → Allow if SaaS enabled
3. **Special Paths** → Bypass locale handling
4. **Marketing Disabled** → Redirect to `/app`
5. **Default** → next-intl locale routing

## 🚨 Common Issues & Solutions

### Issue: 404 NOT_FOUND Errors

**Symptoms**: All URLs return 404, even working deployment IDs
**Root Cause**: Missing or broken middleware + wrong framework detection
**Solution**: 
1. Restore proper middleware.ts
2. Verify Vercel framework preset = "Next.js"
3. Ensure Root Directory = "apps/web"

### Issue: Framework Detection Shows "Other"

**Symptoms**: Vercel project shows Framework Preset: "Other"
**Root Cause**: Vercel can't detect Next.js in monorepo structure
**Solution**: Add `"framework": "nextjs"` to vercel.json

### Issue: Build Failures with Workspace Dependencies

**Symptoms**: `npm error Unsupported URL Type "workspace:"`
**Root Cause**: Trying to deploy from subdirectory without root dependencies
**Solution**: Deploy from root with proper build commands

### Issue: Locale Routing Not Working

**Symptoms**: `/` doesn't redirect to `/en`, locale URLs fail
**Root Cause**: Missing or broken next-intl middleware
**Solution**: Restore full middleware with intlMiddleware(req)

## ✅ Deployment Testing Checklist

After deploying, test these URLs:

1. **Root Redirect**: https://pipe-trak.vercel.app/ → Should redirect to `/en`
2. **Marketing Page**: https://pipe-trak.vercel.app/en → Should load homepage
3. **Auth Flow**: https://pipe-trak.vercel.app/auth/login → Should load login
4. **App Protection**: https://pipe-trak.vercel.app/app → Should redirect to login
5. **API Routes**: https://pipe-trak.vercel.app/api/health → Should work if exists

### Success Indicators

- ✅ No 404 NOT_FOUND errors
- ✅ Root URL redirects properly to `/en`
- ✅ Locale-based URLs work
- ✅ Authentication flow functional
- ✅ Protected routes redirect appropriately

## 🔄 Recovery Process

If 404 errors return:

1. **Check middleware.ts** - Ensure it matches the working version above
2. **Verify Vercel project settings** - Root Directory + Framework preset
3. **Review vercel.json** - Ensure proper build commands
4. **Test locally first** - `pnpm start` should work before deploying
5. **Check recent commits** - Any middleware or routing changes?

## 📝 Notes

- **Middleware is critical** - Without proper middleware, routing fails completely
- **Framework detection matters** - "Other" preset causes routing issues  
- **Monorepo complexity** - Build commands must handle workspace dependencies
- **Locale routing** - next-intl middleware handles `/` → `/en` redirect
- **Authentication** - better-auth integration requires session cookie checking

---

**Last Updated**: September 9, 2025  
**Working Deployment**: https://pipe-trak.vercel.app/  
**Status**: ✅ FULLY FUNCTIONAL