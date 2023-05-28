import Footer from '@common/components/Footer';
import NavBar from '@common/components/NavBar';
import FeaturesSection from '@home/components/FeaturesSection';
import HeroSection from '@home/components/HeroSection';
import NewsletterSection from '@newsletter/components/NewsletterSection';
import { getTranslations } from 'next-intl/server';
import PricingSection from '../../modules/billing/components/PricingSection';
import { getAllPlans } from '../../modules/billing/lemonsqueezy';

export async function generateMetadata() {
  const t = await getTranslations('home');

  return {
    title: t('title'),
  };
}

export default async function HomePage() {
  const plans = await getAllPlans();

  return (
    <>
      <NavBar />
      <HeroSection />
      <FeaturesSection />
      <PricingSection plans={plans} />
      <NewsletterSection />
      <Footer />
    </>
  );
}
