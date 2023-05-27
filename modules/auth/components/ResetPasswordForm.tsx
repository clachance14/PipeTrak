'use client';

import { Button, Hint, Icon, Input } from '@ui/components';
import { useRouter } from 'next-intl/client';
import { FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { trpc } from '../../../trpc/client';

export function ResetPasswordForm({
  labels,
}: {
  labels: {
    newPassword: string;
    submit: string;
    hints: {
      passwordNotUpdated: {
        title: string;
        message: string;
      };
    };
  };
}) {
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
      <form className="mt-6 flex flex-col items-stretch gap-6" onSubmit={onSubmit}>
        <div>
          <label htmlFor="password" className="mb-1 block font-semibold">
            {labels.newPassword}
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
            title={labels.hints.passwordNotUpdated.title}
            message={labels.hints.passwordNotUpdated.message}
            icon={<Icon.error className="h-4 w-4" />}
          />
        )}

        <Button isLoading={isSubmitting}>{labels.submit}</Button>
      </form>
    </>
  );
}
