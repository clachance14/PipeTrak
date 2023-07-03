import { Footer, NavBar } from "@components";
import { Providers } from "common/components";
import { Metadata } from "next";
import { NextIntlClientProvider, useLocale } from "next-intl";
import { getTranslator } from "next-intl/server";
import { Manrope } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";

export const metadata: Metadata = {
  title: {
    absolute: "supastarter.nextjs Demo",
    default: "supastarter.nextjs Demo",
    template: "%s | supastarter.nextjs Demo",
  },
};

const sansFont = Manrope({
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
  const t = await getTranslator(locale, "common");

  // Show a 404 error if the user requests an unknown locale
  if (params.locale !== locale) {
    notFound();
  }
  const messages = (await import(`../../locales/${locale}.json`)).default;

  return (
    <html lang="en">
      <body className={`${sansFont.variable} font-sans`}>
        <Providers>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <NavBar
              menuItems={[
                {
                  label: t("menu.pricing"),
                  href: "/pricing",
                },
                {
                  label: t("menu.blog"),
                  href: "/blog",
                },
              ]}
              labels={{ signIn: "Sign in" }}
            />
            {children}
            <Footer />
          </NextIntlClientProvider>
        </Providers>
      </body>
    </html>
  );
}
