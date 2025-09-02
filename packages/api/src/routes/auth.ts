import { auth } from "@repo/auth";
import { Hono } from "hono";

// Match all auth routes including /auth/get-session, /auth/session, etc.
export const authRouter = new Hono().all("/*", async (c) => {
	return auth.handler(c.req.raw);
});

export default authRouter;
