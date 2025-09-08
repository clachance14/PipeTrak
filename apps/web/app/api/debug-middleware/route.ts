import { NextResponse } from "next/server";

export async function GET() {
	console.log("[Debug API] Endpoint called");

	try {
		return NextResponse.json({
			message: "Debug endpoint working",
			timestamp: new Date().toISOString(),
			env: {
				NODE_ENV: process.env.NODE_ENV,
				VERCEL: process.env.VERCEL,
				VERCEL_ENV: process.env.VERCEL_ENV,
			},
			runtime: "nodejs",
		});
	} catch (error) {
		console.error("[Debug API] Error:", error);
		return NextResponse.json(
			{
				error: "Debug endpoint failed",
				message:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
