import { auth } from "@repo/auth";
import { Hono } from "hono";

// Match all auth routes including /auth/get-session, /auth/session, etc.
export const authRouter = new Hono().all("/*", async (c) => {
	const url = new URL(c.req.url);
	const start = Date.now();
	try {
		const response = await auth.handler(c.req.raw);
		const duration = Date.now() - start;
		if (process.env.VERCEL) {
			console.log(
				"[AUTH_ROUTE_DEBUG]",
				JSON.stringify(
					{
						path: url.pathname,
						method: c.req.method,
						status: response.status,
						duration,
					},
					null,
					2,
					),
				);
		}
		return response;
	} catch (error) {
		const duration = Date.now() - start;
		console.error(
			"[AUTH_ROUTE_ERROR]",
			JSON.stringify(
				{
					path: url.pathname,
					method: c.req.method,
					duration,
					error:
						error instanceof Error
							? { name: error.name, message: error.message, stack: error.stack }
							: String(error),
				},
				null,
				2,
			),
		);
		throw error;
	}
});

export default authRouter;
