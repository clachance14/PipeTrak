import { getUserSession } from "auth";
import { createCustomerPortalLink } from "billing/subscriptions";
import { getBaseUrl } from "common/util";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getUserSession();

  const searchParams = new URLSearchParams(req.nextUrl.search);
  const subscriptionId = searchParams.get("subscriptionId") ?? "";

  if (!session) {
    return NextResponse.redirect(`${getBaseUrl()}/signin`);
  }

  if (!subscriptionId) {
    return NextResponse.redirect(`${getBaseUrl()}/dashboard/settings/billing`);
  }

  const portalLink = await createCustomerPortalLink({
    subscriptionId,
  });

  return NextResponse.redirect(portalLink, {
    status: 302,
  });
}
