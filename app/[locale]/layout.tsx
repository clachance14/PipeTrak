import { Providers } from '@common/components/Providers';
import { ConsentBanner } from '@common/components/client';
import { pick } from '@common/lib/helper';
import { Metadata } from 'next';
import { NextIntlClientProvider, useLocale } from 'next-intl';
import { Manrope } from 'next/font/google';
import { notFound } from 'next/navigation';
import { PropsWithChildren } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: {
    absolute: 'supastarter.nextjs Demo',
    default: 'supastarter.nextjs Demo',
    template: '%s | supastarter.nextjs Demo',
  },
};

const sansFont = Manrope({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

export default async function RootLayout({ children, params }: PropsWithChildren<{ params: { locale: string } }>) {
  const locale = useLocale();

  if (params.locale !== locale) notFound();

  const messages = (await import(`../../locales/${locale}.json`)).default as IntlMessages;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${sansFont.variable} font-sans`}>
        <Providers>
          <NextIntlClientProvider locale={locale} messages={pick(messages, ['common'])}>
            {children}
          </NextIntlClientProvider>
        </Providers>

        <ConsentBanner />
      </body>
    </html>
  );
}
