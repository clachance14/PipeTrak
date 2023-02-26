import { ProgressBar, ToastProvider } from '@common/client';
import { trpc } from '@common/server';
import { ConsentBanner } from '@consent-banner/client';
import { Manrope } from '@next/font/google';
import { SessionProvider } from 'next-auth/react';
import { appWithTranslation } from 'next-i18next';
import { ThemeProvider } from 'next-themes';
import { AppProps } from 'next/app';
import '../styles/globals.scss';

// import lexend font with @next/font
const manrope = Manrope({
  subsets: ['latin'],
});

function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <style jsx global>{`
        :root {
          --font-manrope: ${manrope.style.fontFamily};
        }
      `}</style>

      <ThemeProvider forcedTheme={(Component as any).theme || undefined} attribute="class">
        <ProgressBar />
        <SessionProvider>
          <ToastProvider>
            <Component {...pageProps} />
          </ToastProvider>
        </SessionProvider>
      </ThemeProvider>

      <ConsentBanner />
    </>
  );
}

export default trpc.withTRPC(appWithTranslation(App));
