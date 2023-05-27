import { ResetPasswordForm } from '@auth/components/ResetPasswordForm';
import { useTranslations } from 'next-intl';
import Link from 'next-intl/link';

export default async function ResetPasswordPage() {
  const t = useTranslations('auth.resetPassword');

  return (
    <>
      <h1 className="text-3xl font-extrabold">{t('title')}</h1>
      <p className="mb-6 mt-4 text-zinc-500">
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
