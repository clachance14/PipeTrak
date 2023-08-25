import { CurrentSubscription, UpgradePlan } from "@saas/settings/components";
import { createApiCaller } from "api";
import { getTranslator, redirect } from "next-intl/server";

export async function generateMetadata({ params: { locale } }) {
  const t = await getTranslator(locale);

  return {
    title: t("settings.billing.title"),
  };
}

export default async function BillingSettingsPage({
  params: { teamSlug },
}: {
  params: { teamSlug: string };
}) {
  const apiCaller = await createApiCaller();
  const plans = await apiCaller.billing.plans();
  const team = await apiCaller.team.bySlug({ slug: teamSlug });

  if (!team) redirect("/auth/login");

  const userSubscription = await apiCaller.team.subscription({
    teamId: team.id,
  });

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
