import { User } from 'next-auth';
import { SubscriptionPlan } from '../types';
import { lemonsqueezyApi } from './api-client';

export async function getAllPlans(): Promise<SubscriptionPlan[]> {
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
}

export async function createCheckoutLink(params: {
  storeId: string | number;
  variantIds: (number | string)[];
  user: User;
}): Promise<string> {
  const { variantIds, user, storeId } = params;

  const response = await lemonsqueezyApi('/checkouts', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          product_options: {
            enabled_variants: variantIds,
          },
          checkout_data: {
            email: user.email,
            name: user.name,
            custom: {
              userId: user.id,
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
