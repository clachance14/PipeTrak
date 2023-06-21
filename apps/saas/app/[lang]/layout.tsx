import { TrpcProvider } from "api/client";
import { AuthProvider } from "auth-client";
import { Providers } from "common/components";
import { Metadata } from "next";
import useTranslation from "next-translate/useTranslation";
import { Inter } from "next/font/google";
import { redirect } from "next/navigation";
import i18n from "../../i18n";
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { lang } = useTranslation();

  // Redirect to default locale if lang is not supported. /second-page -> /en/second-page
  if (!i18n.locales.includes(lang)) redirect(`/${i18n.defaultLocale}/${lang}`);

  return (
    <html lang={lang}>
      <body className={`${sansFont.variable} font-sans`}>
        <Providers>
          <AuthProvider>
            <TrpcProvider>{children}</TrpcProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
