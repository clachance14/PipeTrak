'use client';

import PasswordInput from '@auth/components/PasswordInput';
import { trpc } from '@backend/trpc/client';
import { useState } from 'react';
import SettingsBlock from './SettingsBlock';

export default function ChangePasswordForm() {
  const [password, setPassword] = useState('');

  const changePasswordMutation = trpc.changePassword.useMutation({
    onSuccess: async () => {
      setPassword('');
    },
  });

  return (
    <SettingsBlock
      title="Change password"
      onSubmit={() => changePasswordMutation.mutate({ password })}
      isSubmitting={changePasswordMutation.isLoading}
      isSubmitDisabled={!password || password.length < 8}
    >
      <PasswordInput className="max-w-sm" value={password} onChange={(value) => setPassword(value)} />
    </SettingsBlock>
  );
}
