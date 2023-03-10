'use client';

import { SocialSigninButton } from '@auth/components/SocialSigninButton';
import Button from '@common/components/primitives/Button';
import Hint from '@common/components/primitives/Hint';
import Input from '@common/components/primitives/Input';
import { SessionProvider, signIn } from 'next-auth/react';
import { useLocalizedRouter } from 'next-intl';
import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiAlertTriangle, FiMail } from 'react-icons/fi';
import SigninModeSwitch, { SigninMode } from './SigninModeSwitch';

export function SigninForm({
  labels,
}: {
  labels: {
    email: string;
    password: string;
    submit: string;
    hints: {
      linkSent: {
        title: string;
        message: string;
      };
    };
  };
}) {
  const t = (key: string) => key;
  const router = useLocalizedRouter();
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

  useEffect(() => {
    clearErrors('serverError');
  }, [signinMode]); // eslint-disable-line react-hooks/exhaustive-deps

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
          router.push('/dashboard');
        }
      } catch (e) {
        setError('serverError', { type: 'linkNotSent' });
      }
    })(e);
  };

  return (
    <SessionProvider>
      {isSubmitted && isSubmitSuccessful && !isPasswordSignin ? (
        <Hint
          status="success"
          title={labels.hints.linkSent.title}
          message={labels.hints.linkSent.message}
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
              {labels.email}
            </label>
            <Input type="email" {...register('email', { required: true })} required autoComplete="email" />
          </div>

          {signinMode === 'password' && (
            <div>
              <label htmlFor="password" className="mb-1 block font-semibold">
                {labels.password}
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
            {labels.submit}
          </Button>
        </form>
      )}

      <hr className="my-8 border-black border-opacity-5 dark:border-white dark:border-opacity-5" />

      <div className="flex w-full flex-col gap-2 sm:flex-row">
        <SocialSigninButton provider="google" onClick={() => signIn('google')} />
        <SocialSigninButton provider="twitter" onClick={() => signIn('twitter')} />
      </div>
    </SessionProvider>
  );
}
