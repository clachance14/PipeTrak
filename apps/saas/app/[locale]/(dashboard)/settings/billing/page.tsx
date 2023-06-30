import { getUserSession } from "auth";
import { getAllPlans } from "billing/subscriptions";
import { getSubscriptionByUserId } from "database";
import { getTranslator } from "next-intl/server";
import CurrentSubscription from "./CurrentSubscription";

export async function generateMetadata({ params: { locale } }) {
  const t = await getTranslator(locale, "settings.billing");

  return {
    title: t("title"),
  };
}

export default async function BillingSettingsPage() {
  const session = await getUserSession();
  const plans = await getAllPlans();

  const userSubscription = await getSubscriptionByUserId(session!.user.id);
  console.log(plans);

  return (
    <div>
      {userSubscription && (
        <CurrentSubscription
          {...{ plans, userSubscription }}
          className="mb-8"
        />
      )}
      {/* <PricingTable plans={plans} userSubscription={userSubscription} /> */}
    </div>
  );
}
