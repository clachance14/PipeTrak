import { Footer, NavBar } from "@components";
import { Providers } from "common/components";
import { Metadata } from "next";
import useTranslation from "next-translate/useTranslation";
import { Inter } from "next/font/google";
import { redirect } from "next/navigation";
import i18n from "../../i18n";
import "../globals.css";

export const metadata: Metadata = {
  title: {
    absolute: "supastarter.nextjs Demo",
    default: "supastarter.nextjs Demo",
    template: "%s | supastarter.nextjs Demo",
  },
};

const sansFont = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { lang } = useTranslation();

  // Redirect to default locale if lang is not supported. /second-page -> /en/second-page
  if (!i18n.locales.includes(lang)) redirect(`/${i18n.defaultLocale}/${lang}`);

  return (
    <html lang="en">
      <body className={`${sansFont.variable} font-sans`}>
        <Providers>
          <NavBar
            menuItems={[
              {
                label: "Pricing",
                href: "/pricing",
              },
              {
                label: "Blog",
                href: "/blog",
              },
            ]}
            labels={{ signIn: "Sign in" }}
          />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
