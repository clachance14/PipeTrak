"use client";

import { env } from "@env.mjs";
import { SubscriptionPlan } from "billing/subscriptions";
import { useState } from "react";
import { Button } from "ui";

export default function PricingTable({
  plans,
  userSubscription,
}: {
  plans: SubscriptionPlan[];
  userSubscription?: { planId: string } | null;
}) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null,
  );

  const getCheckoutLink = (params: {
    variantIds: number[];
    storeId: string;
  }) => {
    return `/billing/checkout?variantIds=${params.variantIds.join(
      ",",
    )}&storeId=${params.storeId}`;
  };

  const isActiveSubscription = (plan: SubscriptionPlan) => {
    return userSubscription?.planId === plan.id;
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => {
          const variant = plan.variants.find((v) => v.interval === "month");

          if (!variant) return null;

          return (
            <div
              key={plan.id}
              className="rounded-xl border p-6 dark:border-zinc-700"
            >
              <h3 className="mb-4 text-2xl font-bold">{plan.name}</h3>
              {/* <p className="mb-4 opacity-50" dangerouslySetInnerHTML={{ __html: plan.description ?? '' }} /> */}

              <ul className="mb-4 grid list-disc gap-2 pl-4 text-zinc-500">
                <li>Feature A</li>
                <li>Feature B</li>
                <li>Feature C</li>
              </ul>

              <strong className="text-primary-500 text-4xl font-bold">
                {Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: plan.currency,
                }).format(variant.price / 100)}
              </strong>

              <Button
                as="a"
                isDisabled={isActiveSubscription(plan)}
                href={`${env.NEXT_PUBLIC_SAAS_URL}/settings/billing`}
                className="mt-4 w-full"
              >
                {isActiveSubscription(plan)
                  ? "Current Plan"
                  : userSubscription
                  ? "Switch to this plan"
                  : "Subscribe"}
              </Button>
            </div>
          );
        })}
      </div>
    </>
  );
}
