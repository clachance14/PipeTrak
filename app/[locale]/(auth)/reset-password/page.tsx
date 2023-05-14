import { ResetPasswordForm } from '@auth/components/ResetPasswordForm';
import Link from 'next-intl/link';
import { getTranslations } from 'next-intl/server';

export default async function ResetPasswordPage() {
  const t = await getTranslations('auth.resetPassword');

  return (
    <>
      <h1 className="text-3xl font-extrabold">{t('title')}</h1>
      <p className="mt-4 mb-6 text-zinc-500">
        {t('message')} <Link href="/signup">{t('backToSignin')} &rarr;</Link>
      </p>
      <ResetPasswordForm
        labels={{
          newPassword: t('newPassword'),
          submit: t('submit'),
          hints: {
            passwordNotUpdated: {
              title: t('hints.passwordNotUpdated.title'),
              message: t('hints.passwordNotUpdated.message'),
            },
          },
        }}
      />
    </>
  );
}
