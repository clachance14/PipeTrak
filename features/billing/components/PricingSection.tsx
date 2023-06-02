import { Subscription } from '@prisma/client';
import { SubscriptionPlan } from '../types';
import PricingTable from './PricingTable';

export default function PricingSection({
  plans,
  userSubscription,
}: {
  plans: SubscriptionPlan[];
  userSubscription?: Subscription | null;
}) {
  return (
    <div className="py-16">
      <div className="container">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold lg:text-5xl">Pricing</h1>
          <p className="mt-3 text-lg opacity-50">We have the right plan for every need.</p>
        </div>

        <PricingTable plans={plans} userSubscription={userSubscription} />
      </div>
    </div>
  );
}
