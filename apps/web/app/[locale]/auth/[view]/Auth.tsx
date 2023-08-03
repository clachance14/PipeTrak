"use client";

import { appConfig } from "@config";
import { useUser } from "auth-client/provider";
import { useRouter, useSearchParams } from "next/navigation";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";

export enum AuthView {
  Login = "login",
  SignUp = "signup",
  ForgotPassword = "forgot-password",
  ResetPassword = "reset-password",
}

export const Auth = ({ view }: { view: AuthView }) => {
  const user = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectToParam = searchParams.get("redirectTo");

  if (user) {
    router.replace(redirectToParam ?? appConfig.auth.redirectAfterLogin);
  }

  if (!view) return null;

  switch (view) {
    case "signup":
      return <SignupForm />;

    case "forgot-password":
      return <ForgotPasswordForm />;

    default:
      return <LoginForm />;
  }
};
