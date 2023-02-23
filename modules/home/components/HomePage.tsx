import { Button, ColorModeToggle } from '@common/client';
import { NewsletterSection } from '@newsletter/client';
import { signOut, useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import Features from './Features';
import Hero from './Hero';
import NavBar from './NavBar';

export function HomePage() {
  const { data: session } = useSession();

  return (
    <>
      <Head>
        <title>aviato.</title>
      </Head>

      <NavBar />
      <Hero />
      <Features />
      <NewsletterSection />

      <div className="min-h-screen bg-white py-8 dark:bg-zinc-900 dark:text-white">
        <div className="container">
          <p className="mt-4">Welcome to the home page.</p>

          <Link href="/dashboard">Dashboard &rarr;</Link>

          <ColorModeToggle />

          {session ? (
            <>
              Signed in as {session.user.email} <br />
              <Button onClick={() => signOut()}>Sign out</Button>
            </>
          ) : (
            <>
              Not signed in <br />
              <Link href="/auth/signin">Sign in</Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
