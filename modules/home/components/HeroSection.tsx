import { Button } from '@common/client';
import Image from 'next/image';

import heroImage from '../../../public/hero-image.svg';

export function HeroSection() {
  return (
    <nav className="bg-gradient-to-b from-white to-zinc-50 py-24  dark:from-zinc-900 dark:to-zinc-800 dark:text-white">
      <div className="container text-center">
        <h1 className="text-5xl font-bold lg:text-6xl">Your revolutionary SaaS</h1>

        <p className="mt-3 text-lg opacity-70">
          This is a demo application built with supastarter. <br />
          It will save you a lot of time and effort building your next SaaS.
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <Button>Get started &rarr;</Button>
          <Button intent="primary-ghost">Documentation</Button>
        </div>

        {/* Get more nice illustrations like this demo image on undraw.co */}
        <Image src={heroImage} alt="Hero image" className="mx-auto mt-12 w-full max-w-lg" />
      </div>
    </nav>
  );
}
