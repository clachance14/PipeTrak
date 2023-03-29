import PricingTable from '../../../../../modules/billing/components/PricingTable';
import { getAllPlans } from '../../../../../modules/billing/lemonsqueezy';

export default async function BillingSettingsPage() {
  const plans = await getAllPlans();

  return (
    <div>
      <PricingTable plans={plans} />
    </div>
  );
}
