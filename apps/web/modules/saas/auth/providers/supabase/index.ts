"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { PropsWithChildren } from "react";
import { AuthProviderClientModule, User } from "../../types";

const supabaseClient = createClientComponentClient();

const mapSupabaseUserToUser = (user: SupabaseUser): User => {
  return {
    id: user.id,
    name: user.user_metadata?.full_name ?? user.email,
    email: user.email!,
  };
};

const getCallbackUrl = (redirectTo?: string) => {
  const baseCallbackUrl = `${location.origin}/api/auth/callback`;
  return redirectTo
    ? `${baseCallbackUrl}?redirectTo=${redirectTo}`
    : baseCallbackUrl;
};

export const login: AuthProviderClientModule["login"] = async (params) => {
  const { method } = params;

  if (method === "password") {
    const { email, password } = params;
    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error("Could not log in");
  } else if (method === "email") {
    const { email } = params;

    const { error } = await supabaseClient.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: getCallbackUrl(params.redirectTo),
      },
    });

    if (error) throw new Error("Could not log in");
  } else if (method === "oauth") {
    const { provider } = params;
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: provider as any,
      options: {
        redirectTo: getCallbackUrl(),
      },
    });

    if (error) throw new Error("Could not log in with OAuth provider");
  }
};

export const signOut: AuthProviderClientModule["signOut"] = async () => {
  await supabaseClient.auth.signOut();
};

export const getUser: AuthProviderClientModule["getUser"] = async () => {
  const session = await supabaseClient.auth.getSession();

  if (!session.data?.session?.user) return null;

  const user = session.data.session.user;

  return mapSupabaseUserToUser(user);
};

export const forgotPassword: AuthProviderClientModule["forgotPassword"] =
  async (email) => {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/settings/account`,
    });

    if (error) throw new Error("Could not send password reset email");
  };

export const signUp: AuthProviderClientModule["signUp"] = async (params) => {
  const { email, password, name } = params;

  const { error } = await supabaseClient.auth.signUp({
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
  const { error } = await supabaseClient.auth.updateUser({
    email,
  });

  if (error) throw new Error("Could not update email");

  await supabaseClient.auth.refreshSession();
};

export const updatePassword: AuthProviderClientModule["updatePassword"] =
  async (password) => {
    const { error } = await supabaseClient.auth.updateUser({
      password,
    });

    if (error) throw new Error("Could not update email");

    await supabaseClient.auth.refreshSession();
  };

export const updateName: AuthProviderClientModule["updateName"] = async (
  name,
) => {
  const { error } = await supabaseClient.auth.updateUser({
    data: {
      name,
    },
  });

  if (error) throw new Error("Could not update email");

  await supabaseClient.auth.refreshSession();
};

export const registerAuthEventListener: AuthProviderClientModule["registerAuthEventListener"] =
  (callback) => {
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((event, session) => {
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

    return {
      unsubscribe: subscription?.unsubscribe,
    };
  };

export const getAuthorizationToken = async () => {
  const session = await supabaseClient.auth.getSession();
  return session?.data.session?.access_token;
};

export const AuthProvider: React.FC<PropsWithChildren> = ({
  children,
}: PropsWithChildren) => {
  return children;
};
