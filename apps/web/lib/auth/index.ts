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
    data: claims,
    isFetched: claimsLoaded,
    remove: removeClaims,
  } = apiClient.user.claims.useQuery(undefined, {
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
        removeClaims();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (claims?.teams?.length) {
      const activeTeamCookie = getCookie(ACTIVE_TEAM_ID_COOKIE_KEY);

      let team = claims.teams[0];

      if (activeTeamCookie)
        team = claims.teams.find((t) => t.id === activeTeamCookie) ?? team;

      setCookie(ACTIVE_TEAM_ID_COOKIE_KEY, team.id, 30);
      setActiveTeam(team);

      return;
    }

    setActiveTeam(null);
  }, [claims?.teams]);

  const switchTeam = (teamId: string) => {
    if (!activeTeam) return;

    const team = claims?.teams?.find((t) => t.id === teamId);

    if (!team) return;

    setCookie(ACTIVE_TEAM_ID_COOKIE_KEY, team.id, 30);
    setActiveTeam(team);

    const newPathname = pathname.replace(activeTeam.slug, team.slug);

    router.replace(newPathname);
  };

  return {
    user,
    ...claims,
    activeTeam,
    switchTeam,
    loaded: loaded && claimsLoaded,
  };
}
