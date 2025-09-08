import { type NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
	// Temporarily simplified middleware - just pass everything through
	console.log("[Middleware] Simplified version - passing through:", req.nextUrl.pathname);
	return NextResponse.next();
	
	/* Original middleware code temporarily disabled:
	*/
	console.log("[Middleware] Starting execution for:", req.nextUrl.pathname);

	try {
		const { pathname, origin } = req.nextUrl;
		const sessionCookie = req.cookies.get("better-auth.session");

		console.log("[Middleware] Path:", pathname);
		console.log("[Middleware] Has session:", !!sessionCookie);
		console.log("[Middleware] Origin:", origin);

		// Handle /app routes - require authentication
		if (pathname.startsWith("/app")) {
			if (!sessionCookie) {
				console.log("[Middleware] Redirecting to login - no session");
				return NextResponse.redirect(new URL("/auth/login", origin));
			}
			console.log("[Middleware] Allowing /app access");
			return NextResponse.next();
		}

		// Handle /auth routes - redirect to /app if already logged in
		if (pathname.startsWith("/auth")) {
			if (sessionCookie && pathname === "/auth/signup") {
				console.log(
					"[Middleware] Redirecting to /app - already logged in",
				);
				return NextResponse.redirect(new URL("/app", origin));
			}
			console.log("[Middleware] Allowing /auth access");
			return NextResponse.next();
		}

		console.log("[Middleware] Passing through");
		return NextResponse.next();
	} catch (error) {
		console.error("[Middleware] Fatal error:", error);
		console.error(
			"[Middleware] Error message:",
			error instanceof Error ? error.message : "Unknown error",
		);
		console.error(
			"[Middleware] Error stack:",
			error instanceof Error ? error.stack : "No stack",
		);
		// Return next() to avoid blocking all traffic
		return NextResponse.next();
	}
	*/
}

export const config = {
	matcher: "/((?!_next|api|favicon.ico).*)",
};
