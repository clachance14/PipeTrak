import { AuthComponent, SignInHandler } from "../../types";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { SigninForm } from "./SigninForm";
import { SignupForm } from "./SignupForm";

export function createAuthComponent({
  signInHandler,
}: {
  signInHandler: SignInHandler;
}) {
  const Auth: AuthComponent = ({ view, paths }) => {
    if (!view) return null;

    switch (view) {
      case "signup":
        return <SignupForm paths={paths} />;

      case "forgot-password":
        return <ForgotPasswordForm paths={paths} />;

      case "reset-password":
        return <ResetPasswordForm paths={paths} />;

      default:
        return <SigninForm paths={paths} onSignIn={signInHandler} />;
    }
  };

  return Auth;
}
