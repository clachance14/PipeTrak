import { getAuthOptions } from '@auth/providers/nextauth';
import { createCustomerPortalLink } from '@billing/server';
import { getBaseUrl } from '@common/lib';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const session = await getServerSession(getAuthOptions());

  const searchParams = new URLSearchParams(req.nextUrl.search);
  const subscriptionId = searchParams.get('subscriptionId') ?? '';

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
