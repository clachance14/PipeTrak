import SignupForm from '@auth/components/SignupForm';
import { getUser } from '@auth/server';
import { Link } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

export default async function SignupPage() {
  const t = await getTranslations('auth.signup');
  const user = await getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div>
      <h1 className="mt-6 text-3xl font-bold">{t('title')}</h1>

      <p className="mt-2 mb-6 text-zinc-500">
        {t('message')} {t('alreadyHaveAccount')} <Link href="/auth/signin">{t('signIn')} &rarr;</Link>
      </p>

      <SignupForm
        labels={{
          name: t('name'),
          email: t('email'),
          password: t('password'),
          submit: t('submit'),
        }}
      />
    </div>
  );
}
