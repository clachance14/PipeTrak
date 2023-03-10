import SignupForm from '@auth/components/SignupForm';
import { TrpcProvider } from '@common/client/ClientProvider';
import { Link, useTranslations } from 'next-intl';

export default function SignupPage() {
  const t = useTranslations('auth.signup');

  return (
    <div>
      <h1 className="mt-6 text-3xl font-bold">{t('title')}</h1>

      <p className="mt-2 mb-6 text-zinc-500">
        {t('message')} {t('alreadyHaveAccount')} <Link href="/auth/signin">{t('signIn')} &rarr;</Link>
      </p>

      <TrpcProvider>
        <SignupForm
          labels={{
            name: t('name'),
            email: t('email'),
            password: t('password'),
            submit: t('submit'),
          }}
        />
      </TrpcProvider>
    </div>
  );
}
