"use client";

import { CreateTeamForm, Icon } from "@components";
import { useUser } from "@lib/auth";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export function SetupForm() {
  const t = useTranslations("auth.setup");
  const router = useRouter();

  const { user, loaded, teams } = useUser();

  if (!user || !loaded || teams?.length) {
    return (
      <div className="py-8">
        <Icon.spinner className="text-primary mx-auto h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold">{t("title")}</h1>
      <p className="text-muted-foreground mb-6 mt-4">{t("subtitle")}</p>
      <CreateTeamForm
        isInitialTeam
        defaultName={`${user.name}'s Team`}
        defaultSlug={`${user.name.toLowerCase()}`}
        onSuccess={(team) => {
          router.replace(`/${team.slug}/dashboard`);
        }}
      />
    </div>
  );
}
