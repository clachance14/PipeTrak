import Image from 'next/image';

import { Button, Icon } from '@ui/components';
import heroDarkImage from '/public/images/hero-dark.svg';
import heroImage from '/public/images/hero.svg';

export default function FeaturesSection() {
  return (
    <section className="bg-white py-24 dark:bg-zinc-900 dark:text-white">
      <div className="container">
        {/* Section header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold lg:text-5xl">Features your clients will love</h1>
          <p className="mt-3 text-lg opacity-50">In this section you can showcase the features of your SaaS.</p>
        </div>

        {/* Feature 1 */}
        <div className="mt-20 grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
          <div>
            <Image src={heroImage} className="block dark:hidden" alt="Feature 1" />
            <Image src={heroDarkImage} className="hidden dark:block" alt="Feature 1" />
          </div>

          <div>
            <h3 className="text-2xl font-bold">Feature A</h3>
            <p className="mt-1 opacity-50">
              This is a brilliant feature. And below you can see some reasons why. This is basically just a dummy text.
            </p>
            <Button intent="primary-ghost" className="mt-3" size="small">
              Learn more &rarr;
            </Button>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl border p-4 dark:border-zinc-700">
                <Icon.star className="h-6 w-6 text-3xl text-blue-500" />
                <strong className="mt-2 block">Benefit 1</strong>
                <p className="opacity-50">This is a brilliant benefit.</p>
              </div>
              <div className="w4-rounded-xl border p-4 dark:border-zinc-700">
                <Icon.pointer className="h-6 w-6 text-3xl text-blue-500" />
                <strong className="mt-2 block">Benefit 2</strong>
                <p className="opacity-50">This is a brilliant benefit.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="mt-24 grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
          <div className="lg:order-2">
            <Image src={heroImage} className="block dark:hidden" alt="Feature 2" />
            <Image src={heroDarkImage} className="hidden dark:block" alt="Feature 2" />
          </div>

          <div className="lg:order-1">
            <h3 className="text-2xl font-bold">Feature B</h3>
            <p className="mt-1 opacity-50">
              This is a brilliant feature. And below you can see some reasons why. This is basically just a dummy text.
            </p>
            <Button intent="primary-ghost" className="mt-3" size="small">
              Learn more &rarr;
            </Button>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl border p-4 dark:border-zinc-700">
                <Icon.upload className="h-6 w-6 text-3xl text-blue-500" />
                <strong className="mt-2 block">Benefit 1</strong>
                <p className="opacity-50">This is a brilliant benefit.</p>
              </div>
              <div className="rounded-xl border p-4 dark:border-zinc-700">
                <Icon.cloud className="h-6 w-6 text-3xl text-blue-500" />
                <strong className="mt-2 block">Benefit 2</strong>
                <p className="opacity-50">This is a brilliant benefit.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="mt-24 grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
          <div>
            <Image src={heroImage} className="block dark:hidden" alt="Feature 3" />
            <Image src={heroDarkImage} className="hidden dark:block" alt="Feature 3" />
          </div>

          <div>
            <h3 className="text-2xl font-bold">Feature C</h3>
            <p className="mt-1 opacity-50">
              This is a brilliant feature. And below you can see some reasons why. This is basically just a dummy text.
            </p>
            <Button intent="primary-ghost" className="mt-3" size="small">
              Learn more &rarr;
            </Button>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl border p-4 dark:border-zinc-700">
                <Icon.phone className="h-6 w-6 text-3xl text-blue-500" />
                <strong className="mt-2 block">Benefit 1</strong>
                <p className="opacity-50">This is a brilliant benefit.</p>
              </div>
              <div className="rounded-xl border p-4 dark:border-zinc-700">
                <Icon.paperclip className="h-6 w-6 text-3xl text-blue-500" />
                <strong className="mt-2 block">Benefit 2</strong>
                <p className="opacity-50">This is a brilliant benefit.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
