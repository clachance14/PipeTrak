"use client";

import { trpc } from "api/client/nextjs";
import { SubscriptionPlan } from "billing/subscriptions";
import { useTranslations } from "next-intl";
import { PricingTable } from "ui/marketing";

export default function UpgradePlan({
  plans,
  activePlanId,
}: {
  plans: SubscriptionPlan[];
  activePlanId: string;
}) {
  const createCheckoutLinkMutation = trpc.createCheckoutLink.useMutation();
  const t = useTranslations("settings.billing");

  return (
    <>
      <h3 className="mb-3 text-2xl font-semibold">
        {t("subscription.upgradePlan")}
      </h3>
      <PricingTable
        plans={plans}
        activePlanId={activePlanId}
        onSelectPlan={async (planId, variantId) => {
          const checkoutLink = await createCheckoutLinkMutation.mutateAsync({
            planId,
            variantId,
          });
          window.location.href = checkoutLink;
        }}
        labels={{
          currentPlan: t("subscription.currentPlan"),
          yearly: t("subscription.yearly"),
          monthly: t("subscription.monthly"),
          year: t("subscription.year"),
          month: t("subscription.month"),
          subscribe: t("subscription.subscribe"),
          switchToPlan: t("subscription.switchToPlan"),
        }}
      />
    </>
  );
}
