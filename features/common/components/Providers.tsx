'use client';

import TrpcProvider from '@common/components/TrpcProvider';
import { Provider as JotaiProvider } from 'jotai';
import { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { PropsWithChildren } from 'react';

export function Providers({ children, session }: PropsWithChildren<{ session?: Session }>) {
  return (
    <ThemeProvider attribute="class">
      <JotaiProvider>
        <SessionProvider session={session}>
          <TrpcProvider>{children}</TrpcProvider>
        </SessionProvider>
      </JotaiProvider>
    </ThemeProvider>
  );
}
