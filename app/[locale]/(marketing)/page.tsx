import FeaturesSection from '@landingpage/components/FeaturesSection';
import HeroSection from '@landingpage/components/HeroSection';
import NewsletterSection from '@newsletter/components/NewsletterSection';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('home');

  return {
    title: t('title'),
  };
}

export default async function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <NewsletterSection />
    </>
  );
}
