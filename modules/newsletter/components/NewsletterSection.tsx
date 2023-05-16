import NewsletterForm from '@newsletter/components/NewsletterForm';
import { getTranslations } from 'next-intl/server';
import { FiKey } from 'react-icons/fi';

export default async function NewsletterSection() {
  const t = await getTranslations('newsletter');
  return (
    <section className="bg-blue-500 bg-opacity-5 py-24 dark:text-white">
      <div className="container">
        {/* Section header */}
        <div className="mb-12 text-center">
          <FiKey className="mx-auto mb-3 w-auto text-5xl text-blue-500" />
          <h1 className="text-4xl font-bold lg:text-5xl">{t('title')}</h1>
          <p className="mt-3 text-lg opacity-70">{t('subtitle')}</p>
        </div>

        <div className="mx-auto max-w-lg">
          <NewsletterForm
            labels={{
              email: t('email'),
              submit: t('submit'),
              hints: {
                success: {
                  title: t('hints.success.title'),
                  message: t('hints.success.message'),
                },
              },
            }}
          />
        </div>
      </div>
    </section>
  );
}
