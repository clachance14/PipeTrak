import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { UserSession } from "../../../types";

export const getUserSession = async (): Promise<UserSession | null> => {
  const supabaseClient = createRouteHandlerClient({ cookies });
  const session = await supabaseClient.auth.getSession();
  const user = session.data?.session?.user;

  if (!user) return null;

  return {
    user: {
      id: user.id,
      email: user.email!,
      name: user.user_metadata.full_name ?? "",
    },
  };
};
