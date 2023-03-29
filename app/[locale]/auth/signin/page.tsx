import { SigninForm } from '@auth/components/SigninForm';
import { getUser } from '@auth/server';
import { getProviders } from 'next-auth/react';
import { Link } from 'next-intl';
import { getTranslations, redirect } from 'next-intl/server';

export default async function SigninPage({ searchParams }: { searchParams: { redirectTo?: string } }) {
  const t = await getTranslations('auth.signin');
  const user = await getUser();
  const providers = await getProviders();

  const { redirectTo } = searchParams;

  if (user) {
    redirect(redirectTo ?? '/dashboard');
  }

  return (
    <>
      <h1 className="mt-6 text-3xl font-extrabold">{t('title')}</h1>
      <p className="mt-4 mb-6 text-zinc-500">
        {t('subtitle')}
        <br />
        {t('dontHaveAnAccount')} <Link href="/auth/signup">{t('createAnAccount')} &rarr;</Link>
      </p>
      <SigninForm
        providers={providers}
        redirectTo={redirectTo}
        labels={{
          email: t('email'),
          password: t('password'),
          submit: t('submit'),
          hints: {
            linkSent: {
              title: t('hints.linkSent.title'),
              message: t('hints.linkSent.message'),
            },
          },
        }}
      />
    </>
  );
}
