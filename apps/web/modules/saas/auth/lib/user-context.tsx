"use client";

import { ApiOutput, User } from "api";
import { TeamMemberRole } from "database";
import { PropsWithChildren, createContext, useEffect, useState } from "react";
import { getUser, registerAuthEventListener } from "../provider";

type UserContext = {
  user: null | User;
  setUser: (user: null | User) => void;
  loaded: boolean;
  teamRole: TeamMemberRole | null;
};

export const userContext = createContext<UserContext>({
  user: null,
  setUser: () => {},
  loaded: false,
  teamRole: null,
});

export function UserContextProvider({
  children,
  initialUser,
  teamRole,
}: PropsWithChildren<{
  initialUser: ApiOutput["user"]["me"];
  teamRole?: TeamMemberRole;
}>) {
  const [loaded, setLoaded] = useState(false);
  const [user, setUser] = useState<null | User>(initialUser);

  useEffect(() => {
    (async () => {
      if (!user) setUser(await getUser());
      setLoaded(true);
    })();

    const { unsubscribe } = registerAuthEventListener((_event, payload) => {
      const user = payload?.user ?? null;
      setUser(user);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <userContext.Provider
      value={{ user, setUser, loaded, teamRole: teamRole ?? null }}
    >
      {children}
    </userContext.Provider>
  );
}
