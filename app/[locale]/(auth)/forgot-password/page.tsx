import { ForgotPasswordForm } from '@auth/components/ForgotPasswordForm';
import { useTranslations } from 'next-intl';
import Link from 'next-intl/link';

export default async function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPassword');

  return (
    <>
      <h1 className="text-3xl font-extrabold">{t('title')}</h1>
      <p className="mb-6 mt-4 text-zinc-500">
        {t('message')} <Link href="/signup">{t('backToSignin')} &rarr;</Link>
      </p>
      <ForgotPasswordForm
        labels={{
          email: t('email'),
          submit: t('submit'),
          hints: {
            linkSent: {
              title: t('hints.linkSent.title'),
              message: t('hints.linkSent.message'),
            },
            linkNotSent: {
              title: t('hints.linkNotSent.title'),
              message: t('hints.linkNotSent.message'),
            },
          },
        }}
      />
    </>
  );
}
