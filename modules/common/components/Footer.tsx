import { useTranslations } from 'next-intl';
import Logo from './Logo';

export default function Footer() {
  const t = useTranslations('common');

  return (
    <footer className="bg-white py-12 text-gray-600 dark:bg-zinc-900 dark:text-zinc-300">
      <div className="container grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-3 text-sm opacity-70">© {new Date().getFullYear()} supastarter. All rights reserved.</p>
        </div>

        <div className="flex flex-col gap-2">
          <a href="#" className="block">
            {t('footer.blog')}
          </a>

          <a href="#" className="block">
            {t('footer.features')}
          </a>

          <a href="#" className="block">
            {t('footer.pricing')}
          </a>
        </div>

        <div className="flex flex-col gap-2">
          <a href="#" className="block">
            {t('footer.privacyPolicy')}
          </a>

          <a href="#" className="block">
            {t('footer.termsOfService')}
          </a>

          <a href="#" className="block">
            {t('footer.contactUs')}
          </a>
        </div>
      </div>
    </footer>
  );
}
