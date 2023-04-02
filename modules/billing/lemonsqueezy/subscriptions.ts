import { Subscription } from '@prisma/client';
import { User } from 'next-auth';
import prisma from '../../../prisma/prisma';
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

export async function updateUserSubscription(
  subscription: Omit<Subscription, 'id'> & {
    customerId?: string;
    userId?: string;
  }
) {
  if (!subscription.customerId && !subscription.userId) {
    throw new Error('Either customerId or userId must be provided');
  }

  const existingSubscription = await prisma.subscription.findFirst({
    where: subscription.userId
      ? {
          userId: subscription.userId,
        }
      : {
          customerId: subscription.customerId,
        },
  });

  if (existingSubscription) {
    await prisma.subscription.update({
      where: {
        id: existingSubscription.id,
      },
      data: {
        ...subscription,
      },
    });

    return;
  }

  await prisma.subscription.create({
    data: {
      ...subscription,
    },
  });
}
