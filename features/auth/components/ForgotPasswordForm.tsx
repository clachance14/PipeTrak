'use client';

import { Button, Hint, Icon, Input } from '@ui/components';

import { signIn } from 'next-auth/react';
import { FormEvent } from 'react';
import { useForm } from 'react-hook-form';

export function ForgotPasswordForm({
  labels,
}: {
  labels: {
    email: string;
    submit: string;
    hints: {
      linkSent: {
        title: string;
        message: string;
      };
      linkNotSent: {
        title: string;
        message: string;
      };
    };
  };
}) {
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
          callbackUrl: '/reset-password',
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
      {isSubmitted && isSubmitSuccessful ? (
        <Hint
          status="success"
          title={labels.hints.linkSent.title}
          message={labels.hints.linkSent.message}
          icon={<Icon.mail className="h-4 w-4" />}
        />
      ) : (
        <form className="flex flex-col items-stretch gap-6" onSubmit={onSubmit}>
          <div>
            <label htmlFor="email" className="mb-1 block font-semibold">
              {labels.email}
            </label>
            <Input type="email" {...register('email', { required: true })} required autoComplete="email" />
          </div>

          {isSubmitted && errors.serverError && (
            <Hint
              status="error"
              title={labels.hints.linkNotSent.title}
              message={labels.hints.linkNotSent.message}
              icon={<Icon.warning className="h-4 w-4" />}
            />
          )}

          <Button isLoading={isSubmitting}>
            <Icon.submit className="h-4 w-4" /> {labels.submit}
          </Button>
        </form>
      )}
    </>
  );
}
