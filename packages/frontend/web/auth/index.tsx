"use client";

import {
  getUser,
  registerAuthEventListener,
} from "@supastarter/frontend/web/auth-supabase";
import { useEffect, useState } from "react";
import { User } from "../../types";

export * from "auth-client-supabase";

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
