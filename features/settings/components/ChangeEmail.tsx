'use client';

import { Input } from '@ui/components';
import { User } from 'next-auth';
import { signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { trpc } from '../../database/trpc/client';
import SettingsBlock from './SettingsBlock';

export default function ChangeEmailForm({ user }: { user: User }) {
  const [email, setEmail] = useState(user.email!);
  const router = useRouter();

  const changeEmailMutation = trpc.changeEmail.useMutation({
    onSuccess: async () => {
      await signIn('change-email', { email, redirect: false, callbackUrl: window.location.href });
      await signOut();
    },
  });

  return (
    <SettingsBlock
      title="Change email"
      onSubmit={() => changeEmailMutation.mutate({ email })}
      isSubmitting={changeEmailMutation.isLoading}
      isSubmitDisabled={email === user.email || !email}
    >
      <Input type="email" className="max-w-sm" value={email} onChange={(e) => setEmail(e.target.value)} />
    </SettingsBlock>
  );
}
