import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { appConfig } from "./config";

const intlMiddleware = createMiddleware(appConfig.i18n);

const publicPages = ["/auth/signin", "/auth/signup", "/auth/forgot-password"];

export default async function middleware(req: NextRequest) {
  // const publicPathnameRegex = RegExp(
  //   `^(/(${appConfig.i18n.locales.join("|")}))?(${publicPages.join("|")})${
  //     publicPages.includes("/") ? "?" : "+"
  //   }/?$`,
  //   "i",
  // );
  // const isPublicPage = publicPathnameRegex.test(req.nextUrl.pathname);
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // if (isPublicPage) {
  return intlMiddleware(req);
  // }

  // return authMiddleware(intlMiddleware)(req);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
