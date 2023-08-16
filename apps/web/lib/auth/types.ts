import { FC, PropsWithChildren } from "react";

export type User = {
  id: string;
  name: string;
  email: string;
};

export type AuthProviderClientModule = {
  login: (
    params:
      | {
          method: "email";
          email: string;
          redirectTo?: string;
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
  ) => Promise<void>;
  signUp: (params: {
    email: string;
    password: string;
    name: string;
  }) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateEmail: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  getUser: () => Promise<User | null>;
  registerAuthEventListener: (
    listener: (
      event: "SIGNED_IN" | "SIGNED_OUT" | "USER_UPDATED",
      payload: {
        user?: User | null;
      },
    ) => void,
  ) => {
    unsubscribe: () => void;
  };
  AuthProvider: FC<PropsWithChildren>;
};
