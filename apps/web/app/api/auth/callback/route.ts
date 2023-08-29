import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectTo = requestUrl.searchParams.get("redirectTo");

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code);
  }

  if (redirectTo)
    return redirectTo.startsWith("http")
      ? NextResponse.redirect(redirectTo)
      : NextResponse.redirect(`${requestUrl.origin}${redirectTo}`);

  return NextResponse.redirect(`${requestUrl.origin}/team/redirect`);
}
