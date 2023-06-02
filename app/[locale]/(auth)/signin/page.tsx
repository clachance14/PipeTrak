import { SigninForm } from '@auth/components/SigninForm';
import { getAuthOptions } from '@auth/providers/nextauth';
import { useTranslations } from 'next-intl';
import Link from 'next-intl/link';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('auth.signin');

  return {
    title: t('title'),
  };
}

export default function SigninPage({ searchParams }: { searchParams: { redirectTo?: string } }) {
  const t = useTranslations('auth.signin');
  const oAuthProviders = getAuthOptions()
    .providers.filter((provider) => provider.type === 'oauth')
    .map((provider) => provider.id);

  const { redirectTo } = searchParams;

  return (
    <>
      <h1 className="text-3xl font-extrabold">{t('title')}</h1>
      <p className="mb-6 mt-4 text-zinc-500">
        {t('subtitle')}
        <br />
        {t('dontHaveAnAccount')} <Link href="/signup">{t('createAnAccount')} &rarr;</Link>
      </p>
      <SigninForm
        providers={oAuthProviders}
        redirectTo={redirectTo}
        labels={{
          email: t('email'),
          password: t('password'),
          submit: t('submit'),
          forgotPassword: t('forgotPassword'),
          hints: {
            linkSent: {
              title: t('hints.linkSent.title'),
              message: t('hints.linkSent.message'),
            },
            linkNotSent: {
              title: t('hints.linkNotSent.title'),
              message: t('hints.linkNotSent.message'),
            },
            invalidCredentials: {
              title: t('hints.invalidCredentials.title'),
              message: t('hints.invalidCredentials.message'),
            },
            emailNotVerified: {
              title: t('hints.emailNotVerified.title'),
              message: t('hints.emailNotVerified.message'),
            },
          },
        }}
      />
    </>
  );
}
