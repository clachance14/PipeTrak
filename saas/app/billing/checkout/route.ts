import { getAuthOptions } from '@auth/providers/nextauth';
import { createCheckoutLink } from '@billing/server';
import { getBaseUrl } from '@common/lib';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const session = await getServerSession(getAuthOptions());

  const searchParams = new URLSearchParams(req.nextUrl.search);

  const variantIds = (searchParams.get('variantIds') ?? '')
    .split(',')
    .filter((id) => !!id)
    .map((id) => parseInt(id, 10));
  const storeId = searchParams.get('storeId');

  if (!session) {
    return NextResponse.redirect(
      `${getBaseUrl()}/signin?redirectTo=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`
    );
  }

  if (!variantIds.length || !storeId) {
    return NextResponse.redirect(`${getBaseUrl()}/dashboard/settings/billing`);
  }

  const checkoutLink = await createCheckoutLink({
    variantIds,
    storeId,
    user: session.user,
    redirectUrl: `${getBaseUrl()}/dashboard/settings/billing`,
  });

  return NextResponse.redirect(checkoutLink, {
    status: 302,
  });
}
