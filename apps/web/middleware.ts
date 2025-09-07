import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { withQuery } from "ufo";
import { edgeConfig as appConfig } from "./lib/edge-config";
import { routing } from "./modules/i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default async function middleware(req: NextRequest) {
	const { pathname, origin } = req.nextUrl;

	console.log("[Middleware] Request path:", pathname);
	const sessionCookie = getSessionCookie(req);
	console.log("[Middleware] Session cookie exists:", !!sessionCookie);

	if (pathname.startsWith("/app")) {
		const response = NextResponse.next();

		if (!appConfig.ui.saas.enabled) {
			console.log("[Middleware] SaaS not enabled, redirecting to /");
			return NextResponse.redirect(new URL("/", origin));
		}

		if (!sessionCookie) {
			console.log("[Middleware] No session cookie, redirecting to login");
			return NextResponse.redirect(
				new URL(
					withQuery("/auth/login", {
						redirectTo: pathname,
					}),
					origin,
				),
			);
		}

		console.log("[Middleware] Session cookie found, proceeding to app");
		return response;
	}

	if (pathname.startsWith("/auth")) {
		if (!appConfig.ui.saas.enabled) {
			return NextResponse.redirect(new URL("/", origin));
		}

		// CRITICAL: Allow access to login page even with invalid/expired session cookie
		// This prevents redirect loops when a user has an invalid cookie but needs to re-authenticate
		//
		// Why this is important:
		// - getSessionCookie() only checks if a cookie EXISTS, not if it's VALID
		// - An expired or invalid cookie would block login access if we redirected all auth routes
		// - The app layout will validate the actual session and redirect to login if invalid
		//
		// Only redirect away from signup if user already has a session cookie
		// (they should use the app or logout instead of signing up again)
		if (sessionCookie && pathname === "/auth/signup") {
			return NextResponse.redirect(new URL("/app", origin));
		}

		return NextResponse.next();
	}

	const pathsWithoutLocale = [
		"/onboarding",
		"/new-organization",
		"/choose-plan",
		"/organization-invitation",
	];

	if (pathsWithoutLocale.some((path) => pathname.startsWith(path))) {
		return NextResponse.next();
	}

	if (!appConfig.ui.marketing.enabled) {
		return NextResponse.redirect(new URL("/app", origin));
	}

	return intlMiddleware(req);
}

export const config = {
	matcher: [
		"/((?!api|image-proxy|images|fonts|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
	],
};
