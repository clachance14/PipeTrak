import { TrpcProvider } from "api/client";
import { AuthProvider } from "auth-client";
import { Providers } from "common/components";
import { Metadata } from "next";
import { useLocale } from "next-intl";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
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

  return (
    <html lang={locale}>
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
