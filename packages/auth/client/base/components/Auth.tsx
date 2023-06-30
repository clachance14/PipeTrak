import { AuthComponent } from "../../../types";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { SigninForm } from "./SigninForm";
import { SignupForm } from "./SignupForm";

export const Auth: AuthComponent = ({ view, paths }) => {
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
