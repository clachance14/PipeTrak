"use client";

import { useEffect, useState } from "react";
import { getUser, registerAuthEventListener } from "./providers/supabase";
import { User } from "./types";

export * from "./providers/supabase";

export function useUser() {
  const [user, setUser] = useState<null | User>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      setUser(await getUser());
      setLoaded(true);
    })();

    const { unsubscribe } = registerAuthEventListener((_event, payload) => {
      setUser(payload?.user ?? null);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    user,
    loaded,
  };
}
