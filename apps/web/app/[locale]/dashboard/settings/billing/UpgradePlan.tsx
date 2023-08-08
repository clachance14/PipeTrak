"use client";

import { SubscriptionPlan } from "@supastarter/backend/billing/subscriptions";
import { apiClient } from "@supastarter/frontend/shared/api";
import { PricingTable } from "@supastarter/frontend/web/ui/marketing";
import { useTranslations } from "next-intl";

export default function UpgradePlan({
  plans,
  activePlanId,
}: {
  plans: SubscriptionPlan[];
  activePlanId: string;
}) {
  const createCheckoutLinkMutation = apiClient.createCheckoutLink.useMutation();
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
