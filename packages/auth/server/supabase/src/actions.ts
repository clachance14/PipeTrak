import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { sendEmail } from "mail";
import { cookies } from "next/headers";
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

export const createUser = async (payload: {
  name: string;
  email: string;
  password: string;
}): Promise<User> => {
  const supabaseClient = createSupabaseAdminClient();

  const { data, error } = await supabaseClient.auth.admin.generateLink({
    type: "signup",
    email: payload.email,
    password: payload.password,
  });

  if (error) {
    throw error;
  }

  await sendEmail({
    templateId: "newUser",
    to: payload.email,
    subject: "Welcome to the supastarter",
  });

  return mapSupabaseUserToUser(data.user);
};

export const updateUserEmail = async (email: string) => {
  const supabaseClient = createRouteHandlerClient({ cookies });

  const { error } = await supabaseClient.auth.updateUser({
    email,
  });

  if (error) {
    throw error;
  }
};

export const updateUserName = async (name: string) => {
  const supabaseClient = createRouteHandlerClient({ cookies });

  const { error } = await supabaseClient.auth.updateUser({
    data: {
      name,
    },
  });

  if (error) {
    throw error;
  }
};

export const updateUserPassword = async (password: string) => {
  const supabaseClient = createRouteHandlerClient({ cookies });

  const { error } = await supabaseClient.auth.updateUser({
    password,
  });

  if (error) {
    throw error;
  }
};
