import { routing } from "@i18n/routing";
import { config as appConfig } from "@repo/config";
import {
	getOrganizationsForSession,
	getSession,
} from "@shared/lib/middleware-helpers";
import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

export default async function middleware(req: NextRequest) {
	if (req.nextUrl.pathname.startsWith("/app")) {
		if (
			appConfig.organizations.requireOrganization &&
			req.nextUrl.pathname === "/app"
		) {
			const session = await getSession(req);
			const organizations = await getOrganizationsForSession(req);
			const organization =
				organizations.find(
					(org) => org.id === session?.session.activeOrganizationId,
				) || organizations[0];

			return NextResponse.redirect(
				new URL(
					organization ? `/app/${organization.slug}` : "/app/new-organization",
					req.nextUrl.origin,
				),
			);
		}

		return NextResponse.next();
	}

	return intlMiddleware(req);
}

export const config = {
	matcher: [
		"/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
	],
};
