import { type NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
	const { pathname, origin } = req.nextUrl;
	const sessionCookie = req.cookies.get("better-auth.session");

	// Handle /app routes - require authentication
	if (pathname.startsWith("/app")) {
		if (!sessionCookie) {
			return NextResponse.redirect(new URL("/auth/login", origin));
		}
		return NextResponse.next();
	}

	// Handle /auth routes - redirect to /app if already logged in
	if (pathname.startsWith("/auth")) {
		if (sessionCookie && pathname === "/auth/signup") {
			return NextResponse.redirect(new URL("/app", origin));
		}
		return NextResponse.next();
	}

	// Let everything else through
	return NextResponse.next();
}

export const config = {
	matcher: "/((?!_next|api|favicon.ico).*)",
};
