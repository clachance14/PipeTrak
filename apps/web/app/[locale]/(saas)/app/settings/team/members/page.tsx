import { InviteMemberForm, TeamMembersBlock } from "@saas/settings/components";
import { TEAM_SLUG_COOKIE_NAME } from "@saas/shared/types";
import { createApiCaller } from "api";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function generateMetadata() {
  const t = await getTranslations();

  return {
    title: t("settings.team.title"),
  };
}

export default async function TeamSettingsPage() {
  const apiCaller = await createApiCaller();
  const user = await apiCaller.auth.user();
  const teamSlug = cookies().get(TEAM_SLUG_COOKIE_NAME)?.value as string;

  if (!user) redirect("/auth/login");

  const { teamMemberships } = user;

  const { team } =
    teamMemberships!.find((membership) => membership.team.slug === teamSlug) ??
    teamMemberships![0];

  const memberships = await apiCaller.team.memberships({
    teamId: team.id,
  });

  const invitations = await apiCaller.team.invitations({
    teamId: team.id,
  });

  return (
    <div className="grid grid-cols-1 gap-6">
      <InviteMemberForm teamId={team.id} />
      <TeamMembersBlock memberships={memberships} invitations={invitations} />
    </div>
  );
}
