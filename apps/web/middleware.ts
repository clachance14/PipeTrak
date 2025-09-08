import { type NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
	// Temporarily simplified middleware - just pass everything through
	console.log("[Middleware] Simplified version - passing through:", req.nextUrl.pathname);
	return NextResponse.next();
}

export const config = {
	matcher: "/((?!_next|api|favicon.ico).*)",
};
