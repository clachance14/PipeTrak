import PricingSection from '@billing/components/PricingSection';
import { getAllPlans } from '@billing/server';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('pricing');

  return {
    title: t('title'),
  };
}

export default async function PricingPage() {
  const plans = await getAllPlans();

  return <PricingSection plans={plans} />;
}
