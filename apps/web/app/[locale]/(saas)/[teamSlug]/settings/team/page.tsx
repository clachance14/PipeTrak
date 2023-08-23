import {
  ChangeTeamNameForm,
  TeamInvitationsList,
  TeamMembersList,
} from "@saas/settings/components";
import { ActionBlock } from "@saas/shared/components";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components";
import { createApiCaller } from "api";
import { getTranslator } from "next-intl/server";

export async function generateMetadata({ params: { locale } }) {
  const t = await getTranslator(locale);

  return {
    title: t("settings.team.title"),
  };
}

export default async function AccountSettingsPage({
  params: { teamSlug, locale },
}: {
  params: { teamSlug: string; locale: string };
}) {
  const apiCaller = await createApiCaller();
  const team = await apiCaller.team.getBySlug({
    slug: teamSlug,
  });
  const invitations = await apiCaller.team.invitations({
    teamId: team.id,
  });
  const t = await getTranslator(locale);

  return (
    <div className="grid gap-6">
      <ChangeTeamNameForm initialValue={team.name} teamId={team.id} />

      <ActionBlock title={t("settings.team.members.title")}>
        <Tabs>
          <TabsList>
            <TabsTrigger value="members">
              {t("settings.team.members.activeMembers")}
            </TabsTrigger>
            <TabsTrigger value="invitations">
              {t("settings.team.members.pendingInvitations")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="members">
            <TeamMembersList team={team} memberships={team.memberships} />
          </TabsContent>
          <TabsContent value="invitations">
            <TeamInvitationsList invitations={invitations} />
          </TabsContent>
        </Tabs>
      </ActionBlock>
    </div>
  );
}
