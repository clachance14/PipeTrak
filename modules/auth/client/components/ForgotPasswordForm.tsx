import { Button, Hint, Input } from '@common/client';
import { signIn } from 'next-auth/react';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { FiAlertTriangle, FiMail, FiSend } from 'react-icons/fi';

export function ForgotPasswordForm() {
  const { t } = useTranslation('auth');

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { isSubmitting, isSubmitSuccessful, isSubmitted, errors },
  } = useForm<{
    email: string;
    serverError: void;
  }>();

  const onSubmit = (e: FormEvent) => {
    clearErrors('serverError');
    handleSubmit(async ({ email }) => {
      try {
        const response = await signIn('forgot-password', {
          email,
          callbackUrl: '/auth/reset-password',
          redirect: false,
        });

        if (response?.error) setError('serverError', { type: 'linkNotSent' });
      } catch (e) {
        setError('serverError', { type: 'linkNotSent' });
      }
    })(e);
  };

  return (
    <>
      <h1 className="mt-6 text-3xl font-extrabold">{t('forgotPassword.title')}</h1>

      <p className="mt-4 mb-6 text-zinc-500">
        {t('forgotPassword.message')} <Link href="/auth/signin">{t('forgotPassword.backToSignin')} &rarr;</Link>
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
          <div>
            <label htmlFor="email" className="mb-1 block font-semibold">
              {t('form.fields.email')}
            </label>
            <Input type="email" {...register('email', { required: true })} required autoComplete="email" />
          </div>

          {isSubmitted && errors.serverError && (
            <Hint
              status="error"
              title={t('form.errors.linkNotSent.title')}
              message={t('form.errors.linkNotSent.message')}
              icon={<FiAlertTriangle />}
            />
          )}

          <Button isLoading={isSubmitting}>
            <FiSend /> {t('form.forgotPasswordButton')}
          </Button>
        </form>
      )}
    </>
  );
}
