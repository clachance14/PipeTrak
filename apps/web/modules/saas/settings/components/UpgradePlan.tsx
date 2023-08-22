"use client";

import { ActionBlock } from "@saas/shared/components";
import { PricingTable } from "@shared/components";
import { SubscriptionPlan } from "api";
import { apiClient } from "api/client";
import { useTranslations } from "next-intl";

export function UpgradePlan({
  plans,
  activePlanId,
}: {
  plans: SubscriptionPlan[];
  activePlanId: string;
}) {
  const createCheckoutLinkMutation =
    apiClient.billing.createCheckoutLink.useMutation();
  const t = useTranslations("settings.billing");

  return (
    <ActionBlock title={t("subscription.upgradePlan")}>
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
    </ActionBlock>
  );
}
