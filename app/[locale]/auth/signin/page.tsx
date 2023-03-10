import { SigninForm } from '@auth/components/SigninForm';
import { Link, useTranslations } from 'next-intl';

export default function SigninPage() {
  const t = useTranslations('auth.signin');

  return (
    <>
      <h1 className="mt-6 text-3xl font-extrabold">{t('title')}</h1>
      <p className="mt-4 mb-6 text-zinc-500">
        {t('subtitle')}
        <br />
        {t('dontHaveAnAccount')} <Link href="/auth/signup">{t('createAnAccount')} &rarr;</Link>
      </p>
      <SigninForm
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
