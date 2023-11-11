import { InviteMemberForm, TeamMembersBlock } from "@saas/settings/components";
import { createApiCaller } from "api";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations();

  return {
    title: t("settings.team.title"),
  };
}

export default async function TeamSettingsPage({
  params: { teamSlug },
}: {
  params: { teamSlug: string };
}) {
  const apiCaller = await createApiCaller();
  const team = await apiCaller.team.bySlug({
    slug: teamSlug,
  });
  const memberships = await apiCaller.team.memberships({
    teamId: team.id,
  });
  const invitations = await apiCaller.team.invitations({
    teamId: team.id,
  });
  const t = await getTranslations();

  return (
    <div className="grid grid-cols-1 gap-6">
      <InviteMemberForm teamId={team.id} />
      <TeamMembersBlock memberships={memberships} invitations={invitations} />
    </div>
  );
}
