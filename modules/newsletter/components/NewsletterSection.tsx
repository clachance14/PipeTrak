import NewsletterForm from '@newsletter/components/NewsletterForm';
import { Icon } from '@ui/components';
import { useTranslations } from 'next-intl';

export default function NewsletterSection() {
  const t = useTranslations('newsletter');
  return (
    <section className="border-t py-24 dark:text-white">
      <div className="container">
        {/* Section header */}
        <div className="mb-12 text-center">
          <Icon.key className="mx-auto mb-3 h-12 w-12 text-blue-500" />
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
