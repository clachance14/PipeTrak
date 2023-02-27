import { Footer, NavBar } from '@common/client';
import { NewsletterSection } from '@newsletter/client';
import Head from 'next/head';
import { FeaturesSection } from './FeaturesSection';
import { HeroSection } from './HeroSection';

export function HomePage() {
  return (
    <>
      <Head>
        <title>supastarter.nextjs.</title>
      </Head>

      <NavBar />
      <HeroSection />
      <FeaturesSection />
      <NewsletterSection />
      <Footer />
    </>
  );
}
