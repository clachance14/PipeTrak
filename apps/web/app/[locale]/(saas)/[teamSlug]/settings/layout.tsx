import { appConfig } from "@config";
import { PageHeader } from "@saas/shared/components";
import { createApiCaller } from "api";
import BoringAvatar from "boring-avatars";
import Link from "next-intl/link";
import { getTranslator } from "next-intl/server";
import { PropsWithChildren } from "react";

export default async function SettingsLayout({
  children,
  params: { teamSlug, locale },
}: PropsWithChildren<{ params: { teamSlug: string; locale: string } }>) {
  const t = await getTranslator(locale);

  const apiCaller = await createApiCaller();
  const user = await apiCaller.auth.user();

  const activeTeam = user?.teamMemberships?.find(
    (membership) => membership.team.slug === teamSlug,
  )?.team;

  if (!activeTeam) return null;

  return (
    <div className="container max-w-5xl py-8">
      <PageHeader
        title={t("settings.title")}
        subtitle={t("settings.subtitle")}
      />

      <div className="align-start mt-8 flex flex-col gap-8 md:flex-row">
        <div className="w-full md:max-w-[250px]">
          <div className="space-y-6">
            <div>
              <div className="flex justify-start gap-2">
                <BoringAvatar
                  size={16}
                  name={activeTeam.name}
                  variant="marble"
                  colors={appConfig.teams.avatarColors}
                />
                <h2 className="text-muted-foreground text-xs">
                  {t("settings.menu.team.title")}
                </h2>
              </div>

              <ul className="list-none">
                <li>
                  <Link href="/settings/team/general" className="block py-1">
                    {t("settings.menu.team.general")}
                  </Link>
                </li>
                <li>
                  <Link href="/settings/team/members" className="block py-1">
                    {t("settings.menu.team.members")}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-muted-foreground text-xs">
                {t("settings.menu.account.title")}
              </h2>

              <ul className="list-none">
                <li>
                  <Link href="/settings/general/general" className="block py-1">
                    {t("settings.menu.account.general")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
