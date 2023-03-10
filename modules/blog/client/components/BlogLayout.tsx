import { PropsWithChildren } from 'react';

export function BlogLayout({ children }: PropsWithChildren<{}>) {
  return (
    <div>
      <main className="py-12">
        <div className="container max-w-2xl">{children}</div>
      </main>
    </div>
  );
}
