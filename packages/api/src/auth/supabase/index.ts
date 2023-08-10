import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { User } from "../types";

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
