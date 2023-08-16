"use client";

import { getCookie, setCookie } from "@lib/util";
import type { Team } from "api";
import { apiClient } from "api/client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUser, registerAuthEventListener } from "./supabase";
import { User } from "./types";

export * from "./supabase";

export const ACTIVE_TEAM_ID_COOKIE_KEY = "activeTeamId";

export function useUser() {
  const [user, setUser] = useState<null | User>(null);
  const [loaded, setLoaded] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const {
    data: teams,
    isFetched: teamsLoaded,
    remove: removeTeams,
    refetch: reloadTeams,
  } = apiClient.user.teams.useQuery(undefined, {
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: !!user,
  });
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);

  useEffect(() => {
    (async () => {
      setUser(await getUser());
      setLoaded(true);
    })();

    const { unsubscribe } = registerAuthEventListener((_event, payload) => {
      setUser(payload?.user ?? null);

      if (!payload?.user) {
        removeTeams();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (teams?.length) {
      const activeTeamCookie = getCookie(ACTIVE_TEAM_ID_COOKIE_KEY);

      let team = teams[0];

      if (activeTeamCookie)
        team = teams.find((t) => t.id === activeTeamCookie) ?? team;

      setCookie(ACTIVE_TEAM_ID_COOKIE_KEY, team.id, 30);
      setActiveTeam(team);

      return;
    }

    setActiveTeam(null);
  }, [teams]);

  const switchTeam = (teamId: string) => {
    if (!activeTeam) return;

    const team = teams?.find((t) => t.id === teamId);

    if (!team) return;

    setCookie(ACTIVE_TEAM_ID_COOKIE_KEY, team.id, 30);
    setActiveTeam(team);

    const newPathname = pathname.replace(activeTeam.slug, team.slug);

    router.replace(newPathname);
  };

  return {
    user,
    teams,
    activeTeam,
    switchTeam,
    reloadTeams,
    loaded: loaded && teamsLoaded,
  };
}
