"use client";

import ActionBlock from "@components/ActionBlock";
import { trpc } from "api/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "ui";

export default function ChangeNameForm({
  initialValue,
}: {
  initialValue: string;
}) {
  const [name, setName] = useState(initialValue ?? "");
  const router = useRouter();

  const changeNameMutation = trpc.changeName.useMutation({
    onSuccess: async () => {
      await fetch("/api/auth/session?update");
      router.refresh();
    },
  });

  return (
    <ActionBlock
      title="Change name"
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
