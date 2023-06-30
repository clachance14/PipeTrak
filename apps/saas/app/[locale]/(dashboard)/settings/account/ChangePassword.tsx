"use client";

import ActionBlock from "@components/ActionBlock";
import { trpc } from "api/client";
import { useState } from "react";
import { PasswordInput } from "ui";

export default function ChangePasswordForm() {
  const [password, setPassword] = useState("");

  const changePasswordMutation = trpc.changePassword.useMutation({
    onSuccess: async () => {
      setPassword("");
    },
  });

  return (
    <ActionBlock
      title="Change password"
      onSubmit={() => changePasswordMutation.mutate({ password })}
      isSubmitting={changePasswordMutation.isLoading}
      isSubmitDisabled={!password || password.length < 8}
    >
      <PasswordInput
        className="max-w-sm"
        value={password}
        onChange={(value) => setPassword(value)}
      />
    </ActionBlock>
  );
}
