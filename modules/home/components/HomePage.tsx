import Footer from '@common/components/Footer';
import NavBar from '@common/components/NavBar';
import NewsletterSection from '@newsletter/components/NewsletterSection';
import FeaturesSection from './FeaturesSection';
import HeroSection from './HeroSection';

export default function HomePage() {
  return (
    <>
      <NavBar />
      <HeroSection />
      <FeaturesSection />
      <NewsletterSection />
      <Footer />
    </>
  );
}
