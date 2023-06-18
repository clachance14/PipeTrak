import { signOut as signOutHandler } from "next-auth/react";

export const signOut = async () => {
  await signOutHandler({
    // callbackUrl: options?.callbackUrl,
    redirect: false,
  });
};
