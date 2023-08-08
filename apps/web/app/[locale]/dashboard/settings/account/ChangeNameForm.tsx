"use client";

import { Input, useToast } from "@components";
import ActionBlock from "@src/components/ActionBlock";
import { useMutation } from "@tanstack/react-query";
import { updateName } from "auth-client-web";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ChangeNameForm({
  initialValue,
}: {
  initialValue: string;
}) {
  const [name, setName] = useState(initialValue ?? "");
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations("settings");
  const changeNameMutation = useMutation(
    ["changeName"],
    async (name: string) => {
      await updateName(name);
    },
    {
      onSuccess: () => {
        toast.create({
          type: "success",
          title: t("notifications.nameUpdated"),
          placement: "top-end",
        });
        router.refresh();
      },
    },
  );

  return (
    <ActionBlock
      title={t("account.changeName.title")}
      onSubmit={() => changeNameMutation.mutate(name)}
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
