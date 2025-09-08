import { type NextRequest, NextResponse } from "next/server";

export default async function middleware(req: NextRequest) {
	try {
		const { pathname, origin } = req.nextUrl;
		const sessionCookie = req.cookies.get("better-auth.session");

		// Test: Just handle app routes for now
		if (pathname.startsWith("/app")) {
			if (!sessionCookie) {
				return NextResponse.redirect(new URL("/auth/login", origin));
			}
			return NextResponse.next();
		}

		// Let everything else through
		return NextResponse.next();
	} catch (error) {
		console.error("[Middleware] Error:", error);
		return NextResponse.next();
	}
}

export const config = {
	matcher: [
		"/((?!api|image-proxy|images|fonts|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
	],
};
