import CurrentSubscription from '@billing/components/CurrentSubscription';
import PricingTable from '@billing/components/PricingTable';
import { getAllPlans, getUserSubscription } from '@billing/server';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('settings.billing');

  return {
    title: t('title'),
  };
}

export default async function BillingSettingsPage() {
  const plans = await getAllPlans();
  const userSubscription = await getUserSubscription();

  return (
    <div>
      {userSubscription && <CurrentSubscription {...{ plans, userSubscription }} className="mb-8" />}
      <PricingTable plans={plans} userSubscription={userSubscription} />
    </div>
  );
}
