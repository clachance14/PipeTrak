import { getBaseUrl } from "@repo/utils";
import { cors } from "hono/cors";

// Environment-aware CORS configuration
function getCorsOrigins():
	| string[]
	| string
	| ((origin: string) => string | null) {
	const baseUrl = getBaseUrl();

	// Production environment - specific origins only
	if (
		process.env.VERCEL_ENV === "production" &&
		(process.env.NEXT_PUBLIC_SITE_URL?.includes("pipetrak.co") ||
			process.env.NEXT_PUBLIC_SITE_URL?.includes("pipe-trak.vercel.app"))
	) {
		const origins = [
			baseUrl,
			"https://pipetrak.co",
			"https://www.pipetrak.co",
			"https://pipe-trak.vercel.app",
			"https://pipe-trak-cory-lachances-projects.vercel.app",
		].filter(Boolean);

		console.log("🔒 CORS: Using production origins:", origins);
		return origins;
	}

	// Preview/development - allow all origins for flexibility
	if (
		process.env.VERCEL_ENV === "preview" ||
		process.env.VERCEL_URL ||
		process.env.NODE_ENV === "development"
	) {
		console.log("🔧 CORS: Allowing all origins for preview/development");
		return (origin: string) => origin; // Allow all origins by returning the origin
	}

	// Fallback to base URL
	console.log("🔍 CORS: Using fallback origin:", baseUrl);
	return baseUrl;
}

export const corsMiddleware = cors({
	origin: getCorsOrigins(),
	allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
	allowMethods: ["POST", "GET", "PUT", "PATCH", "DELETE", "OPTIONS"],
	exposeHeaders: ["Content-Length"],
	maxAge: 600,
	credentials: true,
});
