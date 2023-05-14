import { SigninForm } from '@auth/components/SigninForm';
import { Link } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { getAuthOptions } from '../../../../nextauth.config';

export default async function SigninPage({ searchParams }: { searchParams: { redirectTo?: string } }) {
  const t = await getTranslations('auth.signin');
  const oAuthProviders = getAuthOptions()
    .providers.filter((provider) => provider.type === 'oauth')
    .map((provider) => provider.id);

  const { redirectTo } = searchParams;

  return (
    <>
      <h1 className="text-3xl font-extrabold">{t('title')}</h1>
      <p className="mt-4 mb-6 text-zinc-500">
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
          },
        }}
      />
    </>
  );
}
