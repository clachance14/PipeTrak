import { getUserSession } from "auth";
import { getAllPlans } from "billing/subscriptions";
import { getSubscriptionByUserId } from "database";
import { getTranslator } from "next-intl/server";
import CurrentSubscription from "./CurrentSubscription";
import UpgradePlan from "./UpgradePlan";

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
  const session = await getUserSession();
  const t = await getTranslator(locale, "settings.billing");
  const plans = await getAllPlans();

  const userSubscription = await getSubscriptionByUserId(session!.user.id);

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
