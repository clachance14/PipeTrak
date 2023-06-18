export enum AuthView {
  SignIn = "signin",
  SignUp = "signup",
  ForgotPassword = "forgot-password",
  ResetPassword = "reset-password",
}

export type AuthPaths = Record<`${AuthView}`, string>;

export type AuthComponent = (props: {
  view?: AuthView;
  paths: AuthPaths;
}) => JSX.Element;

export type AuthHandlerReturnType = Promise<void | {
  error: {
    type: string;
    message: string;
  };
}>;

export type SignInHandler = (
  params:
    | {
        method: "email";
        email: string;
      }
    | {
        method: "password";
        email: string;
        password: string;
      }
    | {
        method: "oauth";
        provider: string;
      },
) => AuthHandlerReturnType;

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
