'use client';

import Input from '@common/components/primitives/Input';
import { User } from 'next-auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { trpc } from '../../../trpc/client';
import SettingsBlock from './SettingsBlock';

export default function ChangeNameForm({ user }: { user: User }) {
  const [name, setName] = useState(user.name ?? '');
  const router = useRouter();

  const changeNameMutation = trpc.changeName.useMutation({
    onSuccess: async () => {
      await fetch('/api/auth/session?update');
      router.refresh();
    },
  });

  return (
    <SettingsBlock
      title="Change name"
      onSubmit={() => changeNameMutation.mutate({ name })}
      isSubmitting={changeNameMutation.isLoading}
      isSubmitDisabled={!name || name.length < 3 || name === user.name}
    >
      <Input type="text" className="max-w-sm" value={name} onChange={(e) => setName(e.target.value)} />
    </SettingsBlock>
  );
}
