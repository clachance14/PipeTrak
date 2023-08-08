"use client";

import ActionBlock from "@components/ActionBlock";
import { PasswordInput } from "@supastarter/frontend/web/ui";
import { trpc } from "api/client/nextjs";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function ChangePasswordForm() {
  const t = useTranslations("settings");
  const [password, setPassword] = useState("");

  const changePasswordMutation = trpc.changePassword.useMutation({
    onSuccess: async () => {
      setPassword("");
    },
  });

  return (
    <ActionBlock
      title={t("account.changePassword.title")}
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
