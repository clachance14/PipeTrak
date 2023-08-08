import { createSupabaseAdminClient } from "./admin-client";
import { mapSupabaseUserToUser } from "./helper";

type User = {
  id: string;
  email: string;
  name: string;
};

export const getUserByEmail = async (email: string): Promise<User> => {
  const supabaseClient = createSupabaseAdminClient();

  const { data, error } = await supabaseClient
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const getUserById = async (id: string): Promise<User> => {
  const supabaseClient = createSupabaseAdminClient();

  const { data, error } = await supabaseClient.auth.admin.getUserById(id);

  if (error) {
    throw error;
  }

  return mapSupabaseUserToUser(data.user);
};
