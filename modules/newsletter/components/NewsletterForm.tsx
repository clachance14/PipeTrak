'use client';

import Button from '@common/components/primitives/Button';
import Hint from '@common/components/primitives/Hint';
import Input from '@common/components/primitives/Input';
import { saveEmail } from '@newsletter/server/actions';
import { useForm } from 'react-hook-form';
import { FiCheckCircle } from 'react-icons/fi';

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
      icon={<FiCheckCircle />}
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
