'use client';

import { Provider as JotaiProvider } from 'jotai';
import { ThemeProvider } from 'next-themes';
import { PropsWithChildren } from 'react';

export function Providers({ children }: PropsWithChildren<{}>) {
  return (
    <ThemeProvider attribute="class">
      <JotaiProvider>{children}</JotaiProvider>
    </ThemeProvider>
  );
}
