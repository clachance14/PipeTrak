import { CurrentSubscription, UpgradePlan } from "@saas/settings/components";
import { createApiCaller } from "api";
import { getTranslator } from "next-intl/server";

export async function generateMetadata({ params: { locale } }) {
  const t = await getTranslator(locale);

  return {
    title: t("settings.billing.title"),
  };
}

export default async function BillingSettingsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const apiCaller = await createApiCaller();
  const user = await apiCaller.user.me();
  const plans = await apiCaller.billing.plans();
  const userSubscription = await apiCaller.team.subscription();

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
