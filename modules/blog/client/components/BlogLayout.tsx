import { NavBar } from '@common/client';
import { PropsWithChildren } from 'react';

export function BlogLayout({ children }: PropsWithChildren<{}>) {
  return (
    <div>
      <NavBar />
      <main className="py-12">
        <div className="container">
          <h1>Blog</h1>
          {children}
        </div>
      </main>
    </div>
  );
}
