import SignupForm from '@auth/components/SignupForm';
import { Link } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export default async function SignupPage() {
  const t = await getTranslations('auth.signup');

  return (
    <div>
      <h1 className="text-3xl font-bold">{t('title')}</h1>

      <p className="mt-2 mb-6 text-zinc-500">
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
