import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

export const metadata: Metadata = {
  title: {
    absolute: 'supastarter.nextjs - Application',
    default: 'supastarter.nextjs- Application',
    template: '%s | supastarter.nextjs - Application',
  },
};

const sansFont = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sansFont.variable} font-sans`}>{children}</body>
    </html>
  );
}
