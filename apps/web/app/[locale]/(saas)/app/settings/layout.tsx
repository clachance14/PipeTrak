import { appConfig } from "@config";
import { SettingsMenu } from "@saas/settings/components";
import { TEAM_SLUG_COOKIE_NAME } from "@saas/shared/types";
import { UserAvatar } from "@shared/components";
import { createApiCaller } from "api";
import BoringAvatar from "boring-avatars";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PropsWithChildren } from "react";

export default async function SettingsLayout({ children }: PropsWithChildren) {
  const t = await getTranslations();
  const apiCaller = await createApiCaller();
  const user = await apiCaller.auth.user();
  const teamSlug = cookies().get(TEAM_SLUG_COOKIE_NAME)?.value;

  if (!user) return redirect("/auth/login");

  const { teamMemberships } = user;

  const { team: activeTeam } =
    teamMemberships!.find((membership) => membership.team.slug === teamSlug) ??
    teamMemberships![0];

  if (!activeTeam) return null;

  const menuItems = [
    {
      title: t("settings.menu.team.title"),
      avatar: (
        <BoringAvatar
          size={32}
          name={activeTeam.name}
          variant="marble"
          colors={appConfig.teams.avatarColors}
        />
      ),
      items: [
        {
          title: t("settings.menu.team.general"),
          href: `/app/settings/team/general`,
        },
        {
          title: t("settings.menu.team.members"),
          href: `/app/settings/team/members`,
        },
        {
          title: t("settings.menu.team.billing"),
          href: `/app/settings/team/billing`,
        },
      ],
    },
    {
      title: t("settings.menu.account.title"),
      avatar: <UserAvatar name={user.name ?? ""} avatarUrl={user.avatar_url} />,
      items: [
        {
          title: t("settings.menu.account.general"),
          href: `/app/settings/account/general`,
        },
      ],
    },
  ];

  return (
    <div className="container max-w-6xl py-8">
      <div className="align-start flex flex-col gap-8 md:flex-row">
        <div className="w-full md:max-w-[200px]">
          <SettingsMenu menuItems={menuItems} />
        </div>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
