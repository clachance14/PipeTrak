import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { appConfig } from "./config";

const intlMiddleware = createMiddleware(appConfig.i18n);

export default async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (req.nextUrl.pathname.startsWith("/auth") && session?.user)
    return NextResponse.redirect(new URL("/team/redirect", req.nextUrl.origin));

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
