import { trpc } from '@common/client/trpc';
import Button from '@common/components/primitives/Button';
import Hint from '@common/components/primitives/Hint';
import Input from '@common/components/primitives/Input';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { FiAlertTriangle } from 'react-icons/fi';

export function ResetPasswordForm() {
  const t = (key: string) => key;
  const router = useRouter();
  const updatePasswordMutation = trpc.changePassword.useMutation();

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { isSubmitting, isSubmitted, errors },
  } = useForm<{
    password: string;
    serverError?: void;
  }>();

  const onSubmit = (e: FormEvent) => {
    clearErrors('serverError');
    handleSubmit(async ({ password }) => {
      try {
        await updatePasswordMutation.mutateAsync({ password });

        await router.push('/');
      } catch (e) {
        setError('serverError', { type: 'passwordNotUpdated' });
      }
    })(e);
  };

  return (
    <>
      <h1 className="mt-6 text-3xl font-extrabold">{t('resetPassword.title')}</h1>

      <p className="mt-4 text-zinc-500">
        {t('resetPassword.message')} <Link href="/auth/signin">{t('resetPassword.backToSignin')} &rarr;</Link>
      </p>

      <form className="mt-6 flex flex-col items-stretch gap-6" onSubmit={onSubmit}>
        <div>
          <label htmlFor="password" className="mb-1 block font-semibold">
            {t('form.fields.password')}
          </label>
          <Input
            id="password"
            type="password"
            {...register('password', { required: true })}
            required
            autoComplete="new-password"
          />
        </div>

        {isSubmitted && errors.serverError && (
          <Hint
            status="error"
            title={t('form.errors.passwordNotUpdated.title')}
            message={t('form.errors.passwordNotUpdated.message')}
            icon={<FiAlertTriangle />}
          />
        )}

        <Button isLoading={isSubmitting}>{t('form.resetPasswordButton')}</Button>
      </form>
    </>
  );
}
