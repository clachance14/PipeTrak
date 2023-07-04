"use client";

import { useRouter } from "next/navigation";
import { AuthComponent } from "../../../types";
import { useUser } from "../provider";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { SigninForm } from "./SigninForm";
import { SignupForm } from "./SignupForm";

export const Auth: AuthComponent = ({
  view,
  paths,
  redirectIfAuthenticated,
}) => {
  const user = useUser();
  const router = useRouter();

  if (user && redirectIfAuthenticated) {
    router.replace(redirectIfAuthenticated);
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
