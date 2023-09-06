"use client";

import { apiClient } from "@shared/lib";
import { ApiOutput } from "api";
import { TeamMemberRole } from "database";
import { PropsWithChildren, createContext, useEffect, useState } from "react";

type User = ApiOutput["auth"]["user"];

type UserContext = {
  user: User;
  reloadUser: () => Promise<void>;
  logout: () => Promise<void>;
  loaded: boolean;
  teamRole: TeamMemberRole | null;
};

const authBroadcastChannel = new BroadcastChannel("auth");
type AuthEvent = {
  type: "login" | "logout";
  user: User | null;
};

export const userContext = createContext<UserContext>({
  user: null,
  reloadUser: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  loaded: false,
  teamRole: null,
});

export function UserContextProvider({
  children,
  initialUser,
  teamRole,
}: PropsWithChildren<{
  initialUser: User;
  teamRole?: TeamMemberRole;
}>) {
  const [loaded, setLoaded] = useState(!!initialUser);
  const [user, setUser] = useState<User>(initialUser);
  const userQuery = apiClient.auth.user.useQuery(undefined, {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: !initialUser,
  });
  const logoutMutation = apiClient.auth.logout.useMutation();

  const reloadUser = async () => {
    await userQuery.refetch();
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
    userQuery.remove();
    setUser(null);
    authBroadcastChannel.postMessage({
      type: "logout",
      user: null,
    } satisfies AuthEvent);
  };

  useEffect(() => {
    if (userQuery.data) {
      setUser(userQuery.data);
      setLoaded(true);
    }
  }, [userQuery.data]);

  // useEffect(() => {
  //   const handleAuthEvent = async (event: MessageEvent<AuthEvent>) => {
  //     if (JSON.stringify(event.data.user) !== JSON.stringify(user))
  //       setUser(event.data.user);
  //   };

  //   authBroadcastChannel.addEventListener("message", handleAuthEvent);

  //   return () =>
  //     authBroadcastChannel.removeEventListener("message", handleAuthEvent);
  // }, []);

  // broadcast user when it changes
  // useEffect(() => {
  //   if (user)
  //     authBroadcastChannel.postMessage({
  //       type: "login",
  //       user,
  //     } satisfies AuthEvent);
  // }, [user]);

  return (
    <userContext.Provider
      value={{ user, reloadUser, logout, loaded, teamRole: teamRole ?? null }}
    >
      {children}
    </userContext.Provider>
  );
}
