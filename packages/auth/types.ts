export type AuthView =
  | "signin"
  | "signup"
  | "forgot-password"
  | "reset-password";

export type SocialSigninProvider =
  | "apple"
  | "azure"
  | "bitbucket"
  | "discord"
  | "facebook"
  | "github"
  | "gitlab"
  | "google"
  | "keycloak"
  | "linkedin"
  | "notion"
  | "slack"
  | "spotify"
  | "twitch"
  | "twitter"
  | "workos";

export type SessionAction = "updateSession" | "switchWorkspace";

// api for auth module

export type AuthProviderClientApi = {
  signInWithPassword: (
    email: string,
    password: string,
    options?: { callbackUrl?: string },
  ) => Promise<void | { error: unknown }>;
  signInWithEmail: (
    email: string,
    options?: { callbackUrl?: string },
  ) => Promise<void | { error: unknown }>;
  signInWithOAuth: (
    provider: string,
    options?: { callbackUrl?: string },
  ) => Promise<void | { error: unknown }>;
  signOut: (options?: {
    callbackUrl?: string;
  }) => Promise<void | { error: unknown }>;
};
