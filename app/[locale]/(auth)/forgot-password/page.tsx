import { ForgotPasswordForm } from '@auth/components/ForgotPasswordForm';
import Link from 'next-intl/link';
import { getTranslations } from 'next-intl/server';

export default async function ForgotPasswordPage() {
  const t = await getTranslations('auth.forgotPassword');

  return (
    <>
      <h1 className="text-3xl font-extrabold">{t('title')}</h1>
      <p className="mt-4 mb-6 text-zinc-500">
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
