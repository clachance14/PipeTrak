import { NewsletterForm } from '@newsletter/client/components/NewsletterForm';
import { FiKey } from 'react-icons/fi';

export function NewsletterSection() {
  return (
    <section className="bg-[#6C63FF] bg-opacity-5 py-24 dark:text-white">
      <div className="container">
        {/* Section header */}
        <div className="mb-12 text-center">
          <FiKey className="mx-auto mb-3 w-auto text-5xl text-[#6C63FF]" />
          <h1 className="text-4xl font-bold lg:text-5xl">Get early access</h1>
          <p className="mt-3 text-lg opacity-70">Be among the first to get access to aviato.</p>
        </div>

        <div className="max-w-lg mx-auto">
          <NewsletterForm />
        </div>
      </div>
    </section>
  );
}
