"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { config } from "../../../config";
import { AuthComponent } from "../../../types";
import { useUser } from "../provider";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { SigninForm } from "./SigninForm";
import { SignupForm } from "./SignupForm";

export const Auth: AuthComponent = ({ view, paths }) => {
  const user = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectToParam = searchParams.get("redirectTo");

  if (user) {
    router.replace(redirectToParam ?? config.redirectAfterSignin);
  }

  if (!view) return null;

  switch (view) {
    case "signup":
      return <SignupForm paths={paths} />;

    case "forgot-password":
      return <ForgotPasswordForm paths={paths} />;

    default:
      return <SigninForm paths={paths} />;
  }
};
