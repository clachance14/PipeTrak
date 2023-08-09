import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { User } from "../types";
import { env } from "./env.mjs";

const supabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ADMIN_SECRET,
  {
    auth: {
      persistSession: false,
    },
  },
);

const accessTokenCache = new Map<
  string,
  {
    user: User;
    expiresAt: number;
  }
>();

export const getUser = async (): Promise<User | null> => {
  const access_token = cookies().get("sb:access-token")?.value;
  const refresh_token = cookies().get("sb:refresh-token")?.value;

  if (!access_token || !refresh_token) {
    return null;
  }

  const cachedUser = accessTokenCache.get(access_token);

  if (cachedUser && cachedUser.expiresAt > Date.now()) {
    return cachedUser.user;
  }

  await supabaseClient.auth.setSession({
    access_token,
    refresh_token,
  });

  const {
    data: { user },
    error,
  } = await supabaseClient.auth.getUser();

  if (error || !user) {
    return null;
  }

  const formattedUserObject = {
    id: user.id,
    name: user.user_metadata?.full_name ?? "",
    email: user.email!,
  };

  accessTokenCache.set(access_token, {
    user: formattedUserObject,
    expiresAt: Date.now() + 1 * 60 * 1000, // cache for 5 minutes
  });

  return formattedUserObject;
};
