import { ChangeTeamNameForm, TeamMembersList } from "@saas/settings/components";
import { createApiCaller } from "api";
import { getTranslator } from "next-intl/server";

export async function generateMetadata({ params: { locale } }) {
  const t = await getTranslator(locale);

  return {
    title: t("settings.team.title"),
  };
}

export default async function AccountSettingsPage({
  params: { teamSlug },
}: {
  params: { teamSlug: string };
}) {
  const apiCaller = await createApiCaller();
  const team = await apiCaller.team.getBySlug({
    slug: teamSlug,
  });

  return (
    <div className="grid gap-6">
      <ChangeTeamNameForm initialValue={team.name} teamId={team.id} />
      <TeamMembersList team={team} memberships={team.memberships} />
    </div>
  );
}
