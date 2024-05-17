import { AnalyticsScript } from "@analytics";
import { Toaster } from "@ui/components/toaster";
import { cn } from "@ui/lib";
import type { Metadata } from "next";
import { NextIntlClientProvider, useLocale } from "next-intl";
import { Poppins } from "next/font/google";
import { notFound } from "next/navigation";
import NextTopLoader from "nextjs-toploader";
import { getMessagesForLocale } from "../../i18n";

import { ApiClientProvider } from "@shared/components/ApiClientProvider";
import { GradientBackgroundWrapper } from "@shared/components/GradientBackgroundWrapper";
import { ThemeProvider } from "next-themes";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    absolute: "supastarter.nextjs - Application",
    default: "supastarter.nextjs- Application",
    template: "%s | supastarter.nextjs - Application",
  },
};

const sansFont = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const locale = useLocale();

  if (params.locale !== locale) {
    notFound();
  }

  const messages = await getMessagesForLocale(locale);

  return (
    <html lang={locale}>
      <body
        className={cn(
          "bg-background text-foreground min-h-screen font-sans antialiased",
          sansFont.variable,
        )}
      >
        <NextTopLoader color="var(--colors-primary)" />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider attribute="class">
            <ApiClientProvider>
              <GradientBackgroundWrapper>{children}</GradientBackgroundWrapper>
            </ApiClientProvider>
          </ThemeProvider>
          <Toaster />
        </NextIntlClientProvider>
        <AnalyticsScript />
      </body>
    </html>
  );
}
