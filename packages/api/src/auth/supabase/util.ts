import { User as SupabaseUser, createClient } from "@supabase/supabase-js";
import { User } from "../types";
import { env } from "./env.mjs";

export function createAdminClient() {
  const supabaseClient = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_SECRET,
    {
      auth: {
        persistSession: false,
      },
    },
  );

  return supabaseClient;
}

export function mapSupabaseUser(user: SupabaseUser): User {
  return {
    id: user.id,
    name: user.user_metadata?.full_name ?? "",
    email: user.email!,
  };
}
