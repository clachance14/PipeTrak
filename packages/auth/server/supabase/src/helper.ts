import { User as SupabaseUser } from "@supabase/supabase-js";
import { User } from "../../../types";

export const mapSupabaseUserToUser = (user: SupabaseUser): User => {
  return {
    id: user.id,
    name: user.user_metadata?.full_name ?? user.email,
    email: user.email!,
  };
};
