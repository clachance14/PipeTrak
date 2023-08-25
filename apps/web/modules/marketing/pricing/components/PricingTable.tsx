"use client";

import { PricingTable as PricingTablePrimitive } from "@shared/components";
import { ApiOutput } from "api";
import { useTranslations } from "next-intl";

export function PricingTable({
  plans,
}: {
  plans: ApiOutput["billing"]["plans"];
}) {
  const t = useTranslations();
  return (
    <PricingTablePrimitive
      plans={plans}
      onSelectPlan={() => {
        window.location.href = `/settings/billing`;
      }}
      labels={{
        year: t("pricing.year"),
        month: t("pricing.month"),
        yearly: t("pricing.yearly"),
        monthly: t("pricing.monthly"),
        subscribe: t("pricing.subscribe"),
      }}
    />
  );
}
