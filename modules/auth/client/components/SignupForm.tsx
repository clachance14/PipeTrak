import { Button, Hint, Input } from '@common/client';
import { trpc } from '@common/server';
import { signIn } from 'next-auth/react';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { FiAlertTriangle, FiMail } from 'react-icons/fi';

export function SignupForm() {
  const { t } = useTranslation('auth');
  const signUpMutation = trpc.signUp.useMutation();
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { isSubmitting, isSubmitted, isSubmitSuccessful, errors },
  } = useForm<{
    email: string;
    password: string;
    name: string;
    serverError?: void;
  }>();

  const onSubmit = (e: FormEvent) => {
    clearErrors('serverError');
    handleSubmit(async ({ email, password, name }) => {
      try {
        await signUpMutation.mutateAsync({ email, password, name });
        await signIn('create-account', { email, callbackUrl: '/', redirect: false });
      } catch (e) {
        setError('serverError', { type: 'invalid' });
      }
    })(e);
  };

  return (
    <>
      <h1 className="mt-6 text-3xl font-bold">{t('signup.title')}</h1>

      <p className="mt-2 mb-6 text-zinc-500">
        {t('signup.message')} {t('signup.alreadyHaveAccount')}{' '}
        <Link href="/auth/signin">{t('signup.signIn')} &rarr;</Link>
      </p>
      {isSubmitted && isSubmitSuccessful ? (
        <Hint
          status="success"
          title={t('form.success.verifyEmail.title')}
          message={t('form.success.verifyEmail.message')}
          icon={<FiMail />}
        />
      ) : (
        <form className="flex flex-col items-stretch gap-6" onSubmit={onSubmit}>
          {isSubmitted && errors.serverError && (
            <Hint
              status="error"
              title={t('form.errors.signupFailed.title')}
              message={t('form.errors.signupFailed.message')}
              icon={<FiAlertTriangle />}
            />
          )}

          <div>
            <label htmlFor="email" className="mb-1 block font-semibold">
              {t('form.fields.name')} *
            </label>
            <Input type="text" {...register('name', { required: true })} required autoComplete="name" />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block font-semibold">
              {t('form.fields.email')} *
            </label>
            <Input type="email" {...register('email', { required: true })} required autoComplete="email" />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block font-semibold">
              {t('form.fields.password')} *
            </label>
            <Input type="password" {...register('password', { required: true })} required autoComplete="new-password" />
          </div>

          <Button isLoading={isSubmitting}>{t('form.signupButton')} &rarr;</Button>
        </form>
      )}
    </>
  );
}
