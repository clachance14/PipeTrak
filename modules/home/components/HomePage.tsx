import { NewsletterSection } from '@newsletter/client';
import Head from 'next/head';
import { FeaturesSection } from './FeaturesSection';
import { Footer } from './Footer';
import { HeroSection } from './HeroSection';
import { NavBar } from './NavBar';

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
