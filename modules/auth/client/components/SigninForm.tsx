import { Button, Hint, Input } from '@common/client';
import { signIn } from 'next-auth/react';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FormEvent, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiAlertTriangle, FiMail } from 'react-icons/fi';
import SigninModeSwitch, { SigninMode } from './SigninModeSwitch';
import { SocialSigninButton } from './SocialSigninButton';

export function SigninForm() {
  const { t } = useTranslation('auth');
  const router = useRouter();
  const [signinMode, setSigninMode] = useState(SigninMode.MagicLink);

  const isPasswordSignin = signinMode === SigninMode.Password;

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { isSubmitting, errors, isSubmitted, isSubmitSuccessful },
  } = useForm<{
    email: string;
    password?: string;
    serverError?: void;
  }>({});

  const onSubmit = (e: FormEvent) => {
    clearErrors('serverError');
    return handleSubmit(async ({ email, password }) => {
      try {
        const response = await signIn(isPasswordSignin ? 'credentials' : 'email', {
          email,
          password,
          callbackUrl: '/',
          redirect: false,
        });

        if (response?.error) {
          setError('serverError', { type: response.error ?? 'invalid' });
          return;
        }

        if (isPasswordSignin) {
          await router.push('/');
        }
      } catch (e) {
        setError('serverError', { type: 'linkNotSent' });
      }
    })(e);
  };

  return (
    <>
      <h1 className="mt-6 text-3xl font-extrabold">{t('signin.title')}</h1>
      <p className="mt-4 mb-6 text-zinc-500">
        {t('signin.message')}
        <br />
        {t('signin.dontHaveAnAccount')} <Link href="/auth/signup">{t('signin.createAnAccount')} &rarr;</Link>
      </p>
      {isSubmitted && isSubmitSuccessful ? (
        <Hint
          status="success"
          title={t('form.success.linkSent.title')}
          message={t('form.success.linkSent.message')}
          icon={<FiMail />}
        />
      ) : (
        <form className="flex flex-col items-stretch gap-6" onSubmit={onSubmit}>
          <SigninModeSwitch activeMode={signinMode} onChange={setSigninMode} />

          {isSubmitted && errors.serverError && (
            <Hint
              status="error"
              title={
                isPasswordSignin
                  ? errors.serverError.type === 'emailNotVerified'
                    ? t('form.errors.emailNotVerified.title')
                    : t('form.errors.invalidCredentials.title')
                  : t('form.errors.linkNotSent.title')
              }
              message={
                isPasswordSignin
                  ? errors.serverError.type === 'emailNotVerified'
                    ? t('form.errors.emailNotVerified.message')
                    : t('form.errors.invalidCredentials.message')
                  : t('form.errors.linkNotSent.message')
              }
              icon={<FiAlertTriangle />}
            />
          )}

          <div>
            <label htmlFor="email" className="mb-1 block font-semibold">
              {t('form.fields.email')}
            </label>
            <Input type="email" {...register('email', { required: true })} required autoComplete="email" />
          </div>

          {signinMode === 'password' && (
            <div>
              <label htmlFor="password" className="mb-1 block font-semibold">
                {t('form.fields.password')}
              </label>
              <Input
                type="password"
                {...register('password', { required: true })}
                required
                autoComplete="current-password"
              />
              <div className="mt-1 text-right text-sm">
                <Link href="/auth/forgot-password">{t('form.forgotPassword')}</Link>
              </div>
            </div>
          )}

          <Button type="submit" isLoading={isSubmitting}>
            {t('form.signinButton')}
          </Button>
        </form>
      )}

      <hr className="my-8 border-black border-opacity-5 dark:border-white dark:border-opacity-5" />

      <div className="flex w-full flex-col gap-2 sm:flex-row">
        <SocialSigninButton provider="google" onClick={() => signIn('google')} />
        <SocialSigninButton provider="twitter" onClick={() => signIn('twitter')} />
      </div>
    </>
  );
}
