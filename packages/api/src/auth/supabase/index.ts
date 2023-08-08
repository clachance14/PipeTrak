import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { User } from "../types";
import { env } from "./env.mjs";

const supabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ADMIN_SECRET,
);

export const getUser = async (): Promise<User | null> => {
  const accessToken = cookies().get("sb:token")?.value;
  const refreshToken = cookies().get("sb:refresh_token")?.value;

  if (!accessToken || !refreshToken) return null;

  await supabaseClient.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  const session = await supabaseClient.auth.getSession();
  const user = session.data?.session?.user;

  if (!user) return null;

  return {
    id: user.id,
    email: user.email!,
    name: user.user_metadata.full_name ?? "",
    role: "user",
  };
};
