"use client";

import { ActionBlock, Input, useToast } from "@components";
import { apiClient } from "api/client";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ChangeTeamNameForm({
  initialValue,
  teamId,
}: {
  initialValue: string;
  teamId: string;
}) {
  const t = useTranslations("settings");
  const { toast } = useToast();
  const router = useRouter();
  const [name, setName] = useState(initialValue);

  const updateTeamMutation = apiClient.team.update.useMutation({
    onSuccess: ({ slug }) => {
      toast({
        title: t("notifications.teamNameUpdated"),
      });
      router.replace(`/${slug}/settings/team`);
    },
    onError: () => {
      toast({
        title: t("notifications.teamNameNotUpdated"),
      });
    },
  });

  return (
    <ActionBlock
      title={t("team.changeName.title")}
      onSubmit={() => updateTeamMutation.mutate({ name, id: teamId })}
      isSubmitting={updateTeamMutation.isLoading}
      isSubmitDisabled={!name || name === initialValue}
    >
      <Input
        className="max-w-sm"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
    </ActionBlock>
  );
}
