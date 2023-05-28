import { useTranslations } from 'next-intl';

export default function BlogPageHeader() {
  const t = useTranslations('blog');

  return (
    <div className="mb-12 pt-8 text-center">
      <h1 className="mb-2 text-5xl font-bold">{t('title')}</h1>
      <p className="text-lg opacity-50">{t('description')}</p>
    </div>
  );
}
