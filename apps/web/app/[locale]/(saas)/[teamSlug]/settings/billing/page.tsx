import { CurrentSubscription, UpgradePlan } from "@saas/settings/components";
import { createApiCaller } from "api";
import { getTranslator } from "next-intl/server";

export async function generateMetadata({ params: { locale } }) {
  const t = await getTranslator(locale, "settings.billing");

  return {
    title: t("title"),
  };
}

export default async function BillingSettingsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const apiCaller = await createApiCaller();
  const t = await getTranslator(locale, "settings.billing");
  const user = await apiCaller.user.info();
  const plans = await apiCaller.billing.plans();
  const userSubscription = await apiCaller.billing.userSubscription();

  return (
    <div>
      <CurrentSubscription
        plans={plans}
        userSubscription={userSubscription}
        className="mb-8"
      />
      <UpgradePlan plans={plans} activePlanId={userSubscription?.planId} />
    </div>
  );
}
