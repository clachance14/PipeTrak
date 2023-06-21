import { Footer, NavBar } from "@components";
import { Providers } from "common/components";
import { Metadata } from "next";
import { Inter } from "next/font/google";
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
