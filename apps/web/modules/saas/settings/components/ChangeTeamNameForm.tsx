"use client";

import { useUser } from "@saas/auth/hooks/use-user";
import { updateTeamSlugCookie } from "@saas/auth/lib/team-slug";
import { ActionBlock } from "@saas/shared/components/ActionBlock";
import { apiClient } from "@shared/lib/api-client";
import { Input } from "@ui/components/Input";
import { useToast } from "@ui/hooks/use-toast";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ChangeTeamNameForm({
  initialValue,
  teamId,
}: {
  initialValue: string;
  teamId: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const { toast } = useToast();
  const { teamMembership } = useUser();
  const [name, setName] = useState(initialValue);

  const updateTeamMutation = apiClient.team.update.useMutation({
    onSuccess: ({ slug }) => {
      toast({
        variant: "success",
        title: t("settings.notifications.teamNameUpdated"),
      });

      updateTeamSlugCookie(slug);
      router.refresh();
    },
    onError: () => {
      toast({
        variant: "error",
        title: t("settings.notifications.teamNameNotUpdated"),
      });
    },
  });

  return (
    <ActionBlock
      title={t("settings.team.changeName.title")}
      onSubmit={() => updateTeamMutation.mutate({ name, id: teamId })}
      isSubmitting={updateTeamMutation.isLoading}
      isSubmitDisabled={!name || name === initialValue}
    >
      <Input
        className="max-w-sm"
        value={name}
        disabled={teamMembership?.role !== "OWNER"}
        onChange={(e) => setName(e.target.value)}
      />
    </ActionBlock>
  );
}
