"use client";

import { PricingTable as PricingTablePrimitive } from "@/components/marketing";
import { type SubscriptionPlan } from "api";
import { useTranslations } from "next-intl";

export function PricingTable({ plans }: { plans: SubscriptionPlan[] }) {
  const t = useTranslations("pricing");
  return (
    <PricingTablePrimitive
      plans={plans}
      onSelectPlan={() => {
        window.location.href = `/settings/billing`;
      }}
      labels={{
        year: t("year"),
        month: t("month"),
        yearly: t("yearly"),
        monthly: t("monthly"),
        subscribe: t("subscribe"),
      }}
    />
  );
}
