"use client";

import { ActionBlock, PasswordInput, useToast } from "@components";
import { updatePassword } from "@lib/auth";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ChangePasswordForm() {
  const t = useTranslations("settings");
  const { toast } = useToast();
  const router = useRouter();
  const [password, setPassword] = useState("");

  const changePasswordMutation = useMutation(
    ["changePassword"],
    async (password: string) => {
      await updatePassword(password);
    },
    {
      onSuccess: () => {
        toast({
          title: t("notifications.passwordUpdated"),
        });
        router.refresh();
      },
    },
  );

  return (
    <ActionBlock
      title={t("account.changePassword.title")}
      onSubmit={() => changePasswordMutation.mutate(password)}
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
