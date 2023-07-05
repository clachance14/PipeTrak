import {
  User,
  createClientComponentClient,
} from "@supabase/auth-helpers-nextjs";
import { trpc } from "api/client";
import { PropsWithChildren, useEffect, useState } from "react";
import { UseAuthActions, UserSession } from "../../types";

const callbackEndpoint = `/api/auth/supabase/callback`;

export const useAuthActions: UseAuthActions = () => {
  const signupMutation = trpc.signUp.useMutation();
  const { auth } = createClientComponentClient();

  return {
    signIn: async (params) => {
      const { method } = params;

      if (method === "password") {
        const { email, password } = params;
        const response = await auth.signInWithPassword({
          email,
          password,
        });

        if (response?.error)
          return {
            error: {
              type: "invalid",
              message: "Invalid email or password",
            },
          };
      } else if (method === "email") {
        const { email } = params;
        const response = await auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${location.origin}${callbackEndpoint}`,
          },
        });

        if (response?.error)
          return {
            error: {
              type: "invalid",
              message: "Could not send email",
            },
          };
      } else if (method === "oauth") {
        const { provider } = params;
        const response = await auth.signInWithOAuth({
          provider: provider as any,
          options: {
            redirectTo: `${location.origin}${callbackEndpoint}`,
          },
        });

        if (response?.error)
          return {
            error: {
              type: "invalid",
              message: "Could not sign in",
            },
          };
      }
    },

    forgotPassword: async ({ email }) => {
      const response = await auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}/settings/account`,
      });

      if (response?.error)
        return {
          error: {
            type: "invalid",
            message: "Could not send email",
          },
        };
    },

    signUp: async (params) => {
      const { email, password, name } = params;
      try {
        await signupMutation.mutateAsync({
          email,
          password,
          name,
        });

        await auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
            },
          },
        });
      } catch (e) {
        console.error(e);
        return {
          error: {
            type: "invalid",
            message: "Could not create user",
          },
        };
      }
    },

    signOut: async () => {
      await auth.signOut();
    },

    updateSession: async (user) => {
      await auth.updateUser({
        email: user.email,
        data: {
          name: user.name,
        },
      });
      await auth.refreshSession();
    },
  };
};

export function AuthProvider({ children }: PropsWithChildren<{}>) {
  return children;
}

export const useUser = (): null | UserSession["user"] => {
  const supabaseClient = createClientComponentClient();
  const [user, setUser] = useState<UserSession["user"] | null>(null);

  const mapUser = (user: User): UserSession["user"] => ({
    id: user.id,
    email: user.email!,
    name: user.user_metadata?.name ?? "",
  });

  useEffect(() => {
    const { data: authListener } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN") {
          setUser(session?.user ? mapUser(session.user) : null);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
        }
      },
    );

    (async () => {
      const session = await supabaseClient.auth.getSession();
      if (session.data.session?.user)
        setUser(mapUser(session.data.session.user));
    })();

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return user;
};
