import SignupForm from '@auth/components/SignupForm';
import { useTranslations } from 'next-intl';
import Link from 'next-intl/link';

export default async function SignupPage() {
  const t = useTranslations('auth.signup');

  return (
    <div>
      <h1 className="text-3xl font-bold">{t('title')}</h1>

      <p className="mb-6 mt-2 text-zinc-500">
        {t('message')} {t('alreadyHaveAccount')} <Link href="/signin">{t('signIn')} &rarr;</Link>
      </p>

      <SignupForm
        labels={{
          name: t('name'),
          email: t('email'),
          password: t('password'),
          submit: t('submit'),
          hints: {
            signupFailed: {
              title: t('hints.signupFailed.title'),
              message: t('hints.signupFailed.message'),
            },
            verifyEmail: {
              title: t('hints.verifyEmail.title'),
              message: t('hints.verifyEmail.message'),
            },
          },
        }}
      />
    </div>
  );
}
