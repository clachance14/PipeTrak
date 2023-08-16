"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Icon,
} from "@components";
import { appConfig } from "@config";
import { createTeamDialogOpen } from "@lib/state/dashboard";
import { Team } from "api";
import BoringAvatar from "boring-avatars";
import { useSetAtom } from "jotai";
import Cookies from "js-cookie";
import { useTranslations } from "next-intl";
import { useParams, usePathname, useRouter } from "next/navigation";
import { CreateTeamDialog } from "./CreateTeamDialog";

export function TeamSelect({ teams }: { teams: Team[] }) {
  const t = useTranslations("dashboard");
  const setCreateTeamDialogOpen = useSetAtom(createTeamDialogOpen);
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { teamSlug } = params;
  const activeTeam = teams.find((team) => team.slug === teamSlug);

  const switchTeam = (slug: string) => {
    Cookies.set("team-slug", slug, { path: "/", expires: 30 });
    router.replace(pathname.replace(activeTeam.slug, slug));
  };

  if (!activeTeam) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="border-border focus-visible:ring-ring focus-visible:border-primary flex w-full items-center justify-between rounded-md border px-3 py-2 text-left outline-none focus-visible:ring-1">
          <div className="flex flex-1 items-center justify-start gap-2 text-sm">
            <BoringAvatar
              size={24}
              name={activeTeam.name}
              variant="marble"
              colors={appConfig.teams.avatarColors}
            />
            <span className="flex-1 truncate">{activeTeam.name}</span>
          </div>
          <Icon.select className="h-4 w-4 opacity-50" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-full">
          <DropdownMenuRadioGroup
            value={activeTeam.slug}
            onValueChange={switchTeam}
          >
            {teams.map((team) => (
              <DropdownMenuRadioItem
                key={team.id}
                value={team.slug}
                className="flex items-center justify-center gap-2"
              >
                <div className="flex flex-1 items-center justify-start gap-2">
                  <BoringAvatar
                    size={16}
                    name={team.name}
                    variant="marble"
                    colors={appConfig.teams.avatarColors}
                  />
                  {team.name}
                </div>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setCreateTeamDialogOpen(true)}>
              <Icon.plus className="mr-2 h-4 w-4" />
              {t("sidebar.createTeam")}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateTeamDialog />
    </>
  );
}
