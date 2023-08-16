"use client";

import { useUser } from "@lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthView } from "../types";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { LoginForm } from "./LoginForm";
import { SetupForm } from "./SetupForm";
import { SignupForm } from "./SignupForm";

export const Auth = ({ view }: { view: AuthView }) => {
  const { user, teams, activeTeam, loaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!Object.values(AuthView).includes(view)) {
      router.replace("/auth/login");
    }
  }, [view]);

  useEffect(() => {
    if (loaded && user) {
      if (teams.length === 0) {
        router.replace("/auth/setup");
        return;
      }

      if (activeTeam) {
        router.replace(`/${activeTeam?.slug}/dashboard`);
      }
    }
  }, [loaded, user, teams, activeTeam]);

  switch (view) {
    case AuthView.SignUp:
      return <SignupForm />;

    case AuthView.ForgotPassword:
      return <ForgotPasswordForm />;

    case AuthView.Setup:
      return <SetupForm />;

    case AuthView.Login:
      return <LoginForm />;

    default:
      return null;
  }
};
