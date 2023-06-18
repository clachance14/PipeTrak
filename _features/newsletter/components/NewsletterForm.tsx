'use client';

import { saveEmail } from '@newsletter/server/actions';
import { Button, Hint, Icon, Input } from '@ui/components';
import { useForm } from 'react-hook-form';

export default function NewsletterForm({
  labels,
}: {
  labels: {
    email: string;
    submit: string;
    hints: {
      success: {
        title: string;
        message: string;
      };
    };
  };
}) {
  const {
    handleSubmit,
    register,
    formState: { isSubmitting, isSubmitSuccessful },
  } = useForm<{ email: string }>();

  return isSubmitSuccessful ? (
    <Hint
      status="success"
      title={labels.hints.success.title}
      message={labels.hints.success.message}
      icon={<Icon.success className="h-4 w-4" />}
    />
  ) : (
    <form
      onSubmit={handleSubmit(async ({ email }) => {
        await saveEmail(email);
      })}
    >
      <div className="flex items-start">
        <Input type="email" required placeholder={labels.email} {...register('email')} />
        <Button type="submit" className="ml-4" isLoading={isSubmitting}>
          {labels.submit}
        </Button>
      </div>
    </form>
  );
}
