import { Providers } from '@common/components/Providers';
import { pick } from '@common/utils/helper';
import { ConsentBanner } from '@consent-banner/client';
import { NextIntlClientProvider, useLocale } from 'next-intl';
import { Manrope } from 'next/font/google';
import { notFound } from 'next/navigation';
import { PropsWithChildren } from 'react';
import '../../styles/globals.scss';

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
});

export default async function RootLayout({ children, params }: PropsWithChildren<{ params: { locale: string } }>) {
  const locale = useLocale();

  if (params.locale !== locale) notFound();

  const messages = (await import(`../../locales/${locale}.json`)).default as IntlMessages;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${manrope.variable} font-sans`}>
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
