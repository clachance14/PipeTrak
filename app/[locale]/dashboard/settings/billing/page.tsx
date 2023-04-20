import CurrentSubscription from '@billing/components/CurrentSubscription';
import PricingTable from '@billing/components/PricingTable';
import { getAllPlans, getUserSubscription } from '@billing/server';

export default async function BillingSettingsPage() {
  const plans = await getAllPlans();
  const userSubscription = await getUserSubscription();

  return (
    <div>
      {userSubscription && (
        /* @ts-expect-error Async Server Component */
        <CurrentSubscription {...{ plans, userSubscription }} className="mb-8" />
      )}
      <PricingTable plans={plans} userSubscription={userSubscription} />
    </div>
  );
}
