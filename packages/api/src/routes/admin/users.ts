import { db } from "@repo/database";
import { Hono } from "hono";
import { validator } from "hono-openapi/zod";
import { z } from "zod";
import { adminMiddleware } from "../../middleware/admin";

export const userRouter = new Hono()
	.basePath("/users")
	.use(adminMiddleware)
	.get(
		"/",
		validator(
			"query",
			z.object({
				query: z.string().optional(),
				limit: z.string().optional().default("10").transform(Number),
				offset: z.string().optional().default("0").transform(Number),
			}),
		),
		async (c) => {
			const { query, limit, offset } = c.req.valid("query");

			const users = await db.user.findMany({
				where: {
					name: { contains: query, mode: "insensitive" },
				},
				take: limit,
				skip: offset,
			});

			const total = await db.user.count();

			return c.json({ users, total });
		},
	);
