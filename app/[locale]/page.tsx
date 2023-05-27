export const generateMetadata = () => {
  return { title: 'supastarter.nextjs' };
};

import Footer from '@common/components/Footer';
import NavBar from '@common/components/NavBar';
import FeaturesSection from '@home/components/FeaturesSection';
import HeroSection from '@home/components/HeroSection';
import NewsletterSection from '@newsletter/components/NewsletterSection';
import PricingSection from '../../modules/billing/components/PricingSection';
import { getAllPlans } from '../../modules/billing/lemonsqueezy';

export default async function HomePage() {
  const plans = await getAllPlans();

  return (
    <>
      <NavBar />
      <HeroSection />
      <FeaturesSection />
      <PricingSection plans={plans} />
      {/* @ts-expect-error Server Component */}
      <NewsletterSection />
      <Footer />
    </>
  );
}
