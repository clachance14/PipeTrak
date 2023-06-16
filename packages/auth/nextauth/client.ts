import { signIn, signOut as signOutHandler } from "next-auth/react";
import { AuthProviderClientApi } from "../types";

export const signInWithPassword: AuthProviderClientApi["signInWithPassword"] =
  async (email, password, options) => {
    return await signIn("credentials", {
      email,
      password,
      callbackUrl: options?.callbackUrl,
      redirect: false,
    });
  };

export const signInWithEmail: AuthProviderClientApi["signInWithEmail"] = async (
  email,
  options,
) => {
  return await signIn("email", {
    email,
    callbackUrl: options?.callbackUrl,
    redirect: false,
  });
};

export const signInWithOAuth: AuthProviderClientApi["signInWithOAuth"] = async (
  provider: string,
  options,
) => {
  return await signIn(provider, {
    callbackUrl: options?.callbackUrl,
    redirect: false,
  });
};

export const signOut: AuthProviderClientApi["signOut"] = async (options) => {
  await signOutHandler({
    callbackUrl: options?.callbackUrl,
    redirect: false,
  });
};
