import { updateUserSubscription } from '@billing/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { buffer } from 'micro';
import { NextApiRequest, NextApiResponse } from 'next';

const lemonsqueezySigningSecret = process.env.LEMONSQUEEZY_SIGNING_SECRET as string;

if (!lemonsqueezySigningSecret) {
  throw new Error('Missing env for lemonsqueezy signing secret');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const buf = await buffer(req);
  const sig =
    ((req.headers instanceof Headers ? req.headers.get('x-signature') : req.headers['x-signature']) as string) ?? '';

  if (!sig) {
    res.status(400).send('Missing signature');
    return;
  }

  const hmac = createHmac('sha256', lemonsqueezySigningSecret);
  const digest = Buffer.from(hmac.update(buf).digest('hex'), 'utf8');

  if (!timingSafeEqual(digest, Buffer.from(sig, 'utf8'))) {
    res.status(403).send('Invalid signature.');
    return;
  }

  const body = JSON.parse(buf.toString('utf-8'));

  const {
    data,
    meta: { event_name, custom_data },
  } = body;

  switch (event_name) {
    case 'subscription_created':
    case 'subscription_updated':
    case 'subscription_cancelled':
    case 'subscription_expired':
    case 'subscription_resumed':
      await updateUserSubscription({
        userId: custom_data?.user_id,
        customerId: String(data.attributes.customer_id),
        planId: String(data.attributes.product_id),
        variantId: String(data.attributes.variant_id),
        status: data.attributes.status,
        subscriptionId: String(data.id),
        nextPaymentDate: new Date(data.attributes.trial_ends_at ?? data.attributes.renews_at),
      });
      break;
  }

  res.status(204).end();
}
export const config = {
  api: {
    bodyParser: false,
  },
};
