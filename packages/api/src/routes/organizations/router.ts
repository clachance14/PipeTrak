import { db, getOrganizationBySlug } from "@repo/database";
import slugify from "@sindresorhus/slugify";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/zod";
import { nanoid } from "nanoid";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth";

export const organizationsRouter = new Hono().basePath("/organizations").get(
	"/generate-slug",
	validator(
		"query",
		z.object({
			name: z.string(),
		}),
	),
	describeRoute({
		summary: "Generate a slug for an organization",
		tags: ["Organizations"],
	}),
	async (c) => {
		const { name } = c.req.valid("query");

		const baseSlug = slugify(name, {
			lowercase: true,
		});

		let slug = baseSlug;
		let hasAvailableSlug = false;

		for (let i = 0; i < 3; i++) {
			const existing = await getOrganizationBySlug(slug);

			if (!existing) {
				hasAvailableSlug = true;
				break;
			}

			slug = `${baseSlug}-${nanoid(5)}`;
		}

		if (!hasAvailableSlug) {
			return c.json(
				{
					error: "No available slug found",
				},
				400,
			);
		}

		return c.json({
			slug,
		});
	},
)
.patch(
	"/:organizationId/logo",
	authMiddleware,
	validator(
		"param",
		z.object({
			organizationId: z.string().min(1),
		}),
	),
	validator(
		"json",
		z.object({
			logoPath: z.string().min(1),
		}),
	),
	describeRoute({
		tags: ["Organizations"],
		summary: "Update organization logo",
		description: "Update the logo path for an organization",
		responses: {
			200: {
				description: "Logo updated successfully",
				content: {
					"application/json": {
						schema: resolver(
							z.object({
								success: z.boolean(),
								organization: z.object({
									id: z.string(),
									name: z.string(),
									logo: z.string().nullable(),
								}),
							}),
						),
					},
				},
			},
			403: {
				description: "Not authorized",
			},
			404: {
				description: "Organization not found",
			},
		},
	}),
	async (c) => {
		const { organizationId } = c.req.valid("param");
		const { logoPath } = c.req.valid("json");
		const user = c.get("user");

		if (!user) {
			throw new HTTPException(401, { message: "Unauthorized" });
		}

		// Check if user is a member of the organization
		const membership = await db.member.findFirst({
			where: {
				userId: user.id,
				organizationId,
			},
		});

		if (!membership) {
			throw new HTTPException(403, {
				message: "Not authorized to update this organization",
			});
		}

		// Update the organization logo
		const updatedOrganization = await db.organization.update({
			where: { id: organizationId },
			data: { logo: logoPath },
			select: {
				id: true,
				name: true,
				logo: true,
			},
		});

		return c.json({
			success: true,
			organization: updatedOrganization,
		});
	},
);
