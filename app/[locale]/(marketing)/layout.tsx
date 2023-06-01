import Footer from '@common/components/Footer';
import NavBar from '@common/components/NavBar';
import { PropsWithChildren } from 'react';

export default function MarketingLayout({ children }: PropsWithChildren<{}>) {
  return (
    <div>
      <NavBar />
      {children}
      <Footer />
    </div>
  );
}
