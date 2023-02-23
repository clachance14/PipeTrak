import Image from 'next/image';
import { FiCloud, FiMousePointer, FiPaperclip, FiPhone, FiStar, FiUpload } from 'react-icons/fi';

import feature1Image from '../../../public/feature-1.svg';
import feature2Image from '../../../public/feature-2.svg';
import feature3Image from '../../../public/feature-3.svg';
import { Button } from '../../common/client';

export function FeaturesSection() {
  return (
    <section className="bg-white py-24 dark:bg-zinc-900 dark:text-white">
      <div className="container">
        {/* Section header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold lg:text-5xl">Features your clients will love</h1>
          <p className="mt-3 text-lg opacity-70">In this section you can showcase the features of your SaaS.</p>
        </div>

        {/* Feature 1 */}
        <div className="mt-20 grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
          <div className="p-6">
            <Image src={feature1Image} alt="Feature 1" />
          </div>

          <div>
            <h3 className="text-2xl font-bold">Feature A</h3>
            <p className="mt-1 opacity-70">
              This is a brilliant feature. And below you can see some reasons why. This is basically just a dummy text.
            </p>
            <Button intent="primary-ghost" className="mt-3" size="small">
              Learn more &rarr;
            </Button>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl border p-4 dark:border-zinc-700">
                <FiStar className="text-3xl text-[#6C63FF]" />
                <strong className="mt-2 block">Benefit 1</strong>
                <p className="opacity-70">This is a brilliant benefit.</p>
              </div>
              <div className="rounded-xl border p-4 dark:border-zinc-700">
                <FiMousePointer className="text-3xl text-[#6C63FF]" />
                <strong className="mt-2 block">Benefit 2</strong>
                <p className="opacity-70">This is a brilliant benefit.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="mt-24 grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
          <div className="p-6 lg:order-2">
            <Image src={feature2Image} alt="Feature 2" />
          </div>

          <div className="lg:order-1">
            <h3 className="text-2xl font-bold">Feature B</h3>
            <p className="mt-1 opacity-70">
              This is a brilliant feature. And below you can see some reasons why. This is basically just a dummy text.
            </p>
            <Button intent="primary-ghost" className="mt-3" size="small">
              Learn more &rarr;
            </Button>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl border p-4 dark:border-zinc-700">
                <FiUpload className="text-3xl text-[#6C63FF]" />
                <strong className="mt-2 block">Benefit 1</strong>
                <p className="opacity-70">This is a brilliant benefit.</p>
              </div>
              <div className="rounded-xl border p-4 dark:border-zinc-700">
                <FiCloud className="text-3xl text-[#6C63FF]" />
                <strong className="mt-2 block">Benefit 2</strong>
                <p className="opacity-70">This is a brilliant benefit.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="mt-24 grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
          <div className="p-6">
            <Image src={feature3Image} alt="Feature 2" />
          </div>

          <div>
            <h3 className="text-2xl font-bold">Feature C</h3>
            <p className="mt-1 opacity-70">
              This is a brilliant feature. And below you can see some reasons why. This is basically just a dummy text.
            </p>
            <Button intent="primary-ghost" className="mt-3" size="small">
              Learn more &rarr;
            </Button>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl border p-4 dark:border-zinc-700">
                <FiPhone className="text-3xl text-[#6C63FF]" />
                <strong className="mt-2 block">Benefit 1</strong>
                <p className="opacity-70">This is a brilliant benefit.</p>
              </div>
              <div className="rounded-xl border p-4 dark:border-zinc-700">
                <FiPaperclip className="text-3xl text-[#6C63FF]" />
                <strong className="mt-2 block">Benefit 2</strong>
                <p className="opacity-70">This is a brilliant benefit.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
