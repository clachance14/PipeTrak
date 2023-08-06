"use client";

import ActionBlock from "@components/ActionBlock";
import { trpc } from "api/client/nextjs";
import { useAuthActions } from "auth-client";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input, useToast } from "ui";

export default function ChangeNameForm({
  initialValue,
}: {
  initialValue: string;
}) {
  const { updateSession } = useAuthActions();
  const [name, setName] = useState(initialValue ?? "");
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations("settings");

  const changeNameMutation = trpc.changeName.useMutation({
    onSuccess: async () => {
      await updateSession({ name });
      router.refresh();
      toast.create({
        type: "success",
        title: t("notifications.nameUpdated"),
        placement: "top-end",
      });
    },
  });

  return (
    <ActionBlock
      title={t("account.changeName.title")}
      onSubmit={() => changeNameMutation.mutate({ name })}
      isSubmitting={changeNameMutation.isLoading}
      isSubmitDisabled={!name || name.length < 3 || name === initialValue}
    >
      <Input
        type="text"
        className="max-w-sm"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
    </ActionBlock>
  );
}
