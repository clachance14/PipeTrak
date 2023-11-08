"use client";

import { useUser } from "@saas/auth/hooks";
import { updateTeamSlugCookie } from "@saas/auth/lib/team-slug";
import { ActionBlock } from "@saas/shared/components";
import { apiClient } from "@shared/lib";
import { Input } from "@ui/components";
import { useToast } from "@ui/hooks";
import { useTranslations } from "next-intl";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export function ChangeTeamNameForm({
  initialValue,
  teamId,
}: {
  initialValue: string;
  teamId: string;
}) {
  const t = useTranslations();
  const { toast } = useToast();
  const router = useRouter();
  const { teamRole } = useUser();
  const [name, setName] = useState(initialValue);
  const pathname = usePathname();
  const { teamSlug } = useParams();

  const updateTeamMutation = apiClient.team.update.useMutation({
    onSuccess: ({ slug }) => {
      toast({
        variant: "success",
        title: t("settings.notifications.teamNameUpdated"),
      });

      updateTeamSlugCookie(slug);
      location.href = location.href.replace(teamSlug as string, slug);
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
        disabled={teamRole !== "OWNER"}
        onChange={(e) => setName(e.target.value)}
      />
    </ActionBlock>
  );
}
