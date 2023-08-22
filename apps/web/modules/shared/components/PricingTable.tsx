"use client";

import { Button, Tabs, TabsList, TabsTrigger } from "@ui/components";
import { useState } from "react";

export function PricingTable({
  plans,
  activePlanId,
  onSelectPlan,
  labels,
}: {
  plans: Array<{
    id: string;
    name: string;
    description?: string;
    features?: Array<string>;
    currency: string;
    variants: Array<{
      id: string | number;
      price: number;
      interval: string;
      interval_count: number;
    }>;
  }>;
  activePlanId?: string;
  onSelectPlan: (planId: string, variantId: string) => void | Promise<void>;
  labels: {
    yearly: string;
    monthly: string;
    month: string;
    year: string;
    subscribe: string;
    currentPlan?: string;
    switchToPlan?: string;
  };
}) {
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const isActivePlan = (plan: (typeof plans)[number]) => {
    return activePlanId === plan.id;
  };

  return (
    <div className="@container">
      <div className="flex justify-center">
        <Tabs
          value={interval}
          onValueChange={(value) => setInterval(value as typeof interval)}
          className="mb-4"
        >
          <TabsList>
            <TabsTrigger value="month">{labels.monthly}</TabsTrigger>
            <TabsTrigger value="year">{labels.yearly}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="@md:grid-cols-2 grid gap-4">
        {plans.map((plan) => {
          const variant = plan.variants.find((v) => v.interval === interval);

          if (!variant) return null;

          return (
            <div key={plan.id} className="border-border rounded-xl border p-6">
              <h3 className="mb-4 text-2xl font-bold">{plan.name}</h3>
              {plan.description && (
                <div
                  className="prose text-muted-foreground mb-2"
                  dangerouslySetInnerHTML={{ __html: plan.description }}
                />
              )}

              {!!plan.features?.length && (
                <ul className="text-muted-foreground mb-4 grid list-disc gap-2 pl-4">
                  {plan.features.map((feature, key) => (
                    <li key={key}>{feature}</li>
                  ))}
                </ul>
              )}

              <strong className="text-primary text-4xl font-bold">
                {Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: plan.currency,
                }).format(variant.price / 100)}
                <span className="text-sm"> / {labels[interval]}</span>
              </strong>

              <Button
                disabled={isActivePlan(plan)}
                loading={selectedPlan === plan.id}
                className="mt-4 w-full"
                onClick={async () => {
                  setSelectedPlan(plan.id);
                  await onSelectPlan(plan.id, String(variant.id));
                  setSelectedPlan(null);
                }}
              >
                {isActivePlan(plan)
                  ? labels.currentPlan
                  : activePlanId
                  ? labels.switchToPlan
                  : labels.subscribe}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
