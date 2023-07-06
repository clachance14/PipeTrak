import { createClient } from "@supabase/supabase-js";
import { env } from "../env.mjs";

export function createSupabaseAdminClient() {
  const client = createClient(env.SUPABASE_URL, env.SUPABASE_ADMIN_SECRET, {});

  return client;
}
