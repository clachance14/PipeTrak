'use client';

import { Subscription } from '@prisma/client';
import { Button } from '@ui/components';
import { useState } from 'react';
import { SubscriptionPlan } from '../types';

export default function PricingTable({
  plans,
  userSubscription,
}: {
  plans: SubscriptionPlan[];
  userSubscription?: Subscription | null;
}) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  const getCheckoutLink = (params: { variantIds: number[]; storeId: string }) => {
    return `/billing/checkout?variantIds=${params.variantIds.join(',')}&storeId=${params.storeId}`;
  };

  const isActiveSubscription = (plan: SubscriptionPlan) => {
    return userSubscription?.planId === plan.id;
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => {
          const variant = plan.variants.find((v) => v.interval === 'month');

          if (!variant) return null;

          return (
            <div key={plan.id} className="rounded-xl border p-6 dark:border-zinc-700">
              <h3 className="mb-4 text-2xl font-bold">{plan.name}</h3>
              {/* <p className="mb-4 opacity-50" dangerouslySetInnerHTML={{ __html: plan.description ?? '' }} /> */}

              <ul className="mb-4 grid list-disc gap-2 pl-4 text-zinc-500">
                <li>Feature A</li>
                <li>Feature B</li>
                <li>Feature C</li>
              </ul>

              <strong className="text-4xl font-bold text-blue-500">
                {Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: plan.currency,
                }).format(variant.price / 100)}
              </strong>

              <Button
                as={isActiveSubscription(plan) ? 'button' : 'a'}
                isDisabled={isActiveSubscription(plan)}
                {...(!isActiveSubscription(plan)
                  ? {
                      href: getCheckoutLink({
                        variantIds: plan.variants.map((variant) => Number(variant.id)),
                        storeId: plan.storeId,
                      }),
                    }
                  : {})}
                className="mt-4 w-full"
              >
                {isActiveSubscription(plan) ? 'Current Plan' : userSubscription ? 'Switch to this plan' : 'Subscribe'}
              </Button>
            </div>
          );
        })}
      </div>
    </>
  );
}
