import { AuthComponent, SignInHandler } from "../../types";
import { SigninForm } from "../components/SigninForm";
import { SignupForm } from "../components/SignupForm";

export function createAuthComponent({
  signInHandler,
}: {
  signInHandler: SignInHandler;
}) {
  const Auth: AuthComponent = ({ view, paths }) => {
    switch (view) {
      case "signup":
        return <SignupForm paths={paths} />;

      default:
        return <SigninForm paths={paths} onSignIn={signInHandler} />;
    }
  };

  return Auth;
}
