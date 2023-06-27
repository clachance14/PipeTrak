import { trpc } from "api/client";
import { SessionProvider, signIn, signOut } from "next-auth/react";
import { PropsWithChildren } from "react";
import { UseAuthActions } from "../../types";

export const useAuthActions: UseAuthActions = () => {
  const signupMutation = trpc.signUp.useMutation();

  return {
    signIn: async (params) => {
      const { method } = params;

      if (method === "password") {
        const { email, password } = params;
        const response = await signIn("credentials", {
          email,
          password,
          callbackUrl: "/",
          redirect: false,
        });

        if (response?.error)
          return {
            error: {
              type: "invalid",
              message: response.error,
            },
          };
      } else if (method === "email") {
        const { email } = params;
        const response = await signIn("email", {
          email,
          callbackUrl: "/",
          redirect: false,
        });

        if (response?.error)
          return {
            error: {
              type: "invalid",
              message: response.error,
            },
          };
      } else if (method === "oauth") {
        const { provider } = params;
        const response = await signIn(provider, {
          callbackUrl: "/",
          redirect: false,
        });

        if (response?.error)
          return {
            error: {
              type: "invalid",
              message: response.error,
            },
          };
      }
    },

    signUp: async (params) => {
      const { email, password, name } = params;
      try {
        await signupMutation.mutateAsync({
          email,
          password,
          name,
        });

        await signIn("create-account", {
          email,
          // callbackUrl: config.redirectAfterSignin,
          redirect: false,
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

    signOut,
  };
};

export function AuthProvider({ children }: PropsWithChildren<{}>) {
  return <SessionProvider>{children}</SessionProvider>;
}
