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
}) => JSX.Element | null;

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

export type SignUpHandler = (params: {
  email: string;
  password: string;
  name: string;
}) => AuthHandlerReturnType;

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

export type UserSession = {
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export type UseAuthActions = () => {
  signIn: SignInHandler;
  signUp: SignUpHandler;
  forgotPassword: (params: { email: string }) => AuthHandlerReturnType;
  signOut: () => Promise<void>;
};
