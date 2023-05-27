import Footer from '@common/components/Footer';
import NavBar from '@common/components/NavBar';
import { PropsWithChildren } from 'react';

export default function BlogPage({ children }: PropsWithChildren<{}>) {
  return (
    <div>
      <NavBar />
      <main className="py-12">
        <div className="container max-w-2xl">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
