import { appConfig } from "@config";
import { authMiddleware } from "auth/middleware";
import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";

const intlMiddleware = createMiddleware(appConfig.i18n);

const publicPages = ["/auth/signin", "/auth/signup", "/auth/forgot-password"];

export default function middleware(req: NextRequest) {
  const publicPathnameRegex = RegExp(
    `^(/(${appConfig.i18n.locales.join("|")}))?(${publicPages.join("|")})${
      publicPages.includes("/") ? "?" : "+"
    }/?$`,
    "i",
  );
  const isPublicPage = publicPathnameRegex.test(req.nextUrl.pathname);

  if (isPublicPage) {
    return intlMiddleware(req);
  }

  return authMiddleware(intlMiddleware)(req);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
