import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { withQuery } from "ufo";
import { edgeConfig as appConfig } from "./lib/edge-config";
import { routing } from "./modules/i18n/edge-routing";

const intlMiddleware = createMiddleware(routing);

export default async function middleware(req: NextRequest) {
	try {
		const { pathname, origin } = req.nextUrl;
		const sessionCookie = req.cookies.get("better-auth.session");

		if (pathname.startsWith("/app")) {
			const response = NextResponse.next();

			if (!appConfig.ui.saas.enabled) {
				return NextResponse.redirect(new URL("/", origin));
			}

			if (!sessionCookie) {
				return NextResponse.redirect(
					new URL(
						withQuery("/auth/login", {
							redirectTo: pathname,
						}),
						origin,
					),
				);
			}

			return response;
		}

		if (pathname.startsWith("/auth")) {
			if (!appConfig.ui.saas.enabled) {
				return NextResponse.redirect(new URL("/", origin));
			}

			// Only redirect away from signup if user already has a session cookie
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
	} catch (error) {
		// Log error but let request proceed to avoid blocking all traffic
		console.error("[Middleware] Error:", error);
		return NextResponse.next();
	}
}

export const config = {
	matcher: [
		"/((?!api|image-proxy|images|fonts|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
	],
};
