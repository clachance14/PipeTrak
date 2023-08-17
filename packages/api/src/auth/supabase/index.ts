import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { User } from "../types";
import { env } from "./env.mjs";

export const getUser = async (): Promise<User | null> => {
  const supabaseClient = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  if (!session?.user) return null;

  const { user } = session;

  const formattedUserObject = {
    id: user.id,
    name: user.user_metadata?.full_name ?? "",
    email: user.email!,
  };

  return formattedUserObject;
};

export const getUsersById = async (ids: string[]): Promise<User[]> => {
  const supabaseClient = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_SECRET,
    {
      auth: {
        persistSession: false,
      },
    },
  );

  const users: User[] = [];

  for (const id of ids) {
    const {
      data: { user },
    } = await supabaseClient.auth.admin.getUserById(id);

    if (user) {
      users.push({
        id: user.id,
        name: user.user_metadata?.full_name ?? "",
        email: user.email!,
      });
    }
  }

  return users;
};
