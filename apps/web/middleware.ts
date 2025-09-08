import { type NextRequest, NextResponse } from "next/server";

// Force Node.js runtime to support Better Auth with crypto/Prisma
export const runtime = "nodejs";

export function middleware(req: NextRequest) {
	console.log("[Middleware] Processing request:", req.nextUrl.pathname);

	// For now, just pass through all requests
	// Auth checks will be handled in layouts and server components
	// This resolves the Edge Runtime compatibility issues
	return NextResponse.next();
}

export const config = {
	matcher: "/((?!_next|api|favicon.ico).*)",
};
