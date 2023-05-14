import { User } from 'next-auth';
import { cache } from 'react';
import { SubscriptionPlan } from '../types';
import { lemonsqueezyApi } from './api-client';

export const getAllPlans = cache(async function (): Promise<SubscriptionPlan[]> {
  const response = await lemonsqueezyApi('/products?include=variants,store');

  return response.data
    .map((product: any): SubscriptionPlan => {
      const store = response.included.find(
        (item: any) => item.type === 'stores' && Number(product.attributes.store_id) === Number(item.id)
      );
      const currency = store.attributes.currency ?? 'USD';

      return {
        id: product.id,
        name: product.attributes.name,
        description: product.attributes.description,
        currency,
        storeId: String(store.id),
        variants: response.included
          .filter(
            (item: any) =>
              item.type === 'variants' &&
              item.attributes.is_subscription &&
              Number(item.attributes.product_id) === Number(product.id)
          )
          .map((variant: any) => ({
            id: variant.id,
            interval: variant.attributes.interval,
            interval_count: variant.attributes.interval_count,
            price: variant.attributes.price,
            checkoutLink: product.attributes.buy_now_url,
          })),
      };
    })
    .filter((product: any) => product.variants.length > 0);
});

export async function createCheckoutLink(params: {
  storeId: string | number;
  variantIds: (number | string)[];
  user: User;
  redirectUrl?: string;
}): Promise<string> {
  const { variantIds, user, storeId, redirectUrl } = params;

  const response = await lemonsqueezyApi('/checkouts', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          product_options: {
            enabled_variants: variantIds,
            redirect_url: redirectUrl,
          },
          checkout_data: {
            email: user.email,
            name: user.name,
            custom: {
              user_id: user.id,
            },
          },
        },
        relationships: {
          store: {
            data: {
              type: 'stores',
              id: String(storeId),
            },
          },
          variant: {
            data: {
              type: 'variants',
              id: String(variantIds[0]),
            },
          },
        },
      },
    }),
  });

  return response.data.attributes.url;
}

export async function createCustomerPortalLink(params: { subscriptionId: string }): Promise<string> {
  const { subscriptionId } = params;

  const response = await lemonsqueezyApi(`/subscriptions/${subscriptionId}`);

  return response.data.attributes.urls.update_payment_method;
}

export async function cancelSubscription(params: { subscriptionId: string }): Promise<void> {
  const { subscriptionId } = params;

  await lemonsqueezyApi(`/subscriptions/${subscriptionId}`, {
    method: 'DELETE',
  });
}
