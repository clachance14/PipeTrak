"use client";

import { useEffect, useState } from "react";
import { getUser, registerAuthEventListener } from "./supabase";
import { User } from "./types";

export * from "./supabase";

export function useUser() {
  const [user, setUser] = useState<null | User>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      setUser(await getUser());
      setLoaded(true);
    })();

    registerAuthEventListener((_event, payload) => {
      setUser(payload?.user ?? null);
    });
  }, []);

  return { user, loaded };
}
