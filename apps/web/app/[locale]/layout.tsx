import { AuthProvider } from "auth-client";
import { Metadata } from "next";
import { NextIntlClientProvider, useLocale } from "next-intl";
import { ThemeProvider } from "next-themes";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { TrpcProvider } from "trpc/client/nextjs";
import { ToastProvider } from "ui";
import "../globals.css";

export const metadata: Metadata = {
  title: {
    absolute: "supastarter.nextjs - Application",
    default: "supastarter.nextjs- Application",
    template: "%s | supastarter.nextjs - Application",
  },
};

const sansFont = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const locale = useLocale();

  // Show a 404 error if the user requests an unknown locale
  if (params.locale !== locale) {
    notFound();
  }
  const messages = (await import(`../../locales/${locale}.json`)).default;

  return (
    <html lang={locale}>
      <body
        className={`${sansFont.variable} bg-zinc-50 font-sans dark:bg-zinc-950`}
      >
        <ThemeProvider attribute="class">
          <AuthProvider>
            <TrpcProvider>
              <NextIntlClientProvider locale={locale} messages={messages}>
                <ToastProvider>{children}</ToastProvider>
              </NextIntlClientProvider>
            </TrpcProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
