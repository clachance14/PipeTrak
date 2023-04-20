import { createCustomerPortalLink } from '@billing/server';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl } from '../../../../config';
import { getAuthOptions } from '../../../../nextauth.config';

export async function GET(req: NextRequest) {
  const session = await getServerSession(getAuthOptions());

  const searchParams = new URLSearchParams(req.nextUrl.search);
  const subscriptionId = searchParams.get('subscriptionId') ?? '';

  if (!session) {
    return NextResponse.redirect(`${getBaseUrl()}/auth/signin`);
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
