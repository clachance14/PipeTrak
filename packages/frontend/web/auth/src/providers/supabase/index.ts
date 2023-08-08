"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { PropsWithChildren } from "react";
import { AuthProviderClientModule } from "../types";

const mapSupabaseUserToUser = (user: SupabaseUser): User => {
  return {
    id: user.id,
    name: user.user_metadata?.full_name ?? user.email,
    email: user.email!,
  };
};

const getCallbackUrl = (redirectTo?: string) => {
  const baseCallbackUrl = `${location.origin}/auth/callback`;
  return redirectTo
    ? `${baseCallbackUrl}?redirectTo=${redirectTo}`
    : baseCallbackUrl;
};

const { auth } = createClientComponentClient();

export const login: AuthProviderClientModule["login"] = async (params) => {
  const { method } = params;

  if (method === "password") {
    const { email, password } = params;
    const { error } = await auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error("Could not log in");
  } else if (method === "email") {
    const { email } = params;

    const { error } = await auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: getCallbackUrl(params.redirectTo),
      },
    });

    if (error) throw new Error("Could not log in");
  } else if (method === "oauth") {
    const { provider } = params;
    const { error } = await auth.signInWithOAuth({
      provider: provider as any,
      options: {
        redirectTo: getCallbackUrl(),
      },
    });

    if (error) throw new Error("Could not log in with OAuth provider");
  }
};

export const signOut: AuthProviderClientModule["signOut"] = async () => {
  await auth.signOut();
};

export const getUser: AuthProviderClientModule["getUser"] = async () => {
  const session = await auth.getSession();

  if (!session.data?.session?.user) return null;

  const user = session.data.session.user;

  return mapSupabaseUserToUser(user);
};

export const forgotPassword: AuthProviderClientModule["forgotPassword"] =
  async (email) => {
    const { error } = await auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/settings/account`,
    });

    if (error) throw new Error("Could not send password reset email");
  };

export const signUp: AuthProviderClientModule["signUp"] = async (params) => {
  const { email, password, name } = params;

  const { error } = await auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  if (error) throw new Error("Could not sign up");
};

export const updateEmail: AuthProviderClientModule["updateEmail"] = async (
  email,
) => {
  const { error } = await auth.updateUser({
    email,
  });

  if (error) throw new Error("Could not update email");

  await auth.refreshSession();
};

export const updatePassword: AuthProviderClientModule["updatePassword"] =
  async (password) => {
    const { error } = await auth.updateUser({
      password,
    });

    if (error) throw new Error("Could not update email");

    await auth.refreshSession();
  };

export const updateName: AuthProviderClientModule["updateName"] = async (
  name,
) => {
  const { error } = await auth.updateUser({
    data: {
      name,
    },
  });

  if (error) throw new Error("Could not update email");

  await auth.refreshSession();
};

export const registerAuthEventListener: AuthProviderClientModule["registerAuthEventListener"] =
  (callback) => {
    auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        callback("SIGNED_IN", {
          user: session?.user ? mapSupabaseUserToUser(session.user) : undefined,
        });
      } else if (event === "USER_UPDATED") {
        callback("USER_UPDATED", {
          user: session?.user ? mapSupabaseUserToUser(session.user) : undefined,
        });
      } else if (event === "SIGNED_OUT") {
        callback("SIGNED_OUT", {
          user: null,
        });
      }
    });
  };

export const AuthProvider: React.FC<PropsWithChildren> = ({
  children,
}: PropsWithChildren) => {
  return children;
};
