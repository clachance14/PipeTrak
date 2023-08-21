"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Team } from "api";
import { apiClient } from "api/client";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, Input, useToast } from "../base";

const formSchema = z.object({
  name: z.string().min(3).max(32),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateTeamForm({
  isInitialTeam,
  onSuccess,
  defaultName,
  defaultSlug,
}: {
  isInitialTeam: boolean;
  onSuccess: (team: Team) => void;
  defaultSlug?: string;
  defaultName?: string;
}) {
  const t = useTranslations("createTeam");
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: defaultName,
    },
  });

  const createTeamMutation = apiClient.team.create.useMutation();

  const onSubmit = handleSubmit(async (data) => {
    try {
      const newTeam = await createTeamMutation.mutateAsync({
        name: data.name,
        slug: (data.name === defaultName && defaultSlug) || undefined,
      });

      // redirect to team settings page
      toast({
        title: t("notifications.success"),
      });

      onSuccess(newTeam);
    } catch (e) {
      toast({
        title: t("notifications.error"),
        variant: "destructive",
      });
    }
  });

  return (
    <form onSubmit={onSubmit}>
      <div>
        <label className="mb-2 block text-sm font-medium">{t("name")}</label>
        <Input type="text" {...register("name", { required: true })} />
      </div>

      <Button className="mt-4 w-full" type="submit" loading={isSubmitting}>
        {t("submit")}
      </Button>
    </form>
  );
}
