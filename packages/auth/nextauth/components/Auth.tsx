"use client";

import { createAuthComponent } from "auth-ui/util";
import { signIn } from "next-auth/react";

export const Auth = createAuthComponent({
  signInHandler: async (params) => {
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
});
