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
