import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { User } from "../types";
import { createAdminClient, mapSupabaseUser } from "./util";

export const getUser = async (): Promise<User | null> => {
  const supabaseClient = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  if (!session?.user) return null;

  const { user } = session;

  const formattedUserObject = mapSupabaseUser(user);

  return formattedUserObject;
};

export const getUsersById = async (ids: string[]): Promise<User[]> => {
  const supabaseClient = createAdminClient();

  const users: User[] = [];

  for (const id of ids) {
    const {
      data: { user },
    } = await supabaseClient.auth.admin.getUserById(id);

    if (user) {
      users.push(mapSupabaseUser(user));
    }
  }

  return users;
};
